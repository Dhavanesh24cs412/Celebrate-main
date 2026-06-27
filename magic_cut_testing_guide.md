# Magic Cut - Official Developer Testing Guide

This document provides the definitive, step-by-step procedures for locally configuring, running, and formally verifying the Magic Cut integration within the Celebrate repository.

## 1. Project Startup

### Backend Initialization (FastAPI)
The Python AI service handles the heavy lifting for the Segment Anything Model.

1. **Navigate to backend directory:**
   ```bash
   cd d:\Celebrate\ai-services\magic-cut
   ```
2. **Activate the virtual environment:**
   ```powershell
   # Windows PowerShell
   .\venv\Scripts\Activate.ps1
   ```
3. **Install dependencies (if new setup):**
   ```bash
   pip install -r requirements.txt
   ```
4. **Start the backend server:**
   ```bash
   python main.py
   # Or alternatively: uvicorn main:app --host 0.0.0.0 --port 8000
   ```
5. **Expected Startup Logs:**
   You will see standard Uvicorn startup logs, followed quickly by:
   ```text
   INFO:__main__:Initializing SAM model in background...
   ```
   *Note: Because model loading is non-blocking, the API is instantly reachable at this point in a `starting` state.*
   Once the checkpoint is loaded into memory (2-10 seconds), you will see:
   ```text
   INFO:__main__:SAM model loaded successfully.
   ```
6. **Verify Backend Health:**
   Open a browser or use `curl`:
   ```bash
   curl http://127.0.0.1:8000/api/v1/magic-cut/status
   ```
   *Expected Response:* `{"service":"magic-cut","api_version":"1.0.0","state":"ready",...}`

### Frontend Initialization (React/Vite)
1. **Navigate to root:**
   ```bash
   cd d:\Celebrate
   ```
2. **Verify Environment Variables:**
   Ensure `.env` or your runtime configuration contains (optional for local dev as it defaults to `127.0.0.1`):
   ```env
   VITE_MAGIC_CUT_API_URL=http://127.0.0.1:8000/api/v1/magic-cut
   ```
3. **Start the frontend:**
   ```bash
   npm run dev
   ```

---

## 2. Runtime Verification

Once both servers are running:
1. Navigate to the frontend (typically `http://localhost:5173`).
2. Log in and navigate to an event's **Planner Overlays** page.
3. Observe the **"Extract with AI"** button.
   * If the backend is still loading the model, the button will be disabled, spinning, and say "AI Starting...".
   * Once the backend logs `SAM model loaded successfully`, the button will enable instantly without a page refresh.
4. Verify the browser console is completely clear of React key warnings, uncaught promises, or network timeouts.

---

## 3. Functional Test Cases

Execute the following test scripts manually to sign off on core functionality.

### Test 1: Upload Rejection (Size & Format)
* **Preconditions:** Backend ready.
* **Steps:** Click "Extract with AI". Attempt to upload a PDF file, or a JPEG > 10MB.
* **Expected Result:** A red error banner appears reading "Only JPEG, PNG, and WEBP files are supported" or "Image exceeds the 10MB limit". The canvas does not mount.
* [ ] Pass / Fail

### Test 2: Standard Extraction Flow
* **Preconditions:** Valid 2MB JPEG image.
* **Steps:**
  1. Click "Extract with AI" and upload the JPEG.
  2. Click firmly on a distinct object in the image.
  3. Wait for the extraction spinner to finish.
* **Expected Result:** A clean, transparent PNG preview appears below the canvas.
* [ ] Pass / Fail

### Test 3: The "Try Again" Loop
* **Preconditions:** Extracted preview currently visible from Test 2.
* **Steps:**
  1. Do *not* click "Use Asset".
  2. Click a completely different object on the *original* canvas image.
* **Expected Result:** The previous preview disappears instantly, the spinner returns, and a new extraction replaces the previous preview.
* [ ] Pass / Fail

### Test 4: Pipeline Injection
* **Preconditions:** Extracted preview currently visible.
* **Steps:** 
  1. Click "Use Asset".
  2. Select a category (e.g., "Furniture") in the native modal that appears.
  3. Click "Upload Asset".
* **Expected Result:** 
  * The file writes successfully to Supabase Storage.
  * A Postgres database row is created.
  * The collection thumbnail updates.
  * The asset appears immediately in the grid without a page refresh.
* [ ] Pass / Fail

---

## 4. Stress Tests

### Test 5: Rapid Clicking
* **Steps:** Open Magic Cut, upload an image, and rapidly click 5 different locations on the canvas within one second.
* **Expected Result:** The internal `AbortController` cleanly cancels the first 4 requests. Only the final click executes. No double previews or UI glitches occur.
* [ ] Pass / Fail

### Test 6: Instant Cancellation
* **Steps:** Click the canvas to begin extraction, then immediately press the `Escape` key or click outside the modal.
* **Expected Result:** The modal closes instantly. The network request is aborted. Reopening the modal reveals a clean, empty state.
* [ ] Pass / Fail

### Test 7: Backend Recovery
* **Steps:** Keep the "Planner Overlays" page open. Kill the Python terminal (`Ctrl+C`).
* **Expected Result:** Within 10 seconds, the frontend polling detects the outage. The button disables and tooltip reads "AI Service Unavailable". Restarting the backend restores functionality automatically.
* [ ] Pass / Fail

---

## 5. Memory Tests

To verify zero memory leaks using Chrome DevTools:
1. Open **Chrome DevTools** > **Memory** tab.
2. Open Magic Cut and extract an object (this generates a `blob:http://...` URL for the preview).
3. Close the Magic Cut modal.
4. Take a **Heap Snapshot**.
5. Filter the snapshot for `Blob` or `blob:`.
* **Expected Result:** There should be zero orphaned blob URLs associated with the Magic Cut preview. The `InteractiveCanvas` and `PreviewImage` components successfully invoked `URL.revokeObjectURL()` on unmount.

---

## 6. Database Verification

To verify backend integrity after an extraction is saved, execute this SQL against the Supabase database:

```sql
SELECT 
    id, 
    file_path, 
    category_id, 
    created_at 
FROM overlay_assets 
ORDER BY created_at DESC 
LIMIT 1;
```
* **Expected Result:** A newly created row belonging to the logged-in planner, with a `file_path` resembling `[collection_id]/magic_cut_[timestamp].png`.

---

## 7. Storage Verification

To verify the bucket payload:
1. Open the Supabase Dashboard > Storage > `overlays` bucket.
2. Navigate to the most recent upload.
3. Download the file.
* **Expected Result:** The file is a valid PNG, the background is strictly transparent (alpha channel = 0), and the visual subject matches the exact coordinates clicked on the canvas.

---

## 8. Production Checklist

Before merging and deploying to the `main` production branch, confirm:

- [ ] **Environment Variable:** `VITE_MAGIC_CUT_API_URL` is set in the production CI/CD pipeline (e.g., Vercel/Netlify).
- [ ] **HTTPS Enforced:** The production backend is served via HTTPS (SSL/TLS). Browsers will hard-block mixed content if the frontend is HTTPS but the backend is HTTP.
- [ ] **CORS Locked:** Modify `allow_origins=["*"]` in `main.py` to match the exact production domain (e.g., `["https://celebrate.com"]`) before deployment.
- [ ] **Model Checkpoint:** The `sam_vit_b_01ec64.pth` (375MB) is physically available in the deployment container or mounted via block storage.
- [ ] **Compute:** The backend server is provisioned with at least 4GB of RAM (required for the PyTorch SAM model weights).
