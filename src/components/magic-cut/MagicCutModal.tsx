import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Wand2, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { MagicCutService, ExtractionResult } from '../../lib/api/magicCut';
import { InteractiveCanvas } from './InteractiveCanvas';

function PreviewImage({ 
  src, 
  onLoad, 
  onError 
}: { 
  src: string; 
  onLoad: (url: string) => void; 
  onError: (url: string) => void;
}) {
  if (!src) return null;
  return (
    <img 
      src={src} 
      onLoad={() => onLoad(src)} 
      onError={() => onError(src)} 
      alt="Extracted preview" 
      className="max-w-full max-h-full object-contain relative z-10" 
    />
  );
}

interface MagicCutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (result: ExtractionResult) => void;
}

export function MagicCutModal({ isOpen, onClose, onComplete }: MagicCutModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<ExtractionResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active/Pending Ownership tracking
  const activeExtractionId = useRef(0);
  const activeUrlRef = useRef<string | null>(null);
  const pendingUrlRef = useRef<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const isMounted = useRef(true);

  // Esc key handler isolated to this modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape' && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  // Modal lifecycle and cleanup
  useEffect(() => {
    if (!isOpen) {
      MagicCutService.cancelActiveExtraction();
      setFile(null);
      setPreviewResult(null);
      setLoading(false);
      setError(null);
      
      // Cleanup URLs on modal close
      if (activeUrlRef.current) URL.revokeObjectURL(activeUrlRef.current);
      if (pendingUrlRef.current) URL.revokeObjectURL(pendingUrlRef.current);
      activeUrlRef.current = null;
      pendingUrlRef.current = null;
      setPreviewUrl(null);
    }
    return () => {
      MagicCutService.cancelActiveExtraction();
    };
  }, [isOpen]);

  // Global unmount cleanup
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (activeUrlRef.current) URL.revokeObjectURL(activeUrlRef.current);
      if (pendingUrlRef.current) URL.revokeObjectURL(pendingUrlRef.current);
    };
  }, []);

  // Creation Lifecycle
  useEffect(() => {
    if (!previewResult?.asset?.file) return;

    if (pendingUrlRef.current) {
      URL.revokeObjectURL(pendingUrlRef.current);
    }

    const newUrl = URL.createObjectURL(previewResult.asset.file);
    pendingUrlRef.current = newUrl;
    setPreviewUrl(newUrl);
  }, [previewResult?.asset?.file]);

  // Native Ownership Callbacks
  const handlePreviewLoad = useCallback((loadedUrl: string) => {
    if (!isMounted.current || loadedUrl !== pendingUrlRef.current) return;
    
    if (activeUrlRef.current) {
      URL.revokeObjectURL(activeUrlRef.current);
    }
    activeUrlRef.current = loadedUrl;
    pendingUrlRef.current = null;
  }, []);

  const handlePreviewError = useCallback((failedUrl: string) => {
    if (!isMounted.current || failedUrl !== pendingUrlRef.current) return;
    
    URL.revokeObjectURL(failedUrl);
    pendingUrlRef.current = null;
    
    if (previewUrl !== activeUrlRef.current) {
      setPreviewUrl(activeUrlRef.current);
    }
  }, [previewUrl]);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validation = MagicCutService.validateImage(selectedFile);
    if (!validation.valid) {
      setError(validation.error || 'Invalid image');
      return;
    }
    
    setFile(selectedFile);
    setPreviewResult(null);
    
    // Cleanup preview URL on new file select
    if (activeUrlRef.current) URL.revokeObjectURL(activeUrlRef.current);
    if (pendingUrlRef.current) URL.revokeObjectURL(pendingUrlRef.current);
    activeUrlRef.current = null;
    pendingUrlRef.current = null;
    setPreviewUrl(null);
    
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };


  const handleExtract = async (x: number, y: number) => {
    if (!file) return;
    
    activeExtractionId.current += 1;
    const currentId = activeExtractionId.current;
    
    // Do NOT setPreviewResult(null) here, so the old preview remains visible
    setLoading(true);
    setError(null);

    try {
      const status = await MagicCutService.status();
      if (status.state === 'unavailable') {
        throw new Error(status.message || 'AI extraction service is currently unavailable.');
      }
      
      const result = await MagicCutService.extract({ file, x, y });
      
      // Strict Monotonic Sequence Validation
      if (isMounted.current && isOpen && currentId === activeExtractionId.current) {
        setPreviewResult(result);
      }
      
    } catch (err: any) {
      if (err.message === 'Extraction was cancelled.') return;
      if (isMounted.current && isOpen && currentId === activeExtractionId.current) {
        setError(err.message || 'Failed to extract object.');
      }
    } finally {
      if (isMounted.current && isOpen && currentId === activeExtractionId.current) {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => !loading && onClose()}>
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-20">
          <h2 className="text-xl font-poppins font-bold text-text flex items-center gap-2">
            <Wand2 className="w-6 h-6 text-primary" /> Magic Cut AI
          </h2>
          <button 
            onClick={onClose} 
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          {error && (
             <div className="mb-4 bg-red-50 text-red-600 p-4 rounded-xl flex items-start gap-3 border border-red-100">
               <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
               <div className="flex-1">
                 <p className="font-medium text-sm">Error</p>
                 <p className="text-sm mt-1">{error}</p>
               </div>
             </div>
          )}

          {!file ? (
             <div className="text-center p-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
               <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
               <h3 className="text-lg font-medium text-text mb-2">Select an Image</h3>
               <p className="text-sm text-gray-500 mb-6">Upload an image to magically extract objects.</p>
               <input 
                 type="file" 
                 ref={fileInputRef} 
                 className="hidden" 
                 accept="image/jpeg, image/png, image/webp" 
                 onChange={handleFileSelect} 
               />
               <button 
                 onClick={() => fileInputRef.current?.click()} 
                 className="px-6 py-2 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors"
               >
                 Choose Image
               </button>
             </div>
          ) : (
             <div className="space-y-4">
               <div className="flex justify-between items-center">
                 <p className="text-sm text-gray-600 font-medium">Click precisely on the object you want to extract.</p>
                 <button 
                   onClick={() => { 
                     setFile(null); 
                     setError(null); 
                     setPreviewResult(null); 
                     if (activeUrlRef.current) URL.revokeObjectURL(activeUrlRef.current);
                     if (pendingUrlRef.current) URL.revokeObjectURL(pendingUrlRef.current);
                     activeUrlRef.current = null;
                     pendingUrlRef.current = null;
                     setPreviewUrl(null);
                   }}
                   disabled={loading}
                   className="text-sm text-gray-500 hover:text-primary transition-colors disabled:opacity-50"
                 >
                   Select Different Image
                 </button>
               </div>
               
               <InteractiveCanvas 
                 imageFile={file} 
                 onPointClick={handleExtract} 
                 isLoading={loading} 
               />

               {loading && (
                 <div className="flex items-center justify-center gap-3 text-primary p-4">
                   <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                   <span className="font-medium">Extracting object using AI...</span>
                 </div>
               )}

               {(previewResult || previewUrl) && (
                 <div className={`mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200 transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
                   <h3 className="text-sm font-semibold text-text mb-3">Extracted Preview</h3>
                   <div className="flex flex-col sm:flex-row items-center gap-6">
                     <div className="w-32 h-32 bg-white rounded-lg border border-gray-200 flex items-center justify-center p-2 relative overflow-hidden shrink-0 shadow-sm">
                       <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)', backgroundPosition: '0 0, 4px 4px', backgroundSize: '8px 8px' }}></div>
                       {previewUrl && (
                         <PreviewImage 
                           src={previewUrl} 
                           onLoad={handlePreviewLoad}
                           onError={handlePreviewError}
                         />
                       )}
                     </div>
                     <div className="flex-1 space-y-2 text-center sm:text-left">
                       <p className="text-sm text-gray-600">
                         If you're satisfied with this extraction, click <strong>Use Asset</strong> to proceed to upload.
                       </p>
                       <p className="text-xs text-gray-500">
                         Not quite right? Simply click a different spot on the image above to try again.
                       </p>
                       <div className="pt-2">
                         <button 
                           onClick={() => previewResult && onComplete(previewResult)}
                           disabled={loading || !previewResult}
                           className="px-6 py-2 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
                         >
                           Use Asset
                         </button>
                       </div>
                     </div>
                   </div>
                 </div>
               )}
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
