import torch
import numpy as np
from PIL import Image
import os
import urllib.request
import sys
import cv2

# Optional: Disable warnings
import warnings
warnings.filterwarnings("ignore")

MODEL_TYPE = "vit_b"
CHECKPOINT_PATH = "sam_vit_b_01ec64.pth"
CHECKPOINT_URL = "https://dl.fbaipublicfiles.com/segment_anything/sam_vit_b_01ec64.pth"

def download_checkpoint():
    expected_size = 375042383
    if os.path.exists(CHECKPOINT_PATH):
        if os.path.getsize(CHECKPOINT_PATH) == expected_size:
            return
        print(f"Existing checkpoint size {os.path.getsize(CHECKPOINT_PATH)} mismatch (expected {expected_size}). Resuming/redownloading...")
    else:
        print("Downloading SAM checkpoint (this may take a while)...")

    # Robust download with resume capability
    try:
        req = urllib.request.Request(CHECKPOINT_URL)
        file_size = 0
        if os.path.exists(CHECKPOINT_PATH):
            file_size = os.path.getsize(CHECKPOINT_PATH)
            req.headers['Range'] = f'bytes={file_size}-'
            
        with urllib.request.urlopen(req, timeout=15) as response:
            with open(CHECKPOINT_PATH, 'ab') as f:
                while True:
                    chunk = response.read(8192)
                    if not chunk:
                        break
                    f.write(chunk)
                    
        print("Download complete.")
    except Exception as e:
        print(f"Error during download: {e}")
        # If it failed to download, we'll probably fail to load, but we tried.

def load_model():
    try:
        from segment_anything import sam_model_registry, SamPredictor
    except ImportError:
        print("Error: segment_anything package is not installed.")
        print("Please install it: pip install git+https://github.com/facebookresearch/segment-anything.git")
        sys.exit(1)

    download_checkpoint()
    
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Loading SAM model on {device}...")
    
    sam = sam_model_registry[MODEL_TYPE](checkpoint=CHECKPOINT_PATH)
    sam.to(device=device)
    
    predictor = SamPredictor(sam)
    print("Model loaded successfully.")
    return predictor

def predict_mask(predictor, image_np, input_point, input_label):
    # Set the image for SAM predictor
    predictor.set_image(image_np)
    
    # Predict masks - use multimask_output=True for better accuracy with single point prompts
    masks, scores, logits = predictor.predict(
        point_coords=input_point,
        point_labels=input_label,
        multimask_output=True,
    )
    
    # Return the mask with the highest score
    best_mask_idx = np.argmax(scores)
    return masks[best_mask_idx]

def apply_mask_to_image(image_np, mask):
    # image_np is RGB (H, W, 3)
    # mask is boolean (H, W)
    
    # Create an alpha channel based on the mask
    alpha = (mask * 255).astype(np.uint8)
    
    # Fill small holes inside the object mask
    kernel = np.ones((5, 5), np.uint8)
    alpha = cv2.morphologyEx(alpha, cv2.MORPH_CLOSE, kernel)
    
    # Remove small noise artifacts outside the object
    alpha = cv2.morphologyEx(alpha, cv2.MORPH_OPEN, kernel)
    
    # Apply Gaussian blur for smooth anti-aliased edges
    alpha = cv2.GaussianBlur(alpha, (5, 5), 0)
    
    # Combine RGB and Alpha
    rgba = np.dstack((image_np, alpha))
    
    # Crop to the bounding box of the mask for a cleaner cutout
    y_indices, x_indices = np.where(mask)
    if len(y_indices) == 0 or len(x_indices) == 0:
        return Image.fromarray(rgba) # Return full image if no mask found
        
    y_min, y_max = y_indices.min(), y_indices.max()
    x_min, x_max = x_indices.min(), x_indices.max()
    
    # Add a small padding
    padding = 20
    y_min = max(0, y_min - padding)
    y_max = min(rgba.shape[0], y_max + padding)
    x_min = max(0, x_min - padding)
    x_max = min(rgba.shape[1], x_max + padding)
    
    cropped_rgba = rgba[y_min:y_max, x_min:x_max]
    
    return Image.fromarray(cropped_rgba)
