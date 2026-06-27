# Tech Stack & Integration Guide

This document outlines the technology stack used in **Magic Cutout Pro** and provides a step-by-step guide on how to integrate this object extraction feature into your own projects.

---

## 1. Technology Stack

### Frontend
- **Framework**: Next.js 14 (React)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Core Components**: Native HTML5 Canvas API (for rendering images and mapping click coordinates).
- **Interactions**: Pointer events (`onPointerDown`, `onPointerUp`, `onPointerMove`) for long-press detection and touch compatibility.

### Backend
- **Framework**: FastAPI (Python)
- **Server**: Uvicorn
- **Image Processing**: OpenCV (`cv2`), Pillow (`PIL`), NumPy.
- **AI/ML Engine**: Meta's **Segment Anything Model (SAM)**.
- **Model Checkpoint**: `sam_vit_b_01ec64.pth` (ViT-Base model, loaded into memory via PyTorch).

### How It Works (Architecture Flow)
1. **Frontend**: The user uploads an image, which is drawn onto an HTML5 Canvas.
2. **Interaction**: A long press captures the exact X/Y coordinates of the interaction.
3. **Coordinate Mapping**: The UI coordinates (viewport CSS pixels) are mathematically mapped back to the natural, unscaled dimensions of the original image.
4. **API Call**: The original image and the precise X/Y natural coordinates are sent to the FastAPI backend via a `multipart/form-data` POST request.
5. **Inference**: The FastAPI backend feeds the image and coordinates to the pre-loaded SAM model, which predicts a boolean mask for the object.
6. **Post-Processing**: The mask is applied to the image to add an alpha (transparency) channel. The image is cropped to the bounding box of the mask to remove excess empty space.
7. **Response**: The cropped PNG is sent back to the frontend as a binary blob and rendered as an overlay on the UI.

---

## 2. Integration Guide: Adding This Feature to Your Project

If you want to add this AI extraction feature to your existing Next.js / React project, follow these steps.

### Step 1: Set up the Python Backend Engine
Your project needs the FastAPI backend running in parallel (either locally or deployed on a GPU instance) to handle the AI inference.

1. Copy the `backend` folder from this project to your environment.
2. Install the required Python dependencies:
   ```bash
   pip install fastapi uvicorn python-multipart segment-anything torch torchvision opencv-python numpy Pillow
   ```
3. Run the Python backend:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```
   *Make sure CORS in `main.py` is configured to accept requests from your frontend URL.*

### Step 2: Create the Frontend Component
Create a new component in your React project (e.g., `ImageExtractor.tsx`). You can copy the code from `src/components/ImageExtractor.tsx`.

**Key Requirements for the Component:**
1. **Canvas Element**: You must use a `<canvas>` element to display the image. This is crucial for capturing exact coordinates relative to the natural image size.
2. **Coordinate Calculation**: Ensure you copy the `getNaturalCoordinates` function. This prevents misalignment when the image is scaled down to fit the user's screen.
   ```typescript
   const getNaturalCoordinates = (clientX: number, clientY: number) => {
     const canvas = canvasRef.current;
     const rect = canvas.getBoundingClientRect();
     const x = clientX - rect.left;
     const y = clientY - rect.top;
     
     // Map screen pixels to image native pixels
     const scaleX = canvas.width / rect.width;
     const scaleY = canvas.height / rect.height;
     return { naturalX: x * scaleX, naturalY: y * scaleY };
   };
   ```

### Step 3: Connect Frontend to Backend
When the user long-presses (or clicks), trigger a fetch request to your Python server.

```typescript
const extractObject = async (naturalX: number, naturalY: number, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('x', naturalX.toString());
  formData.append('y', naturalY.toString());

  const res = await fetch('http://localhost:8000/api/extract', {
    method: 'POST',
    body: formData,
  });

  const blob = await res.blob();
  const extractedUrl = URL.createObjectURL(blob);
  // Do something with extractedUrl (e.g., render it on screen or upload to S3)
};
```

### Step 4: Handle the UI Overlay
To create the "Magic" effect:
1. Render the returned `extractedUrl` as an absolute `<img />` element positioned over the original canvas.
2. Use the original display coordinates (where the user tapped) to position the extracted object.
3. Add CSS animations (`transform`, `scale`) to make it look like the object "pops" out of the background.

### Step 5: Production Deployment Considerations
* **Backend**: You **must** deploy the backend to a machine with an NVIDIA GPU (e.g., AWS EC2 g4dn.xlarge, RunPod, or Lambda). Inference on a standard CPU takes 2-3 seconds, while a GPU takes < 100ms.
* **Model State**: Ensure the PyTorch model (`load_model()`) is instantiated globally outside the API route handler in your Python code so it stays in RAM. Loading the model per-request is extremely slow.
* **Payload Size**: High-resolution images should ideally be compressed on the client-side (using a library like `browser-image-compression`) before sending to the backend to reduce network latency.

---

## 3. Building This Feature Using Antigravity

If you want me (Antigravity) to build this entire feature for your project from scratch, you can use the copy-paste prompt below. This prompt provides me with all the necessary context, architecture, and optimization requirements.

### Copy-Paste Prompt for Antigravity

**Prompt:**

> "I want to build an AI-powered object extraction feature into my Next.js (React) project, similar to the iOS 16 photo cutout feature. 
> 
> **Architecture Requirements:**
> 1. **Frontend:** Create a Next.js React component that allows a user to upload an image. Display the image on an HTML5 `<canvas>`. Implement pointer events (onPointerDown, onPointerUp) to detect a 500ms long-press on the canvas. When a long-press occurs, calculate the exact natural image coordinates (unscaled) of the click and send them along with the image file to my backend via a `multipart/form-data` POST request.
> 2. **Backend:** Set up a FastAPI Python backend. Create an endpoint (`/api/extract`) that receives the image and the X/Y coordinates. Use Meta's `segment-anything` (SAM) model to predict a mask based on those coordinates. Apply the mask to crop the object tightly and add an alpha transparency channel. Return the result as a PNG image blob.
> 3. **Model Optimization:** Ensure the PyTorch SAM model is loaded globally into memory on backend startup, NOT on every request, to minimize inference latency.
> 4. **UI Feedback:** Show a loading spinner on the frontend during extraction, and animate the returned PNG overlaying the original image where the user clicked.
> 
> Please scaffold this out, provide the required `package.json` and `requirements.txt` dependencies, and give me the code for both the Next.js component and the FastAPI server."
