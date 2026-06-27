"use client";

import React, { useState, useRef, useEffect } from 'react';

interface ExtractedObject {
  id: string;
  url: string;
  x: number;
  y: number;
}

export default function ImageExtractor() {
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractedObjects, setExtractedObjects] = useState<ExtractedObject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const [pressPos, setPressPos] = useState<{ x: number, y: number } | null>(null);

  // Handle image upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setExtractedObjects([]);
    }
  };

  // Draw image to canvas when previewUrl changes
  useEffect(() => {
    if (previewUrl && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        // Set canvas to match natural image size but responsive
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        if (ctx) {
          ctx.drawImage(img, 0, 0);
        }
      };
      img.src = previewUrl;
    }
  }, [previewUrl]);

  // Coordinate mapping from UI to Natural Image
  const getNaturalCoordinates = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return null;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // UI coordinates relative to the canvas
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    // Scale factors (natural size / displayed size)
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      naturalX: x * scaleX,
      naturalY: y * scaleY
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!previewUrl || isLoading) return;
    
    const coords = getNaturalCoordinates(e.clientX, e.clientY);
    if (!coords) return;
    
    setPressPos({ x: e.clientX, y: e.clientY });
    
    pressTimer.current = setTimeout(() => {
      setIsLongPressing(true);
      extractObject(coords.naturalX, coords.naturalY, e.clientX, e.clientY);
    }, 500); // 500ms long press
  };

  const handlePointerUp = () => {
    clearPressTimer();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Cancel if moved too much during press
    if (pressPos) {
      const dist = Math.sqrt(
        Math.pow(e.clientX - pressPos.x, 2) + Math.pow(e.clientY - pressPos.y, 2)
      );
      if (dist > 10) {
        clearPressTimer();
      }
    }
  };

  const clearPressTimer = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    setPressPos(null);
  };

  const extractObject = async (x: number, y: number, displayX: number, displayY: number) => {
    if (!image) return;
    
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', image);
      formData.append('x', x.toString());
      formData.append('y', y.toString());

      const res = await fetch('http://localhost:8000/api/extract', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to extract object");

      const blob = await res.blob();
      const extractedUrl = URL.createObjectURL(blob);
      
      setExtractedObjects(prev => [...prev, {
        id: Math.random().toString(36).substring(7),
        url: extractedUrl,
        x: displayX,
        y: displayY
      }]);
    } catch (err) {
      console.error(err);
      alert("Error extracting object.");
    } finally {
      setIsLoading(false);
      setIsLongPressing(false);
      clearPressTimer();
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white font-sans p-8">
      <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
        Magic Cutout Pro
      </h1>
      <p className="text-gray-400 mb-8">Upload an image, then tap & hold on any object to extract it.</p>

      {!previewUrl ? (
        <label className="flex flex-col items-center justify-center w-full max-w-2xl h-64 border-2 border-gray-700 border-dashed rounded-2xl cursor-pointer bg-gray-800 hover:bg-gray-750 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
            <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
            <p className="text-xs text-gray-500">PNG, JPG or WEBP</p>
          </div>
          <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
        </label>
      ) : (
        <div className="relative w-full max-w-4xl flex flex-col items-center">
          <div className="flex justify-end w-full mb-4">
             <button 
                onClick={() => { setPreviewUrl(null); setImage(null); setExtractedObjects([]); }}
                className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Upload New
              </button>
          </div>
          
          <div 
            ref={containerRef}
            className="relative rounded-2xl overflow-hidden shadow-2xl bg-gray-800 select-none border border-gray-700"
            style={{ touchAction: 'none' }} // Prevent scrolling while pressing
          >
            {/* Main Canvas */}
            <canvas
              ref={canvasRef}
              className={`max-w-full h-auto cursor-crosshair transition-all duration-300 ${isLoading ? 'brightness-75 scale-[0.99]' : 'scale-100'}`}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerMove={handlePointerMove}
              onPointerCancel={handlePointerUp}
              onPointerLeave={handlePointerUp}
            />

            {/* Scanning/Loading Overlay */}
            {isLoading && pressPos && (
              <div 
                className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
                style={{ left: pressPos.x - (containerRef.current?.getBoundingClientRect().left || 0), top: pressPos.y - (containerRef.current?.getBoundingClientRect().top || 0) }}
              >
                <div className="w-16 h-16 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
                <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping" />
              </div>
            )}

            {/* Extracted Objects Overlay */}
            {extractedObjects.map((obj) => (
              <div 
                key={obj.id}
                className="absolute z-10 animate-in fade-in zoom-in duration-500 transform -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing hover:scale-105 transition-transform"
                style={{ 
                  left: obj.x - (containerRef.current?.getBoundingClientRect().left || 0), 
                  top: obj.y - (containerRef.current?.getBoundingClientRect().top || 0) 
                }}
              >
                <img 
                  src={obj.url} 
                  alt="Extracted" 
                  className="max-h-64 object-contain drop-shadow-[0_20px_20px_rgba(0,0,0,0.5)] filter drop-shadow-2xl"
                />
                <a 
                  href={obj.url} 
                  download={`extracted-${obj.id}.png`}
                  className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 opacity-0 hover:opacity-100 bg-white text-black px-4 py-1 rounded-full text-sm font-semibold shadow-lg transition-opacity whitespace-nowrap"
                >
                  Download PNG
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
