import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Crop,
  Upload,
  Check,
  Move,
  Sparkles,
  Info,
  Maximize2,
} from 'lucide-react';
import { Spinner } from './ui.tsx';

// Target Hero Banner dimensions & Aspect Ratio
export const BANNER_TARGET_WIDTH = 1024;
export const BANNER_TARGET_HEIGHT = 385;
export const BANNER_ASPECT_RATIO = BANNER_TARGET_WIDTH / BANNER_TARGET_HEIGHT; // ~2.6597

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialImageSrc?: string;
  onCropComplete: (uploadedUrl: string, croppedBlob?: Blob) => void;
}

export default function ImageCropperModal({
  isOpen,
  onClose,
  initialImageSrc,
  onCropComplete,
}: Props) {
  const [imageSrc, setImageSrc] = useState<string>(initialImageSrc || '');
  const [naturalWidth, setNaturalWidth] = useState<number>(0);
  const [naturalHeight, setNaturalHeight] = useState<number>(0);
  const [isImageLoaded, setIsImageLoaded] = useState<boolean>(false);

  // Transform states: zoom (1 to 4) and pan offset in pixels relative to viewport
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [uploading, setUploading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync initial image src when opened
  useEffect(() => {
    if (isOpen) {
      if (initialImageSrc) {
        setImageSrc(initialImageSrc);
      }
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setErrorMsg(null);
    }
  }, [isOpen, initialImageSrc]);

  // Load natural image dimensions when image source changes
  useEffect(() => {
    if (!imageSrc) {
      setIsImageLoaded(false);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setNaturalWidth(img.naturalWidth);
      setNaturalHeight(img.naturalHeight);
      setIsImageLoaded(true);
      setZoom(1);
      setPan({ x: 0, y: 0 });
    };
    img.onerror = () => {
      setIsImageLoaded(false);
      setErrorMsg('Failed to load image. Please verify file or URL.');
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPEG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageSrc(reader.result);
        setErrorMsg(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Drag / Pan interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isImageLoaded) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch support for mobile / touch devices
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isImageLoaded || e.touches.length === 0) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    panStartRef.current = { ...pan };
  };

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || e.touches.length === 0) return;
    const dx = e.touches[0].clientX - dragStartRef.current.x;
    const dy = e.touches[0].clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  // Reset view
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Perform client-side canvas crop & upload
  const handleCropAndUpload = async () => {
    if (!imageSrc || !containerRef.current) return;

    setUploading(true);
    setErrorMsg(null);

    try {
      const container = containerRef.current;
      const cropRect = container.getBoundingClientRect();

      // Output crisp canvas at exact locked banner dimensions (1024 x 385)
      const canvasWidth = BANNER_TARGET_WIDTH;
      const canvasHeight = BANNER_TARGET_HEIGHT;

      const canvas = document.createElement('canvas');
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas 2D context unavailable.');
      }

      // Fill with smooth background
      ctx.fillStyle = '#FAF6F0';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Load image on canvas
      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = (e) => reject(e);
        img.src = imageSrc;
      });

      // Calculate scale and position
      // In CSS, image fills with 'contain' or 'cover' inside container, scaled by zoom
      const containerW = cropRect.width;
      const containerH = cropRect.height;

      // Base scaling to fit image inside container
      const baseScale = Math.max(containerW / img.naturalWidth, containerH / img.naturalHeight);
      const currentScale = baseScale * zoom;

      const renderedW = img.naturalWidth * currentScale;
      const renderedH = img.naturalHeight * currentScale;

      const renderedX = (containerW - renderedW) / 2 + pan.x;
      const renderedY = (containerH - renderedH) / 2 + pan.y;

      // Map from container coordinates (containerW x containerH) to canvas coordinates (canvasWidth x canvasHeight)
      const scaleX = canvasWidth / containerW;
      const scaleY = canvasHeight / containerH;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(
        img,
        renderedX * scaleX,
        renderedY * scaleY,
        renderedW * scaleX,
        renderedH * scaleY
      );

      // Convert to blob / data URL
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

      // Upload to server uploads API
      const token = localStorage.getItem('malwa_admin_token');
      const uploadRes = await fetch('/api/admin/uploads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          image: dataUrl,
          target: 'banners',
        }),
      });

      const uploadData = await uploadRes.json().catch(() => ({}));

      if (!uploadRes.ok || !uploadData.success) {
        // If Cloudinary credentials are not configured or upload returns error, fallback to data URL
        console.warn('Backend upload notice, using optimized data URL:', uploadData.message);
        onCropComplete(dataUrl);
        onClose();
        return;
      }

      const finalUrl = uploadData.secureUrl || dataUrl;
      onCropComplete(finalUrl);
      onClose();
    } catch (err: unknown) {
      console.error('Crop & Upload failed:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Cropping failed.');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(20, 6, 10, 0.82)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cropper-title"
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '860px',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
          overflow: 'hidden',
          border: '1px solid #E6DEC8',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #EAE5D9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#FAF8F4',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#55000A',
                color: '#F0C74E',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Crop size={19} />
            </div>
            <div>
              <h2
                id="cropper-title"
                style={{
                  margin: 0,
                  fontSize: '17px',
                  fontWeight: 800,
                  color: '#2D0813',
                  letterSpacing: '-0.02em',
                }}
              >
                Hero Banner Framing & Cropper
              </h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#7A6E65' }}>
                Adjust and position your image inside the exact storefront hero banner ratio (1024 × 385).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8A7A70',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
            }}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {errorMsg && (
            <div
              style={{
                marginBottom: '16px',
                padding: '10px 14px',
                borderRadius: '8px',
                background: '#FEE2E2',
                border: '1px solid #FCA5A5',
                color: '#991B1B',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Info size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* File Picker or Drag & Drop if no image loaded */}
          {!imageSrc && (
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed #D4AA45',
                borderRadius: '12px',
                padding: '48px 24px',
                textAlign: 'center',
                background: '#FFFDF9',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: '#FDF7E7',
                  color: '#55000A',
                  display: 'grid',
                  placeItems: 'center',
                  margin: '0 auto 14px',
                }}
              >
                <Upload size={24} />
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: '#3C0815' }}>
                Select or Drop a Hero Banner Image
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#7A6E65' }}>
                PNG, JPEG, WebP, AVIF up to 10MB. We will frame it to 1024 × 385 pixels.
              </p>
            </div>
          )}

          {/* Interactive Crop Viewport */}
          {imageSrc && (
            <div>
              {/* Instructions banner */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                  fontSize: '12.5px',
                  color: '#605249',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Move size={14} color="#55000A" />
                  <strong>Drag to Pan & Reposition</strong> | Use slider to zoom
                </span>
                <span
                  style={{
                    background: '#FAF0D7',
                    color: '#6E4E09',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 700,
                    fontSize: '11.5px',
                  }}
                >
                  Locked Aspect Ratio: 2.66 : 1 (1024 × 385)
                </span>
              </div>

              {/* Viewport Frame */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: `${BANNER_ASPECT_RATIO}`,
                  background: '#1F1714',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  cursor: isDragging ? 'grabbing' : 'grab',
                  boxShadow: 'inset 0 0 20px rgba(0,0,0,0.6)',
                  userSelect: 'none',
                }}
                ref={containerRef}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
              >
                {/* Visual Cropping Grid Overlay */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    zIndex: 10,
                    border: '2px solid rgba(240, 199, 78, 0.85)',
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
                  }}
                >
                  {/* Rule-of-thirds grid lines */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '33.33%',
                      left: 0,
                      right: 0,
                      height: '1px',
                      background: 'rgba(255, 255, 255, 0.35)',
                      borderTop: '1px dashed rgba(0, 0, 0, 0.3)',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '66.66%',
                      left: 0,
                      right: 0,
                      height: '1px',
                      background: 'rgba(255, 255, 255, 0.35)',
                      borderTop: '1px dashed rgba(0, 0, 0, 0.3)',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      left: '33.33%',
                      top: 0,
                      bottom: 0,
                      width: '1px',
                      background: 'rgba(255, 255, 255, 0.35)',
                      borderLeft: '1px dashed rgba(0, 0, 0, 0.3)',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      left: '66.66%',
                      top: 0,
                      bottom: 0,
                      width: '1px',
                      background: 'rgba(255, 255, 255, 0.35)',
                      borderLeft: '1px dashed rgba(0, 0, 0, 0.3)',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: '10px',
                      background: 'rgba(0,0,0,0.65)',
                      color: '#FFF8EC',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                    }}
                  >
                    1024 × 385 (Output Standard)
                  </div>
                </div>

                {/* The Image being adjusted */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img
                    src={imageSrc}
                    alt="Adjusting preview"
                    draggable={false}
                    style={{
                      minWidth: '100%',
                      minHeight: '100%',
                      maxWidth: 'none',
                      maxHeight: 'none',
                      transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                      transformOrigin: 'center center',
                      transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                      pointerEvents: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Controls Toolbar */}
              <div
                style={{
                  marginTop: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  background: '#F8F5EE',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid #E5DED0',
                }}
              >
                {/* Zoom Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '220px' }}>
                  <button
                    type="button"
                    onClick={() => setZoom(z => Math.max(1, +(z - 0.15).toFixed(2)))}
                    disabled={zoom <= 1}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #D4C9B8',
                      borderRadius: '6px',
                      padding: '5px',
                      color: '#55000A',
                      cursor: zoom <= 1 ? 'not-allowed' : 'pointer',
                      opacity: zoom <= 1 ? 0.5 : 1,
                    }}
                    title="Zoom Out"
                  >
                    <ZoomOut size={16} />
                  </button>

                  <input
                    type="range"
                    min="1"
                    max="3.5"
                    step="0.05"
                    value={zoom}
                    onChange={e => setZoom(parseFloat(e.target.value))}
                    style={{
                      flex: 1,
                      accentColor: '#55000A',
                      cursor: 'pointer',
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => setZoom(z => Math.min(3.5, +(z + 0.15).toFixed(2)))}
                    disabled={zoom >= 3.5}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #D4C9B8',
                      borderRadius: '6px',
                      padding: '5px',
                      color: '#55000A',
                      cursor: zoom >= 3.5 ? 'not-allowed' : 'pointer',
                      opacity: zoom >= 3.5 ? 0.5 : 1,
                    }}
                    title="Zoom In"
                  >
                    <ZoomIn size={16} />
                  </button>

                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#55000A', minWidth: '42px' }}>
                    {Math.round(zoom * 100)}%
                  </span>
                </div>

                {/* Reset & Change Image Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleReset}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: '#FFFFFF',
                      border: '1px solid #D4C9B8',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      color: '#605249',
                      cursor: 'pointer',
                    }}
                  >
                    <RotateCcw size={13} />
                    <span>Reset Framing</span>
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: '#FFFFFF',
                      border: '1px solid #D4C9B8',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      color: '#55000A',
                      cursor: 'pointer',
                    }}
                  >
                    <Upload size={13} />
                    <span>Choose Different Image</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #EAE5D9',
            background: '#FAF8F4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: '12px', color: '#7A6E65', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} color="#D4AA45" />
            <span>Dimensions are preserved automatically for flawless hero display.</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                border: '1px solid #D4C9B8',
                background: '#FFFFFF',
                color: '#55000A',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleCropAndUpload}
              disabled={!imageSrc || uploading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 22px',
                borderRadius: '8px',
                border: 'none',
                background: !imageSrc || uploading ? '#B8A69E' : 'linear-gradient(135deg, #55000A 0%, #7A0A17 100%)',
                color: '#FFF8EC',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: !imageSrc || uploading ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 8px rgba(85,0,10,0.25)',
              }}
            >
              {uploading ? (
                <>
                  <Spinner size="sm" />
                  <span>Processing & Uploading…</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>Apply Crop & Save Image</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
