import fitz
import pytesseract
from PIL import Image, ImageEnhance, ImageFilter
import logging
import io

logger = logging.getLogger(__name__)

def check_tesseract_available():
    try:
        pytesseract.get_tesseract_version()
        return True
    except Exception:
        return False

TESSERACT_AVAILABLE = check_tesseract_available()

def extract_page_with_ocr_fallback(page, min_chars=50, ocr_dpi=300):
    page_number = page.number + 1
    text = page.get_text()
    
    # Check if native text is sufficient
    if len(text.strip()) >= min_chars:
        return {
            "page_number": page_number,
            "text": text,
            "method": "native",
            "confidence": 1.0,
            "char_count": len(text)
        }
        
    # Check if page has images
    image_list = page.get_images(full=True)
    if not image_list:
        return {
            "page_number": page_number,
            "text": text,
            "method": "native",
            "confidence": 1.0,
            "char_count": len(text)
        }
        
    if not TESSERACT_AVAILABLE:
        logger.warning("Tesseract OCR is not available. Falling back to native text extraction.")
        return {
            "page_number": page_number,
            "text": text,
            "method": "native",
            "confidence": 1.0,
            "char_count": len(text)
        }
        
    # Run OCR
    try:
        pix = page.get_pixmap(dpi=ocr_dpi)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        
        # Preprocess
        img = img.convert('L') # Grayscale
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(2.0) # Contrast
        img = img.filter(ImageFilter.SHARPEN) # Sharpen
        
        # pytesseract OCR
        # Get data with confidence
        data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)
        text_parts = []
        confidences = []
        
        for i in range(len(data['text'])):
            word = data['text'][i].strip()
            conf = int(data['conf'][i])
            if word and conf > 0:
                text_parts.append(word)
                confidences.append(conf)
                
        ocr_text = " ".join(text_parts)
        avg_conf = sum(confidences) / len(confidences) / 100.0 if confidences else 0.0
        
        return {
            "page_number": page_number,
            "text": ocr_text,
            "method": "ocr",
            "confidence": avg_conf,
            "char_count": len(ocr_text)
        }
    except Exception as e:
        logger.error(f"OCR failed for page {page_number}: {str(e)}")
        return {
            "page_number": page_number,
            "text": text,
            "method": "native",
            "confidence": 1.0,
            "char_count": len(text)
        }
