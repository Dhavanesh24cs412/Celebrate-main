import threading
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
import uvicorn
import io
import numpy as np
from PIL import Image
from utils import load_model, predict_mask, apply_mask_to_image
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Magic Cut AI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state
predictor = None
service_state = "starting"

def initialize_model():
    global predictor, service_state
    try:
        logger.info("Initializing SAM model in background...")
        predictor = load_model()
        service_state = "ready"
        logger.info("SAM model loaded successfully.")
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        service_state = "unavailable"

# Start model loading in a background thread so the API can return 'starting' immediately
threading.Thread(target=initialize_model, daemon=True).start()

@app.get("/api/v1/magic-cut/status")
def get_status():
    return {
        "service": "magic-cut",
        "api_version": "1.0.0",
        "model": "sam_vit_b_01ec64",
        "model_version": "1.0",
        "state": service_state,
        "capabilities": {
            "single_point_extraction": True,
            "multi_object": False,
            "alpha_png": True
        }
    }

@app.post("/api/v1/magic-cut/extract")
async def extract_object(
    file: UploadFile = File(...),
    x: float = Form(...),
    y: float = Form(...)
):
    if service_state != "ready" or predictor is None:
        raise HTTPException(status_code=503, detail="Service not ready")

    try:
        # Read image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Apply EXIF rotation if present
        from PIL import ImageOps
        image = ImageOps.exif_transpose(image)
        
        image = image.convert("RGB")
        image_np = np.array(image)

        # Coordinates
        input_point = np.array([[int(x), int(y)]])
        input_label = np.array([1]) # 1 indicates a positive point
        logger.info(f"Extraction point: {x}, {y}, image shape: {image_np.shape}")

        # Generate mask
        mask = predict_mask(predictor, image_np, input_point, input_label)
        logger.info(f"Mask generated. Sum: {mask.sum()}, shape: {mask.shape}")
        
        # Apply mask
        result_img = apply_mask_to_image(image_np, mask)
        
        # Convert to PNG
        img_byte_arr = io.BytesIO()
        result_img.save(img_byte_arr, format='PNG')
        img_byte_arr = img_byte_arr.getvalue()

        return Response(content=img_byte_arr, media_type="image/png")
    except Exception as e:
        logger.error(f"Extraction error: {e}")
        return {"error": str(e)}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
