import sys
import time
import hashlib
import numpy as np
from PIL import Image, ImageDraw
import io
import psutil
import os

process = psutil.Process(os.getpid())
initial_ram = process.memory_info().rss / 1024 / 1024

start_time = time.time()
print("Starting Phase 1A Backend Portability Audit...")

import torch
from utils import load_model, predict_mask, apply_mask_to_image

print(f"Imports took {time.time() - start_time:.2f} seconds")

# 1. Audit SAM Checkpoint Discovery
load_start = time.time()
predictor = load_model()
load_time = time.time() - load_start
print(f"Model loading took {load_time:.2f} seconds")
print(f"Device: {'cuda' if torch.cuda.is_available() else 'cpu'}")

post_load_ram = process.memory_info().rss / 1024 / 1024
print(f"RAM Usage: Initial = {initial_ram:.2f} MB, Post-Load = {post_load_ram:.2f} MB, Delta = {post_load_ram - initial_ram:.2f} MB")

# 2. Deterministic Inference Verification
print("Generating test image...")
img = Image.new('RGB', (256, 256), color='white')
d = ImageDraw.Draw(img)
d.ellipse((64, 64, 192, 192), fill='red')
image_np = np.array(img)
input_point = np.array([[128, 128]])
input_label = np.array([1])

print("Executing Run 1...")
r1_start = time.time()
mask1 = predict_mask(predictor, image_np, input_point, input_label)
result1 = apply_mask_to_image(image_np, mask1)
img_byte_arr1 = io.BytesIO()
result1.save(img_byte_arr1, format='PNG')
hash1 = hashlib.sha256(img_byte_arr1.getvalue()).hexdigest()
print(f"Run 1 completed in {time.time() - r1_start:.2f}s, SHA256: {hash1}")

print("Executing Run 2...")
r2_start = time.time()
mask2 = predict_mask(predictor, image_np, input_point, input_label)
result2 = apply_mask_to_image(image_np, mask2)
img_byte_arr2 = io.BytesIO()
result2.save(img_byte_arr2, format='PNG')
hash2 = hashlib.sha256(img_byte_arr2.getvalue()).hexdigest()
print(f"Run 2 completed in {time.time() - r2_start:.2f}s, SHA256: {hash2}")

if hash1 == hash2:
    print("SUCCESS: Deterministic inference verified.")
    sys.exit(0)
else:
    print("ERROR: Inference outputs do not match.")
    sys.exit(1)
