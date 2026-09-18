import uuid
from typing import List, Dict, Any

class PageAwareRecursiveChunker:
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 150):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.separators = ['\n\n', '\n', '. ', '? ', '! ', ' ', '']
        
    def chunk_extracted_pages(self, pages: List[Dict[str, Any]], document_id: str) -> List[Dict[str, Any]]:
        global_chunk_index = 0
        all_chunks = []
        
        for page in pages:
            text = page.get("text", "")
            page_number = page.get("page_number", 0)
            method = page.get("method", "native")
            
            if not text.strip():
                continue
                
            def recursive_split(txt: str, seps: List[str]) -> List[str]:
                if len(txt) <= self.chunk_size:
                    return [txt]
                for sep in seps:
                    if sep == "":
                        return [txt[i:i+self.chunk_size] for i in range(0, len(txt), self.chunk_size - self.chunk_overlap)]
                    if sep in txt:
                        parts = txt.split(sep)
                        res = []
                        curr = parts[0]
                        for p in parts[1:]:
                            if len(curr) + len(sep) + len(p) <= self.chunk_size:
                                curr += sep + p
                            else:
                                res.append(curr)
                                overlap_text = curr[-self.chunk_overlap:] if self.chunk_overlap > 0 else ""
                                curr = overlap_text + sep + p if sep != " " else overlap_text + p
                        if curr:
                            res.append(curr)
                        
                        final_res = []
                        for c in res:
                            if len(c) > self.chunk_size:
                                try:
                                    next_seps = seps[seps.index(sep)+1:]
                                except ValueError:
                                    next_seps = [""]
                                final_res.extend(recursive_split(c, next_seps))
                            else:
                                final_res.append(c)
                        return final_res
                return [txt[i:i+self.chunk_size] for i in range(0, len(txt), self.chunk_size - self.chunk_overlap)]

            page_chunks_text = recursive_split(text, self.separators)
            
            for chunk_text in page_chunks_text:
                if chunk_text.strip():
                    all_chunks.append({
                        "chunk_id": str(uuid.uuid4()),
                        "document_id": document_id,
                        "page_number": page_number,
                        "chunk_index": global_chunk_index,
                        "content": chunk_text,
                        "char_count": len(chunk_text),
                        "extraction_method": method
                    })
                    global_chunk_index += 1
                    
        return all_chunks
