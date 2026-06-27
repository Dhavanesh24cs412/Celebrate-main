export type MagicCutLifecycleState = 'unavailable' | 'starting' | 'ready';

export interface MagicCutServiceStatus {
  state: MagicCutLifecycleState;
  message: string;
}

export interface ExtractedAsset {
  file: File;
  metadata: {
    width: number;
    height: number;
    mimeType: string;
    source?: {
      originalWidth: number;
      originalHeight: number;
      clickPoint: { x: number; y: number };
    };
  };
}

export interface ExtractionResult {
  asset: ExtractedAsset;
}

export interface ExtractionParams {
  file: File;
  x: number;
  y: number;
}

const BACKEND_URL = import.meta.env.VITE_MAGIC_CUT_API_URL || 'http://127.0.0.1:8000/api/v1/magic-cut';
const STARTUP_TIMEOUT_MS = 60000; // 60 seconds

let activeAbortController: AbortController | null = null;
let startingStartTime: number | null = null;

export const MagicCutService = {
  status: async (): Promise<MagicCutServiceStatus> => {
    try {
      const response = await fetch(`${BACKEND_URL}/status`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) {
        return { state: 'unavailable', message: 'Service returned an error.' };
      }
      
      const data = await response.json();
      
      // Capability Negotiation & API Compatibility
      if (data.api_version !== '1.0.0' || !data.capabilities?.alpha_png) {
        return { state: 'unavailable', message: 'Backend version is incompatible.' };
      }
      
      if (data.state === 'starting') {
        if (!startingStartTime) {
          startingStartTime = Date.now();
        } else if (Date.now() - startingStartTime > STARTUP_TIMEOUT_MS) {
          return { state: 'unavailable', message: 'Backend startup timeout exceeded.' };
        }
        return { state: 'starting', message: 'AI Model is warming up...' };
      }
      
      startingStartTime = null; // Reset timeout tracker on success
      
      if (data.state === 'ready') {
        return { state: 'ready', message: 'Service is ready.' };
      }
      
      return { state: 'unavailable', message: 'Unknown service state.' };
      
    } catch (error) {
      return { state: 'unavailable', message: 'Service is unreachable.' };
    }
  },

  validateImage: (file: File): { valid: boolean, error?: string } => {
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB limit for extraction

    if (!ALLOWED_TYPES.includes(file.type)) {
      return { valid: false, error: 'Only JPEG, PNG, and WEBP files are supported for extraction.' };
    }
    if (file.size > MAX_SIZE) {
      return { valid: false, error: 'Image exceeds the 10MB limit for extraction.' };
    }
    return { valid: true };
  },

  extract: async (params: ExtractionParams): Promise<ExtractionResult> => {
    MagicCutService.cancelActiveExtraction();
    
    activeAbortController = new AbortController();
    
    const formData = new FormData();
    formData.append('file', params.file);
    formData.append('x', params.x.toString());
    formData.append('y', params.y.toString());

    try {
      const response = await fetch(`${BACKEND_URL}/extract`, {
        method: 'POST',
        body: formData,
        signal: activeAbortController.signal
      });

      if (!response.ok) {
        throw new Error('Extraction failed on the server.');
      }

      const blob = await response.blob();
      
      // Generate deterministic filename
      const filename = `magic_cut_${Date.now()}.png`;
      const extractedFile = new File([blob], filename, { type: 'image/png' });

      // In a real scenario, you'd get dimensions from an Image object or backend metadata.
      // We will parse them statelessly here using an ephemeral Image.
      const dimensions = await new Promise<{width: number, height: number}>((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(extractedFile);
        img.onload = () => {
          resolve({ width: img.width, height: img.height });
          URL.revokeObjectURL(objectUrl);
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error("Failed to parse extracted image dimensions."));
        };
        img.src = objectUrl;
      });

      return {
        asset: {
          file: extractedFile,
          metadata: {
            width: dimensions.width,
            height: dimensions.height,
            mimeType: 'image/png',
            source: {
              originalWidth: 0, // Placeholder, can be passed down if needed
              originalHeight: 0,
              clickPoint: { x: params.x, y: params.y }
            }
          }
        }
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Extraction was cancelled.');
      }
      throw error;
    } finally {
      activeAbortController = null;
    }
  },

  cancelActiveExtraction: (): void => {
    if (activeAbortController) {
      activeAbortController.abort();
      activeAbortController = null;
    }
  }
};
