import { createCanvas, loadImage } from 'canvas';

export interface ImageProcessingOptions {
  maxWidth: number;
  maxHeight: number;
  quality?: number;
}

export interface ProcessedImage {
  data: Buffer;
  width: number;
  height: number;
  format: 'jpeg' | 'png';
}

/**
 * Downloads an image from a URL and resizes it to fit within the specified dimensions
 * @param imageUrl - The URL of the image to download and process
 * @param options - Processing options including max dimensions
 * @returns Promise<ProcessedImage | null> - Returns null if processing fails
 */
export async function downloadAndResizeImage(
  imageUrl: string,
  options: ImageProcessingOptions
): Promise<ProcessedImage | null> {
  try {
    // Download the image with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout for Vercel limits

    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Temperature-PDF-Generator/1.0',
        Accept: 'image/*',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(
        `Failed to download image from ${imageUrl}: ${response.status}`
      );
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Load the image using canvas
    const image = await loadImage(buffer);

    // Calculate new dimensions maintaining aspect ratio
    const { width, height } = calculateDimensions(
      image.width,
      image.height,
      options.maxWidth,
      options.maxHeight
    );

    // Create canvas and draw resized image
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Enable image smoothing for better quality
    ctx.imageSmoothingEnabled = true;

    // Draw the resized image
    ctx.drawImage(image, 0, 0, width, height);

    // Convert to JPEG for smaller file size with maximum quality
    const jpegBuffer = canvas.toBuffer('image/jpeg', {
      quality: options.quality || 0.99, // Maximum quality
    });

    return {
      data: jpegBuffer,
      width,
      height,
      format: 'jpeg',
    };
  } catch (error) {
    console.error(`Error processing image from ${imageUrl}:`, error);
    return null;
  }
}

/**
 * Calculates new dimensions while maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight;

  let width = maxWidth;
  let height = maxHeight;

  // If the image is wider than it is tall
  if (aspectRatio > 1) {
    height = width / aspectRatio;
    // If height exceeds max, scale down further
    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }
  } else {
    // If the image is taller than it is wide
    width = height * aspectRatio;
    // If width exceeds max, scale down further
    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
  };
}

/**
 * Processes multiple images concurrently with memory management
 * @param imageUrls - Array of image URLs to process
 * @param options - Processing options
 * @param concurrency - Maximum number of concurrent downloads (default: 3)
 */
export async function processImagesBatch(
  imageUrls: string[],
  options: ImageProcessingOptions,
  concurrency: number = 2 // Reduced concurrency for Vercel memory limits
): Promise<(ProcessedImage | null)[]> {
  const results: (ProcessedImage | null)[] = new Array(imageUrls.length).fill(
    null
  );

  // Limit total images to prevent memory issues
  const maxImages = 20; // Vercel serverless function memory limit consideration
  const urlsToProcess = imageUrls.slice(0, maxImages);

  if (imageUrls.length > maxImages) {
    console.warn(
      `Limiting image processing to ${maxImages} images for memory constraints`
    );
  }

  // Process images in batches to manage memory
  for (let i = 0; i < urlsToProcess.length; i += concurrency) {
    const batch = urlsToProcess.slice(i, i + concurrency);
    const batchPromises = batch.map(async (url, batchIndex) => {
      const globalIndex = i + batchIndex;
      try {
        return await downloadAndResizeImage(url, options);
      } catch (error) {
        console.error(`Failed to process image ${globalIndex}:`, error);
        return null;
      }
    });

    const batchResults = await Promise.all(batchPromises);

    // Store results in the correct positions
    batchResults.forEach((result, batchIndex) => {
      const globalIndex = i + batchIndex;
      results[globalIndex] = result;
    });

    // Small delay between batches to prevent overwhelming the server
    if (i + concurrency < urlsToProcess.length) {
      await new Promise((resolve) => setTimeout(resolve, 200)); // Increased delay for Vercel
    }
  }

  return results;
}
