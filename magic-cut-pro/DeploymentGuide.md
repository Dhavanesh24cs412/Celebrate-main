# Magic Cutout Pro - Deployment & Setup Guide

## System Architecture

Magic Cutout Pro is built with a modern, high-performance stack:
*   **Frontend**: Next.js 14, React, TailwindCSS
*   **Backend**: FastAPI, Python 3.9+
*   **AI Engine**: Meta's Segment Anything Model (SAM)

---

## 1. Local Development Setup

### Prerequisites
*   Node.js (v18+)
*   Python (3.9+)
*   Git

### Frontend Setup
1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
    The frontend will be available at `http://localhost:3000`.

### Backend Setup
1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Create and activate a virtual environment (recommended):
    ```bash
    python -m venv venv
    
    # Windows
    venv\Scripts\activate
    
    # macOS/Linux
    source venv/bin/activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
    *(Note: The first time you run the backend, it will automatically download the 370MB SAM checkpoint file `sam_vit_b_01ec64.pth`)*
4.  Start the FastAPI server:
    ```bash
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
    ```
    The backend API will be available at `http://localhost:8000`.

---

## 2. Production Deployment (SaaS Ready)

### Frontend Deployment (Vercel)
The Next.js frontend is optimized for deployment on Vercel:
1.  Push your code to a GitHub repository.
2.  Connect the repository to Vercel.
3.  Set the Framework Preset to **Next.js**.
4.  Set the Build Command to `npm run build` and Output Directory to `.next`.
5.  Set the `NEXT_PUBLIC_API_URL` environment variable to your production backend URL (you will need to update the fetch URL in `ImageExtractor.tsx`).
6.  Click **Deploy**.

### Backend Deployment (GPU Server / RunPod / AWS)
For a SaaS product, CPU inference is too slow (1.5s - 3s). You **must** deploy the backend on a machine with an NVIDIA GPU (e.g., T4, A10g).

**Recommended Platforms:**
*   RunPod (Serverless or Pods)
*   AWS EC2 (g4dn.xlarge)
*   Google Cloud Platform (N1 + T4)

**Deployment Steps via Docker:**
1.  Create a `Dockerfile` in the `backend` directory:
    ```dockerfile
    FROM nvidia/cuda:11.8.0-runtime-ubuntu22.04

    # Install Python and dependencies
    RUN apt-get update && apt-get install -y python3-pip git libgl1 libglib2.0-0

    WORKDIR /app
    COPY requirements.txt .
    RUN pip3 install -r requirements.txt

    COPY . .

    # Pre-download weights
    RUN python3 -c "from utils import download_checkpoint; download_checkpoint()"

    CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
    ```
2.  Build and push the Docker image.
3.  Deploy on your GPU instance and map port 8000 to the public IP/Domain.

---

## 3. Performance Optimizations implemented

1.  **Memory Management**: The SAM model is loaded globally once in `main.py` when the server starts. This eliminates the ~2-second loading overhead per request.
2.  **Coordinate Mapping**: The frontend converts CSS pixels back to natural image pixels seamlessly, preventing incorrect segmentation on large/scaled images.
3.  **Alpha Matting**: The backend automatically bounds the mask and crops the result tightly, adding an alpha channel for clean PNG transparency.
4.  **Touch UX**: Long press is configured for 500ms with a tolerance radius of 10px, preventing accidental triggers when scrolling.
