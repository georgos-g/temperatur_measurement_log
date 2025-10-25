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
  isRotated?: boolean;
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
 * Fast image processing for PDF generation - minimal processing for speed
 * Downloads image, resizes to target dimensions, skips compression
 * @param imageUrl - The URL of the image to process
 * @param options - Processing options (maxWidth, maxHeight)
 * @returns Promise<ProcessedImage | null> - Returns null if processing fails
 */
export async function downloadAndResizeImageFast(
  imageUrl: string,
  options: ImageProcessingOptions
): Promise<ProcessedImage | null> {
  try {
    // Validate URL format
    if (!imageUrl || !imageUrl.startsWith('http')) {
      console.error(`Invalid image URL: ${imageUrl}`);
      return null;
    }

    // Download the image with shorter timeout for speed
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // Reduced timeout for speed

    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Temperature-PDF-Fast/1.0',
        Accept: 'image/*',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(
        `Failed to download image: ${imageUrl} (${response.status})`
      );
      return null;
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      console.error(`Invalid content type: ${imageUrl}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length === 0) {
      console.error(`Empty image buffer: ${imageUrl}`);
      return null;
    }

    // Load image with minimal error handling for speed
    const image = await loadImage(buffer);

    // Quick dimension validation
    if (image.width === 0 || image.height === 0) {
      console.error(`Invalid dimensions: ${imageUrl}`);
      return null;
    }

    // Determine if rotation is needed (portrait to landscape)
    const isPortrait = image.height > image.width;
    const needsRotation = isPortrait;

    // Calculate target dimensions
    const sourceWidth = needsRotation ? image.height : image.width;
    const sourceHeight = needsRotation ? image.width : image.height;

    const { width, height } = calculateDimensions(
      sourceWidth,
      sourceHeight,
      options.maxWidth,
      options.maxHeight
    );

    // Create canvas with minimal settings for speed
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Minimal image smoothing for speed
    ctx.imageSmoothingEnabled = false; // Faster than true

    // Draw image with rotation if needed
    if (needsRotation) {
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate(Math.PI / 2);

      const scaleX = width / image.height;
      const scaleY = height / image.width;
      const scale = Math.min(scaleX, scaleY);

      const scaledWidth = image.width * scale;
      const scaledHeight = image.height * scale;

      ctx.drawImage(
        image,
        -scaledWidth / 2,
        -scaledHeight / 2,
        scaledWidth,
        scaledHeight
      );

      ctx.restore();
    } else {
      ctx.drawImage(image, 0, 0, width, height);
    }

    // Convert to JPEG with minimal quality settings for speed
    const jpegBuffer = canvas.toBuffer('image/jpeg', {
      quality: 0.6, // Lower quality for speed
      progressive: false, // Faster than progressive
      chromaSubsampling: true, // Smaller files
    });

    return {
      data: jpegBuffer,
      width,
      height,
      format: 'jpeg',
      isRotated: needsRotation,
    };
  } catch (error) {
    console.error(`Fast processing failed for ${imageUrl}:`, error);
    return null;
  }
}

/**
 * Fast batch processing for PDF generation
 * Processes multiple images with higher concurrency and no delays
 */
export async function processImagesBatchFast(
  imageUrls: string[],
  options: ImageProcessingOptions,
  concurrency: number = 4 // Higher concurrency for speed
): Promise<(ProcessedImage | null)[]> {
  const results: (ProcessedImage | null)[] = new Array(imageUrls.length).fill(
    null
  );

  console.log(
    `Fast processing ${imageUrls.length} images with concurrency: ${concurrency}`
  );

  // Process images in batches with higher concurrency
  for (let i = 0; i < imageUrls.length; i += concurrency) {
    const batch = imageUrls.slice(i, i + concurrency);
    const batchPromises = batch.map(async (url) => {
      try {
        return await downloadAndResizeImageFast(url, options);
      } catch (error) {
        console.error(`Fast processing failed for ${url}:`, error);
        return null;
      }
    });

    const batchResults = await Promise.all(batchPromises);

    // Store results
    batchResults.forEach((result, batchIndex) => {
      const globalIndex = i + batchIndex;
      results[globalIndex] = result;
    });

    // No delays between batches for maximum speed
  }

  const successCount = results.filter((r) => r !== null).length;
  console.log(
    `Fast processing complete: ${successCount}/${imageUrls.length} images processed`
  );

  return results;
}
