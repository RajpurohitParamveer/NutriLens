import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Zap, Image as ImageIcon, Camera, RefreshCw, AlertCircle, ZapOff } from "lucide-react";
import { useCamera, CameraState } from "@/hooks/use-camera";
import { useGallery } from "@/hooks/use-gallery";

interface CameraPermissionScreenProps {
  state: CameraState;
  error: string | null;
  onRetry: () => void;
  onCancel: () => void;
}

function CameraPermissionScreen({ state, error, onRetry, onCancel }: CameraPermissionScreenProps) {
  const getContent = () => {
    switch (state) {
      case "requesting":
        return {
          icon: <Camera className="h-12 w-12 text-primary animate-pulse" />,
          title: "Requesting Camera Access",
          description: "Please allow camera access when prompted to scan nutrition labels.",
          showRetry: false,
        };
      case "denied":
        return {
          icon: <AlertCircle className="h-12 w-12 text-destructive" />,
          title: "Camera Access Denied",
          description: error || "Camera permission was denied. Please enable camera access in your browser settings.",
          showRetry: true,
        };
      case "not-supported":
        return {
          icon: <AlertCircle className="h-12 w-12 text-muted-foreground" />,
          title: "Camera Not Available",
          description: error || "Your device doesn't have a camera or it's not accessible.",
          showRetry: false,
        };
      case "error":
        return {
          icon: <AlertCircle className="h-12 w-12 text-destructive" />,
          title: "Camera Error",
          description: error || "Something went wrong while accessing the camera.",
          showRetry: true,
        };
      default:
        return {
          icon: <Camera className="h-12 w-12 text-primary" />,
          title: "Camera Ready",
          description: "Tap to start the camera",
          showRetry: true,
        };
    }
  };

  const content = getContent();

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-foreground/95 px-8 text-center z-20">
      <div className="mb-6 p-4 rounded-full bg-background/10 animate-fade-in-up">
        {content.icon}
      </div>
      <h2 className="text-xl font-semibold text-primary-foreground mb-2 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
        {content.title}
      </h2>
      <p className="text-primary-foreground/70 text-sm mb-8 max-w-xs animate-fade-in-up" style={{ animationDelay: "200ms" }}>
        {content.description}
      </p>
      <div className="flex flex-col gap-3 w-full max-w-xs animate-fade-in-up" style={{ animationDelay: "300ms" }}>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
            onClick={onCancel}
          >
            Go Back
          </Button>
          {content.showRetry && (
            <Button
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={onRetry}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

interface ImagePreviewProps {
  image: string;
  onConfirm: (servingSize?: string) => void;
  onRetake: () => void;
}

function ImagePreview({ image, onConfirm, onRetake }: ImagePreviewProps) {
  const [servingSize, setServingSize] = useState("");

  const handleConfirm = () => {
    onConfirm(servingSize.trim() || undefined);
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-foreground z-30">
      <div className="flex-1 relative">
        <img
          src={image}
          alt="Captured nutrition label"
          className="absolute inset-0 w-full h-full object-contain animate-fade-in-up"
        />
        
        {/* Gradient overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-foreground to-transparent" />
      </div>
      
      <div className="bg-foreground pb-10 pt-6 safe-bottom">
        <p className="text-primary-foreground/70 text-sm text-center mb-3">
          Is the nutrition label clearly visible?
        </p>
        
        {/* Serving Size Input (Optional) */}
        <div className="mb-4 px-8">
          <label className="block text-xs text-primary-foreground/60 mb-2 text-center">
            Serving Size (Optional)
          </label>
          <input
            type="text"
            value={servingSize}
            onChange={(e) => setServingSize(e.target.value)}
            placeholder="e.g., 1 cup, 100g, 1 piece"
            className="w-full px-4 py-2.5 bg-background/20 backdrop-blur-sm border border-primary-foreground/20 rounded-lg text-primary-foreground placeholder:text-primary-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
        </div>

        <div className="flex items-center justify-center gap-4 px-8">
          <Button
            variant="outline"
            size="lg"
            className="flex-1 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
            onClick={onRetake}
          >
            Retake
          </Button>
          <Button
            size="lg"
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary"
            onClick={handleConfirm}
          >
            Analyze Label
          </Button>
        </div>
      </div>
    </div>
  );
}

function ScanOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {/* Dark overlay with center cutout effect */}
      <div className="absolute inset-0 bg-foreground/40" />
      
      <div className="relative w-72 h-96">
        {/* Clear center area */}
        <div className="absolute inset-0 bg-foreground/0 rounded-2xl" 
             style={{ 
               boxShadow: "0 0 0 9999px hsla(220, 13%, 18%, 0.6)" 
             }} 
        />
        
        {/* Corner Accents */}
        <div className="absolute -top-1 -left-1 w-10 h-10 border-t-4 border-l-4 border-primary rounded-tl-2xl" />
        <div className="absolute -top-1 -right-1 w-10 h-10 border-t-4 border-r-4 border-primary rounded-tr-2xl" />
        <div className="absolute -bottom-1 -left-1 w-10 h-10 border-b-4 border-l-4 border-primary rounded-bl-2xl" />
        <div className="absolute -bottom-1 -right-1 w-10 h-10 border-b-4 border-r-4 border-primary rounded-br-2xl" />

        {/* Scan Line Animation */}
        <div className="absolute left-4 right-4 top-4 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line" />
        
        {/* Inner border */}
        <div className="absolute inset-0 border-2 border-primary/20 rounded-2xl" />
      </div>
    </div>
  );
}

export default function Scan() {
  const navigate = useNavigate();
  const [flashOn, setFlashOn] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const {
    videoRef,
    canvasRef,
    state: cameraState,
    error: cameraError,
    startCamera,
    stopCamera,
    captureImage,
  } = useCamera({ facingMode: "environment" });

  const {
    inputRef,
    selectedImage,
    isLoading: galleryLoading,
    openGallery,
    clearImage,
    handleFileSelect,
  } = useGallery();

  // Start camera on mount
  useEffect(() => {
    startCamera();
  }, [startCamera]);

  // Handle gallery image selection
  useEffect(() => {
    if (selectedImage) {
      stopCamera();
      setCapturedImage(selectedImage);
    }
  }, [selectedImage, stopCamera]);

  const handleCapture = () => {
    const image = captureImage();
    if (image) {
      setCapturedImage(image);
      stopCamera();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    clearImage();
    startCamera();
  };

  const handleConfirm = (servingSize?: string) => {
    if (capturedImage) {
      // Store captured image in sessionStorage for processing
      sessionStorage.setItem("captured-image", capturedImage);
      // Store serving size if provided
      if (servingSize) {
        sessionStorage.setItem("serving-size", servingSize);
      }
      navigate("/processing");
    }
  };

  const handleFlashToggle = () => {
    setFlashOn(!flashOn);
  };

  const handleCancel = () => {
    stopCamera();
    navigate("/home");
  };

  // Show image preview if we have a captured image
  if (capturedImage) {
    return (
      <div className="min-h-screen bg-foreground">
        <ImagePreview
          image={capturedImage}
          onConfirm={handleConfirm}
          onRetake={handleRetake}
        />
      </div>
    );
  }

  // Show permission/error screen if camera is not active
  const showPermissionScreen = cameraState !== "active" && cameraState !== "idle";

  return (
    <div className="fixed inset-0 bg-foreground">
      {/* Hidden file input for gallery */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera Preview - Full Screen */}
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            cameraState !== "active" ? "opacity-0" : "opacity-100"
          }`}
        />

        {/* Permission/Error Screen */}
        {showPermissionScreen && (
          <CameraPermissionScreen
            state={cameraState}
            error={cameraError}
            onRetry={startCamera}
            onCancel={handleCancel}
          />
        )}

        {/* Scan Frame Overlay - only show when camera is active */}
        {cameraState === "active" && <ScanOverlay />}
      </div>

      {/* Top Controls - Floating Overlay */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 safe-top bg-gradient-to-b from-foreground/50 to-transparent">
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 bg-background/20 backdrop-blur-md text-primary-foreground hover:bg-background/30 rounded-full"
          onClick={handleCancel}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="text-center">
          <span className="text-primary-foreground/90 text-sm font-medium">
            Scan Label
          </span>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className={`h-11 w-11 backdrop-blur-md rounded-full transition-all ${
            flashOn
              ? "bg-accent text-accent-foreground"
              : "bg-background/20 text-primary-foreground hover:bg-background/30"
          }`}
          onClick={handleFlashToggle}
        >
          {flashOn ? <Zap className="h-5 w-5" /> : <ZapOff className="h-5 w-5" />}
        </Button>
      </div>

      {/* Instruction Text - Floating Overlay */}
      {cameraState === "active" && (
        <div className="absolute bottom-32 left-0 right-0 text-center px-6 z-10">
          <div className="inline-block px-4 py-2 rounded-full bg-foreground/60 backdrop-blur-sm">
            <p className="text-primary-foreground text-sm font-medium">
              Position nutrition label within the frame
            </p>
          </div>
        </div>
      )}

      {/* Bottom Controls - Floating Overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-10 pb-8 pt-6 safe-bottom">
        <div className="flex items-center justify-around px-8">
          {/* Gallery Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-14 w-14 bg-background/20 backdrop-blur-md text-primary-foreground hover:bg-background/30 rounded-full transition-transform active:scale-95"
            onClick={openGallery}
            disabled={galleryLoading}
          >
            {galleryLoading ? (
              <div className="h-6 w-6 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <ImageIcon className="h-6 w-6" />
            )}
          </Button>

          {/* Capture Button */}
          <button
            onClick={handleCapture}
            disabled={cameraState !== "active"}
            className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-all active:scale-95 shadow-lg ${
              cameraState !== "active" ? "opacity-50" : "hover:scale-105"
            }`}
            aria-label="Capture photo"
          >
            <div className="w-16 h-16 rounded-full bg-white transition-all hover:bg-white/90" />
          </button>

          {/* Spacer for alignment */}
          <div className="h-14 w-14" />
        </div>
        
        {/* Gallery hint when camera is not available */}
        {cameraState !== "active" && cameraState !== "idle" && (
          <p className="text-center text-primary-foreground/60 text-xs mt-4 animate-fade-in-up">
            Tap the gallery icon to select an image from your device
          </p>
        )}
      </div>
    </div>
  );
}
