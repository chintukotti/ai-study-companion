import time
import uuid
import asyncio
import fitz
from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, Dict, Any
from starlette.concurrency import run_in_threadpool
import logging

from app.extractor import extract_page_with_ocr_fallback, TESSERACT_AVAILABLE
from app.chunker import PageAwareRecursiveChunker

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Document Processing Microservice")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

JOBS: Dict[str, Dict[str, Any]] = {}
START_TIME = time.time()

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "tesseract_available": TESSERACT_AVAILABLE,
        "pymupdf_version": fitz.version[0],
        "uptime": time.time() - START_TIME
    }

def process_pdf_sync(file_bytes: bytes, chunk_size: int, chunk_overlap: int, min_chars: int) -> Dict[str, Any]:
    start_time = time.time()
    document_id = str(uuid.uuid4())
    
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    total_pages = len(doc)
    
    pages_data = []
    for i in range(total_pages):
        page = doc[i]
        page_info = extract_page_with_ocr_fallback(page, min_chars=min_chars)
        pages_data.append(page_info)
        
    doc.close()
    
    chunker = PageAwareRecursiveChunker(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    chunks_data = chunker.chunk_extracted_pages(pages_data, document_id)
    
    processing_time_sec = time.time() - start_time
    
    return {
        "document_id": document_id,
        "total_pages": total_pages,
        "total_chunks": len(chunks_data),
        "processing_time_sec": processing_time_sec,
        "pages": pages_data,
        "chunks": chunks_data
    }

@app.post("/api/v1/process")
async def process_document(
    file: UploadFile = File(...),
    chunk_size: int = Form(1000),
    chunk_overlap: int = Form(150),
    min_chars: int = Form(50)
):
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
    content = await file.read()
    
    try:
        result = await run_in_threadpool(
            process_pdf_sync,
            content,
            chunk_size,
            chunk_overlap,
            min_chars
        )
        return result
    except Exception as e:
        logger.error(f"Processing failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def process_job(job_id: str, file_bytes: bytes, chunk_size: int, chunk_overlap: int, min_chars: int):
    try:
        JOBS[job_id]["status"] = "processing"
        result = process_pdf_sync(file_bytes, chunk_size, chunk_overlap, min_chars)
        JOBS[job_id]["status"] = "completed"
        JOBS[job_id]["result"] = result
    except Exception as e:
        JOBS[job_id]["status"] = "failed"
        JOBS[job_id]["error"] = str(e)
        logger.error(f"Job {job_id} failed: {str(e)}")

@app.post("/api/v1/process-async", status_code=202)
async def process_document_async(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    chunk_size: int = Form(1000),
    chunk_overlap: int = Form(150),
    min_chars: int = Form(50)
):
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
    content = await file.read()
    job_id = str(uuid.uuid4())
    
    JOBS[job_id] = {
        "job_id": job_id,
        "status": "pending",
        "result": None,
        "error": None
    }
    
    background_tasks.add_task(
        process_job,
        job_id,
        content,
        chunk_size,
        chunk_overlap,
        min_chars
    )
    
    return {"job_id": job_id, "status": "pending"}

@app.get("/api/v1/jobs/{job_id}")
async def get_job_status(job_id: str):
    if job_id not in JOBS:
        raise HTTPException(status_code=404, detail="Job not found")
        
    return JOBS[job_id]
