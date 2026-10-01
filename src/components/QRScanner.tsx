'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import jsQR from 'jsqr';

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const webcamRef = useRef<Webcam>(null);
  const [scanning, setScanning] = useState(true);
  const [hasCamera, setHasCamera] = useState(true);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const capture = useCallback(() => {
    if (!scanning || !webcamRef.current) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    const image = new Image();
    image.src = imageSrc;

    image.onload = () => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) return;

      canvas.width = image.width;
      canvas.height = image.height;
      context.drawImage(image, 0, 0);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code) {
        setScanning(false);
        onScan(code.data);
      }
    };
  }, [scanning, onScan]);

  useEffect(() => {
    if (scanning) {
      scanIntervalRef.current = setInterval(capture, 100); // Scan every 100ms
    } else {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    }

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, [scanning, capture]);

  const handleUserMediaError = (error: string | DOMException) => {
    console.error('Camera error:', error);
    setHasCamera(false);
    if (onError) {
      onError('Camera access denied or not available');
    }
  };

  const resetScanner = () => {
    setScanning(true);
  };

  if (!hasCamera) {
    return (
      <div className="glass rounded-xl p-8 text-center">
        <div className="text-6xl mb-4">📷</div>
        <h3 className="text-xl font-semibold mb-2">Camera Access Required</h3>
        <p className="text-muted-foreground mb-4">
          Please allow camera access to scan QR codes
        </p>
        <button
          onClick={() => {
            setHasCamera(true);
            setScanning(true);
          }}
          className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="glass rounded-xl overflow-hidden">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            facingMode: 'environment', // Use back camera on mobile
            width: 1280,
            height: 720,
          }}
          onUserMediaError={handleUserMediaError}
          className="w-full"
        />
        
        {/* Scanning Overlay */}
        {scanning && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="border-4 border-green-500 rounded-lg w-64 h-64 animate-pulse" />
          </div>
        )}
      </div>

      {/* Scanner Status */}
      <div className="mt-4 text-center">
        {scanning ? (
          <p className="text-sm text-muted-foreground animate-pulse flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Position QR code in the frame...
          </p>
        ) : (
          <button
            onClick={resetScanner}
            className="px-6 py-2 rounded-lg glass hover:glass-hover transition-all"
          >
            Scan Another Ticket
          </button>
        )}
      </div>
    </div>
  );
}
