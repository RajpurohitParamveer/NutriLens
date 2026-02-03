import { useState, useCallback, useRef } from "react";

interface UseGalleryReturn {
  inputRef: React.RefObject<HTMLInputElement>;
  selectedImage: string | null;
  isLoading: boolean;
  error: string | null;
  openGallery: () => void;
  clearImage: () => void;
  handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

export function useGallery(): UseGalleryReturn {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openGallery = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const clearImage = useCallback(() => {
    setSelectedImage(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, []);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) {
      return;
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Please select a valid image file (JPEG, PNG, or WebP)");
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError("Image is too large. Please select an image under 10MB.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const reader = new FileReader();
    
    reader.onload = (e) => {
      const result = e.target?.result as string;
      
      // Create an image to validate and potentially resize
      const img = new Image();
      img.onload = () => {
        // If image is very large, resize it
        if (img.width > 2000 || img.height > 2000) {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          
          if (ctx) {
            const scale = Math.min(2000 / img.width, 2000 / img.height);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            setSelectedImage(canvas.toDataURL("image/jpeg", 0.9));
          } else {
            setSelectedImage(result);
          }
        } else {
          setSelectedImage(result);
        }
        setIsLoading(false);
      };
      
      img.onerror = () => {
        setError("Failed to load image. Please try another file.");
        setIsLoading(false);
      };
      
      img.src = result;
    };

    reader.onerror = () => {
      setError("Failed to read file. Please try again.");
      setIsLoading(false);
    };

    reader.readAsDataURL(file);
  }, []);

  return {
    inputRef,
    selectedImage,
    isLoading,
    error,
    openGallery,
    clearImage,
    handleFileSelect,
  };
}
