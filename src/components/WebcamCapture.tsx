import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, X, Sparkles, AlertCircle } from 'lucide-react';

interface WebcamCaptureProps {
  onCapture: (base64Data: string) => void;
  onClose: () => void;
}

export function WebcamCapture({ onCapture, onClose }: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isFlashActive, setIsFlashActive] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);

  // Find camera options
  useEffect(() => {
    async function getDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(d => d.kind === 'videoinput');
        setAvailableDevices(cameras);
      } catch (err) {
        console.warn("Could not list video devices", err);
      }
    }
    getDevices();
  }, []);

  // Initialize stream on facingMode change
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    setErrorMsg(null);

    async function initCamera() {
      // Clean previous stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      try {
        // Attempt facing mode
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: facingMode,
            width: { ideal: 1080 },
            height: { ideal: 1080 },
          },
          audio: false,
        };

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        activeStream = mediaStream;
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err: any) {
        console.error("Camera access failed for constraint:", facingMode, err);
        // Try fallback with simple video constraints
        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
          activeStream = mediaStream;
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        } catch (fallbackErr) {
          setErrorMsg("Camera access denied or unavailable. Please ensure camera permissions are active or try 'Upload Photo' instead.");
        }
      }
    }

    initCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  const switchCamera = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !stream) return;

    // Simulate screen flash visual
    setIsFlashActive(true);
    setTimeout(() => setIsFlashActive(false), 200);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Set canvas dimensions equal to the video stream size
      const videoWidth = video.videoWidth || 640;
      const videoHeight = video.videoHeight || 480;
      canvas.width = videoWidth;
      canvas.height = videoHeight;

      // Draw the current frame of the video
      ctx.drawImage(video, 0, 0, videoWidth, videoHeight);

      // Get JPEG base64 quality 0.85
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      
      // Extract prefix (e.g. "data:image/jpeg;base64,")
      const base64Data = dataUrl.split(',')[1];
      if (base64Data) {
        // Shutter feedback noise (Web Audio API synthetizer click!)
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(800, audioCtx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.08);
          gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
          gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.1);
        } catch (e) {
          // ignore web audio restrictions
        }

        onCapture(base64Data);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0F0F0F] rounded-2xl overflow-hidden relative">
      {/* Screen flash overlay */}
      {isFlashActive && (
        <div className="absolute inset-0 bg-white z-50 animate-fade-out pointer-events-none" />
      )}

      {/* Cam header */}
      <div className="bg-[#1A1A1A] px-4 py-3 flex justify-between items-center text-xs border-b border-white/[0.05]">
        <div className="flex items-center gap-2 text-white font-semibold">
          <Sparkles className="w-4 h-4 text-[#00E5A0] animate-pulse" />
          <span>Real Cal AI Live Lens</span>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <span className="text-[10px] bg-white/5 px-2 py-1 rounded font-mono uppercase">
            {facingMode === 'environment' ? 'Environment Lens' : 'Selfie Cam'}
          </span>
          <button onClick={onClose} className="p-1 hover:text-white rounded-lg hover:bg-white/5">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Video stream box */}
      <div className="flex-1 min-h-[280px] bg-black relative flex items-center justify-center overflow-hidden">
        {errorMsg ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-xs space-y-3 bg-[#121212]">
            <AlertCircle className="w-8 h-8 text-amber-500" />
            <p className="text-gray-300 leading-relaxed font-semibold">{errorMsg}</p>
            <p className="text-gray-500 text-[10px] max-w-xs leading-normal">
              You can still click 'Upload Photo' to select food pictures directly from your mobile camera roll gallery or PC!
            </p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Camera targeting borders overlay */}
            <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 aspect-square border-2 border-dashed border-[#00E5A0]/40 rounded-2xl flex items-center justify-center pointer-events-none">
              <div className="w-4 h-4 border-t-2 border-l-2 border-[#00E5A0] absolute top-[-2px] left-[-2px]" />
              <div className="w-4 h-4 border-t-2 border-r-2 border-[#00E5A0] absolute top-[-2px] right-[-2px]" />
              <div className="w-4 h-4 border-b-2 border-l-2 border-[#00E5A0] absolute bottom-[-2px] left-[-2px]" />
              <div className="w-4 h-4 border-b-2 border-r-2 border-[#00E5A0] absolute bottom-[-2px] right-[-2px]" />
              <div className="text-[10px] text-white/50 font-mono tracking-wider bg-black/60 px-3 py-1 rounded-full uppercase">
                Align Plate
              </div>
            </div>
            
            <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] text-[#00E5A0] font-mono pointer-events-none">
              Auto-Exposure: Active
            </div>
          </>
        )}
      </div>

      {/* Under deck camera capture control bar */}
      <div className="bg-[#161616] p-4 flex justify-around items-center border-t border-white/[0.05]">
        <button
          onClick={onClose}
          type="button"
          className="p-3 bg-white/5 border border-white/5 rounded-full text-white hover:bg-white/10 active:scale-95 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <button
          onClick={capturePhoto}
          disabled={!!errorMsg}
          type="button"
          className="w-16 h-16 bg-gradient-to-tr from-[#00E5A0] to-emerald-400 hover:scale-105 active:scale-90 transition rounded-full flex items-center justify-center shadow-lg shadow-[#00E5A0]/20 text-gray-900 border-4 border-white/10 disabled:opacity-50"
        >
          <Camera className="w-7 h-7 stroke-[2.5]" />
        </button>

        {availableDevices.length > 1 ? (
          <button
            onClick={switchCamera}
            type="button"
            className="p-3 bg-white/5 border border-white/5 rounded-full text-white hover:bg-white/10 active:scale-95 transition"
          >
            <RefreshCw className="w-5 h-5 text-teal-400" />
          </button>
        ) : (
          <div className="w-11" /> // offset layout spacing spacer
        )}
      </div>

      {/* Pre-render hidden capturing Canvas element */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
