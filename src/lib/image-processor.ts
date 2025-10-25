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
  isRotated?: boolean; // Track if image was rotated to landscape
}

/**
 * Downloads an image from a URL and resizes it to fit within the specified dimensions
 * @param imageUrl - The URL of the image to download and process
 * @param options - Processing options including max dimensions
 * @returns Promise<ProcessedImage | null> - Returns null if processing fails
 */
export async function downloadAndResizeImage(
  imageUrl: string,
  options: ImageProcessingOptions,
  retryCount: number = 0
): Promise<ProcessedImage | null> {
  const maxRetries = 2;

  try {
    // Validate URL format
    if (!imageUrl || !imageUrl.startsWith('http')) {
      console.error(`Invalid image URL: ${imageUrl}`);
      return null;
    }

    // Download the image with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased timeout to 15 seconds for large images

    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Temperature-PDF-Generator/1.0',
        Accept: 'image/*',
        'Cache-Control': 'no-cache',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(
        `Failed to download image from ${imageUrl}: ${response.status} ${response.statusText}`
      );

      // Retry on server errors (5xx) or network issues
      if (
        (response.status >= 500 || response.status === 0) &&
        retryCount < maxRetries
      ) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return downloadAndResizeImage(imageUrl, options, retryCount + 1);
      }

      return null;
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      console.error(`Invalid content type for ${imageUrl}: ${contentType}`);
      return null;
    }

    // Check file size before processing
    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      const fileSizeBytes = parseInt(contentLength);
      const fileSizeMB = fileSizeBytes / (1024 * 1024);
      if (fileSizeMB > 5) {
        console.warn(
          `Image too large (${fileSizeMB.toFixed(2)}MB), skipping: ${imageUrl}`
        );
        return null;
      }
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length === 0) {
      console.error(`Empty image buffer for ${imageUrl}`);
      return null;
    }

    // Double-check actual buffer size
    const actualSizeMB = buffer.length / (1024 * 1024);
    if (actualSizeMB > 5) {
      console.warn(
        `Downloaded image too large (${actualSizeMB.toFixed(
          2
        )}MB), skipping: ${imageUrl}`
      );
      return null;
    }

    // Load the image using canvas with error handling
    let image;
    try {
      image = await loadImage(buffer);
    } catch (loadError) {
      console.error(`Failed to load image with canvas: ${imageUrl}`, loadError);
      return null;
    }

    // Validate image dimensions
    if (image.width === 0 || image.height === 0) {
      console.error(
        `Invalid image dimensions: ${imageUrl} (${image.width}x${image.height})`
      );
      return null;
    }

    // Determine if image needs rotation to landscape
    const isPortrait = image.height > image.width;
    const needsRotation = isPortrait;

    if (needsRotation) {
    }

    // Calculate dimensions for landscape orientation
    // For portrait images, swap width/height to get proper landscape dimensions
    const sourceWidth = needsRotation ? image.height : image.width;
    const sourceHeight = needsRotation ? image.width : image.height;

    const { width, height } = calculateDimensions(
      sourceWidth,
      sourceHeight,
      options.maxWidth,
      options.maxHeight
    );

    // Create canvas for landscape orientation with error handling
    let canvas, ctx;
    try {
      canvas = createCanvas(width, height);
      ctx = canvas.getContext('2d');

      // Enable high-quality image smoothing for best results
      ctx.imageSmoothingEnabled = true;

      // Draw the image with proper rotation
      if (needsRotation) {
        // Save the current transformation matrix
        ctx.save();

        // Move to center of canvas
        ctx.translate(width / 2, height / 2);

        // Rotate 90 degrees clockwise
        ctx.rotate(Math.PI / 2);

        // Calculate the scaled dimensions for the rotated image
        const scaleX = width / image.height; // canvas width / original image height (after rotation)
        const scaleY = height / image.width; // canvas height / original image width (after rotation)
        const scale = Math.min(scaleX, scaleY); // use smaller scale to maintain aspect ratio

        const scaledWidth = image.width * scale;
        const scaledHeight = image.height * scale;

        // Draw the image centered with proper scaling
        ctx.drawImage(
          image,
          -scaledWidth / 2,
          -scaledHeight / 2,
          scaledWidth,
          scaledHeight
        );

        // Restore the transformation matrix
        ctx.restore();
      } else {
        // Draw the image normally (already landscape)
        ctx.drawImage(image, 0, 0, width, height);
      }
    } catch (canvasError) {
      console.error(`Canvas operation failed for ${imageUrl}:`, canvasError);
      return null;
    }

    // Convert to JPEG with optimized settings for PDF
    let jpegBuffer;
    try {
      jpegBuffer = canvas.toBuffer('image/jpeg', {
        quality: Math.min(options.quality || 0.8, 0.8), // Reduced quality for smaller file size
        progressive: false, // Disable progressive for sharper output
        chromaSubsampling: true, // Enable chroma subsampling for smaller files
      });
    } catch (bufferError) {
      console.error(`JPEG conversion failed for ${imageUrl}:`, bufferError);
      return null;
    }

    const originalSize = buffer.length;
    const processedSize = jpegBuffer.length;
    const compressionRatio = ((1 - processedSize / originalSize) * 100).toFixed(
      1
    );

    console.log(
      `Image compression complete: ${(processedSize / 1024).toFixed(
        2
      )}KB (${compressionRatio}% reduction)`
    );

    return {
      data: jpegBuffer,
      width,
      height,
      format: 'jpeg',
      isRotated: needsRotation,
    };
  } catch (error) {
    console.error(`Error processing image from ${imageUrl}:`, error);
    if (error instanceof Error) {
      console.error(`Error type: ${error.name}`);
      console.error(`Error message: ${error.message}`);
    }
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
  concurrency: number = 1 // Single image processing for maximum reliability
): Promise<(ProcessedImage | null)[]> {
  const results: (ProcessedImage | null)[] = new Array(imageUrls.length).fill(
    null
  );

  // Process all images - no artificial limit
  // Memory management is handled by concurrency control
  const urlsToProcess = imageUrls;

  // Process images in batches to manage memory
  for (let i = 0; i < urlsToProcess.length; i += concurrency) {
    const batch = urlsToProcess.slice(i, i + concurrency);
    const batchPromises = batch.map(async (url, batchIndex) => {
      const globalIndex = i + batchIndex;
      try {
        return await downloadAndResizeImage(url, options, 0);
      } catch (error) {
        console.error(
          `Failed to process image ${globalIndex} (${url}):`,
          error
        );
        return null;
      }
    });

    const batchResults = await Promise.all(batchPromises);

    // Store results in the correct positions
    batchResults.forEach((result, batchIndex) => {
      const globalIndex = i + batchIndex;
      results[globalIndex] = result;
    });

    // Delay between batches to allow memory recovery
    if (i + concurrency < urlsToProcess.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay for memory recovery
    }
  }

  return results;
}

/**
 * Compresses an image file before upload to S3
 * Target: 300KB maximum file size
 * @param file - The image file to compress
 * @returns Compressed File object
 */
export async function compressImageForUpload(file: File): Promise<File> {
  const MAX_FILE_SIZE = 300 * 1024; // 300KB target
  const MAX_DIMENSION = 1200; // Maximum width/height

  try {
    console.log(
      `Starting compression for: ${file.name} (${(file.size / 1024).toFixed(
        2
      )}KB)`
    );

    // Load the image
    const buffer = await file.arrayBuffer();
    const image = await loadImage(Buffer.from(buffer));

    // Calculate resize dimensions
    let width = image.width;
    let height = image.height;

    // Scale down if dimensions are too large
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      const scale = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
      console.log(`Resizing to ${width}x${height}`);
    }

    // Create canvas and draw image
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(image, 0, 0, width, height);

    // Start with 0.8 quality and adjust down if needed to hit target
    let quality = 0.8;
    let compressedBuffer: Buffer;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      compressedBuffer = canvas.toBuffer('image/jpeg', {
        quality,
        progressive: true,
        chromaSubsampling: true,
      });

      const fileSizeKB = compressedBuffer.length;
      console.log(
        `Attempt ${attempts + 1}: Quality ${quality.toFixed(2)}, Size: ${(
          fileSizeKB / 1024
        ).toFixed(2)}KB`
      );

      if (fileSizeKB <= MAX_FILE_SIZE || quality <= 0.1) {
        break;
      }

      // Reduce quality more aggressively if we're far from target
      const ratio = fileSizeKB / MAX_FILE_SIZE;
      if (ratio > 1.5) {
        quality -= 0.15; // Larger reduction if way over
      } else if (ratio > 1.1) {
        quality -= 0.1; // Smaller reduction if close
      } else {
        quality -= 0.05; // Fine adjustment
      }

      quality = Math.max(0.1, quality); // Don't go below 0.1
      attempts++;
    } while (attempts < maxAttempts);

    const finalSizeKB = compressedBuffer.length / 1024;
    const compressionRatio = (
      (1 - compressedBuffer.length / file.size) *
      100
    ).toFixed(1);

    console.log(
      `Compression complete: ${finalSizeKB.toFixed(
        2
      )}KB (${compressionRatio}% reduction, ${attempts} attempts)`
    );

    // Create a new File object with the compressed data
    const compressedFile = new File(
      [new Uint8Array(compressedBuffer)],
      file.name,
      {
        type: 'image/jpeg',
        lastModified: file.lastModified,
      }
    );

    return compressedFile;
  } catch (error) {
    console.error(`Error compressing image: ${file.name}`, error);
    // Return original file if compression fails
    return file;
  }
}
