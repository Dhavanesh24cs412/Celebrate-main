import React, { useRef, useEffect } from 'react';

interface InteractiveCanvasProps {
  imageFile: File | null;
  onPointClick: (x: number, y: number) => void;
  isLoading: boolean;
}

export function InteractiveCanvas({ imageFile, onPointClick, isLoading }: InteractiveCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!imageFile || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    const objectUrl = URL.createObjectURL(imageFile);

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(objectUrl);
    };

    img.src = objectUrl;

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [imageFile]);

  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHolding = useRef(false);
  const startPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    return () => {
      if (holdTimer.current) {
        clearTimeout(holdTimer.current);
      }
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isLoading || !canvasRef.current || !imageFile) return;
    
    const canvas = e.currentTarget;
    canvas.setPointerCapture(e.pointerId);
    
    isHolding.current = true;
    startPos.current = { x: e.clientX, y: e.clientY };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const extractX = Math.round((e.clientX - rect.left) * scaleX);
    const extractY = Math.round((e.clientY - rect.top) * scaleY);
    
    if (holdTimer.current) clearTimeout(holdTimer.current);
    
    holdTimer.current = setTimeout(() => {
      if (isHolding.current && !isLoading) {
        onPointClick(extractX, extractY);
      }
      isHolding.current = false;
      if (canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
      }
    }, 400);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isHolding.current || !startPos.current) return;
    
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    const distance = Math.hypot(dx, dy);
    
    if (distance > 15) {
      isHolding.current = false;
      if (holdTimer.current) {
        clearTimeout(holdTimer.current);
        holdTimer.current = null;
      }
    }
  };

  const handlePointerCancelOrUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isHolding.current = false;
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    
    const canvas = e.currentTarget;
    if (canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
  };

  if (!imageFile) {
    return (
      <div className="w-full h-64 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
        <p className="font-medium text-sm">No image selected</p>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden bg-gray-50 rounded-xl border border-gray-200">
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)', backgroundPosition: '0 0, 10px 10px', backgroundSize: '20px 20px' }}></div>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerCancelOrUp}
        onPointerCancel={handlePointerCancelOrUp}
        onPointerLeave={handlePointerCancelOrUp}
        className={`w-full h-auto max-h-[60vh] object-contain relative z-10 touch-none ${isLoading ? 'cursor-not-allowed opacity-50' : 'cursor-crosshair hover:opacity-90 transition-opacity'}`}
      />
    </div>
  );
}
