/**
 * Image processing utilities for NutriLens
 * Handles image compression, optimization, and preprocessing for OCR
 */

interface ProcessedImage {
  dataUrl: string;
  width: number;
  height: number;
  size: number;
}

/**
 * Compress and optimize an image for processing
 */
export async function compressImage(
  imageDataUrl: string,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.85
): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }
      
      // Create canvas and draw resized image
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }
      
      // Apply image smoothing for better quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to JPEG for smaller size
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      
      // Calculate approximate size in bytes
      const base64Length = dataUrl.length - "data:image/jpeg;base64,".length;
      const size = Math.ceil((base64Length * 3) / 4);
      
      resolve({
        dataUrl,
        width,
        height,
        size,
      });
    };
    
    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };
    
    img.src = imageDataUrl;
  });
}

/**
 * Preprocess image for better OCR accuracy
 * Applies contrast enhancement and sharpening
 */
export async function preprocessForOCR(imageDataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }
      
      // Draw original image
      ctx.drawImage(img, 0, 0);
      
      // Get image data for manipulation
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Apply contrast enhancement
      const factor = 1.2; // Contrast factor
      const intercept = 128 * (1 - factor);
      
      for (let i = 0; i < data.length; i += 4) {
        // Apply to RGB channels
        data[i] = Math.min(255, Math.max(0, factor * data[i] + intercept));
        data[i + 1] = Math.min(255, Math.max(0, factor * data[i + 1] + intercept));
        data[i + 2] = Math.min(255, Math.max(0, factor * data[i + 2] + intercept));
      }
      
      // Put processed data back
      ctx.putImageData(imageData, 0, 0);
      
      resolve(canvas.toDataURL("image/jpeg", 0.95));
    };
    
    img.onerror = () => {
      reject(new Error("Failed to load image for preprocessing"));
    };
    
    img.src = imageDataUrl;
  });
}

/**
 * Extract the region of interest (nutrition label) from an image
 * This is a basic implementation - in production, use ML-based detection
 */
export function cropToCenter(
  imageDataUrl: string,
  cropRatio: number = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement("canvas");
      
      const cropWidth = img.width * cropRatio;
      const cropHeight = img.height * cropRatio;
      const startX = (img.width - cropWidth) / 2;
      const startY = (img.height - cropHeight) / 2;
      
      canvas.width = cropWidth;
      canvas.height = cropHeight;
      
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }
      
      ctx.drawImage(
        img,
        startX,
        startY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      );
      
      resolve(canvas.toDataURL("image/jpeg", 0.9));
    };
    
    img.onerror = () => {
      reject(new Error("Failed to crop image"));
    };
    
    img.src = imageDataUrl;
  });
}

/**
 * Convert base64 data URL to Blob for upload
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(",");
  const mime = parts[0].match(/:(.*?);/)?.[1] || "image/jpeg";
  const byteString = atob(parts[1]);
  
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8Array = new Uint8Array(arrayBuffer);
  
  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }
  
  return new Blob([arrayBuffer], { type: mime });
}

/**
 * Get image dimensions from a data URL
 */
export function getImageDimensions(
  dataUrl: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => reject(new Error("Failed to get image dimensions"));
    img.src = dataUrl;
  });
}
