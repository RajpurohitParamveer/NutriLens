import { useState, useRef, useCallback, useEffect } from "react";

export type CameraState = "idle" | "requesting" | "active" | "denied" | "not-supported" | "error";

interface UseCameraOptions {
  facingMode?: "user" | "environment";
}

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  state: CameraState;
  error: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  captureImage: () => string | null;
  switchCamera: () => Promise<void>;
  stream: MediaStream | null;
}

export function useCamera(options: UseCameraOptions = {}): UseCameraReturn {
  const { facingMode = "environment" } = options;
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [state, setState] = useState<CameraState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [currentFacingMode, setCurrentFacingMode] = useState(facingMode);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setState("idle");
  }, []);

  const startCamera = useCallback(async () => {
    // Check if camera API is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setState("not-supported");
      setError("Camera is not supported on this device or browser");
      return;
    }

    setState("requesting");
    setError(null);

    try {
      // Stop any existing stream
      stopCamera();

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: currentFacingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      setState("active");
    } catch (err) {
      const error = err as Error;
      
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        setState("denied");
        setError("Camera permission was denied. Please allow camera access to scan nutrition labels.");
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        setState("not-supported");
        setError("No camera found on this device.");
      } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
        setState("error");
        setError("Camera is in use by another application.");
      } else {
        setState("error");
        setError("Failed to access camera. Please try again.");
      }
      
      console.error("Camera error:", error);
    }
  }, [currentFacingMode, stopCamera]);

  const switchCamera = useCallback(async () => {
    const newFacingMode = currentFacingMode === "environment" ? "user" : "environment";
    setCurrentFacingMode(newFacingMode);
    
    if (state === "active") {
      stopCamera();
      // Small delay to ensure cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
      await startCamera();
    }
  }, [currentFacingMode, state, stopCamera, startCamera]);

  const captureImage = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) {
      return null;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) {
      return null;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame to the canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64 image (JPEG for smaller size)
    const imageData = canvas.toDataURL("image/jpeg", 0.9);
    
    return imageData;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    canvasRef,
    state,
    error,
    startCamera,
    stopCamera,
    captureImage,
    switchCamera,
    stream: streamRef.current,
  };
}
