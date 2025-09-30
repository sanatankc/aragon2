import sharp from "sharp";
import { ValidationResult, Validator } from "../services/validate";

/**
 * Blur detection using Laplacian variance
 * Lower variance indicates more blur
 */
export const blurValidator: Validator = async (ctx) => {
  const results: ValidationResult[] = [];
  
  try {
    // Convert to grayscale and apply Laplacian filter
    const { data, info } = await sharp(ctx.original)
      .greyscale()
      .convolve({
        width: 3,
        height: 3,
        kernel: [
          0, -1, 0,
          -1, 4, -1,
          0, -1, 0
        ]
      })
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Calculate variance of the Laplacian
    const pixels = data;
    const pixelCount = info.width * info.height;
    
    // Calculate mean
    let sum = 0;
    for (let i = 0; i < pixels.length; i++) {
      sum += pixels[i];
    }
    const mean = sum / pixelCount;
    
    // Calculate variance
    let variance = 0;
    for (let i = 0; i < pixels.length; i++) {
      const diff = pixels[i] - mean;
      variance += diff * diff;
    }
    variance = variance / pixelCount;
    
    // Threshold for blur detection (lower values = more blur)
    // This threshold can be adjusted based on testing
    const BLUR_THRESHOLD = 40;
    
    if (variance < BLUR_THRESHOLD) {
      results.push({
        code: "BLURRY",
        message: `Image appears to be blurry`,
        details: { 
          laplacianVariance: variance,
          threshold: BLUR_THRESHOLD,
          width: info.width,
          height: info.height
        }
      });
    }
    
  } catch (error) {
    // If blur detection fails, we'll allow the image through
    // but log the error for debugging
    console.warn("Blur detection failed:", error);
  }
  
  return results;
};
