import jsPDF from 'jspdf';
import {
  ImageProcessingOptions,
  ProcessedImage,
  processImagesBatchFast,
} from './image-processor-fast';

type PDFRecord = {
  id: string;
  temperature: number;
  date: string;
  time: string;
  location: string;
  screenshotUrl?: string;
};

export async function generateTemperaturePDF(
  records: PDFRecord[],
  userName?: string
): Promise<Uint8Array> {
  const pdf = new jsPDF();

  // Set font
  pdf.setFont('helvetica');

  // Title
  pdf.setFontSize(20);
  pdf.text('Temperaturmessungsprotokoll', 20, 30);

  // User name if provided
  if (userName) {
    pdf.setFontSize(12);
    pdf.text(`Erstellt von: ${userName}`, 20, 40);
  }

  // Date range
  pdf.setFontSize(12);
  const currentDate = new Date().toLocaleDateString('de-DE');
  pdf.text(`Erstellt am: ${currentDate}`, 20, userName ? 50 : 45);

  // Headers
  pdf.setFontSize(13);
  const headerY = userName ? 70 : 65;
  pdf.text('Datum', 20, headerY);
  pdf.text('Uhrzeit', 50, headerY);
  pdf.text('°C', 80, headerY);
  pdf.text('Standort', 100, headerY);
  pdf.text('Screenshot', 160, headerY);

  // Draw line under headers
  pdf.line(20, headerY + 5, 190, headerY + 5);

  // Process images for records that have screenshot URLs
  const recordsWithImages = records.filter((record) => record.screenshotUrl);
  const imageUrls = recordsWithImages.map((record) => record.screenshotUrl!);

  const imageProcessingOptions: ImageProcessingOptions = {
    maxWidth: 200, // Keep same dimensions for consistency
    maxHeight: 100, // Keep same dimensions for consistency
    // No quality setting - fast processing uses minimal compression
  };

  console.log(`Starting fast processing of ${imageUrls.length} images...`);

  // Process images with fast processing and higher concurrency
  const processedImages = await processImagesBatchFast(
    imageUrls,
    imageProcessingOptions,
    4 // Higher concurrency for speed
  );

  // Create a map of URL to processed image for easy lookup
  const imageMap = new Map<string, ProcessedImage>();
  recordsWithImages.forEach((record, index) => {
    if (processedImages[index]) {
      imageMap.set(record.screenshotUrl!, processedImages[index]);
      console.log(`Fast processed image for record ${record.id}`);
    } else {
      console.warn(
        `Fast processing failed for record ${record.id}: ${record.screenshotUrl}`
      );
    }
  });

  const successCount = imageMap.size;
  console.log(
    `Fast image processing complete: ${successCount}/${imageUrls.length} images processed successfully`
  );

  // Records
  pdf.setFontSize(10);
  let yPosition = userName ? 85 : 80;
  const rowHeight = 35; // Optimized for compact layout with small images

  for (let i = 0; i < records.length; i++) {
    const record = records[i];

    // Check if we need a new page
    if (yPosition + rowHeight > 280) {
      pdf.addPage();
      yPosition = 30;
    }

    // Draw record data
    pdf.text(record.date, 20, yPosition);
    pdf.text(record.time, 50, yPosition);
    pdf.text(record.temperature.toString(), 80, yPosition);
    pdf.text(record.location, 100, yPosition);

    // Handle screenshot
    if (record.screenshotUrl && imageMap.has(record.screenshotUrl)) {
      const processedImage = imageMap.get(record.screenshotUrl);
      if (processedImage) {
        try {
          // Add image to PDF below the Screenshot column on the right side
          // Always display in landscape mode - images are pre-rotated if needed
          pdf.addImage(
            processedImage.data,
            'JPEG',
            150, // x position (below Screenshot column)
            yPosition - 8, // y position (slightly above text for better alignment)
            processedImage.width * 0.3, // Optimized scale for high quality
            processedImage.height * 0.3 // Optimized scale for high quality
          );
        } catch (imageError) {
          console.error(
            `Failed to add image to PDF for record ${record.id}:`,
            imageError
          );
          pdf.text('Bildfehler', 160, yPosition);
        }
      } else {
        console.warn(`No processed image available for record ${record.id}`);
        pdf.text('Verarbeitungsfehler', 160, yPosition);
      }
    } else if (record.screenshotUrl) {
      // Screenshot URL exists but image processing failed
      console.warn(
        `Image processing failed for record ${record.id}: ${record.screenshotUrl}`
      );
      pdf.text('Downloadfehler', 160, yPosition);
    } else {
      // No screenshot - show indicator in screenshot column
      pdf.text('-', 160, yPosition);
    }

    yPosition += rowHeight;
  }

  // Summary - ensure we have enough space
  if (yPosition + 40 > 280) {
    pdf.addPage();
    yPosition = 30;
  }

  pdf.setFontSize(12);
  pdf.text('Zusammenfassung:', 20, yPosition);
  yPosition += 10;

  const temperatures = records.map((r) => r.temperature);
  const avgTemp = temperatures.reduce((a, b) => a + b, 0) / temperatures.length;
  const minTemp = Math.min(...temperatures);
  const maxTemp = Math.max(...temperatures);

  pdf.setFontSize(10);
  pdf.text(`Gesamtanzahl: ${records.length}`, 30, yPosition);
  yPosition += 8;
  pdf.text(`Durchschnittstemperatur: ${avgTemp.toFixed(1)}°C`, 30, yPosition);
  yPosition += 8;
  pdf.text(`Mindesttemperatur: ${minTemp.toFixed(1)}°C`, 30, yPosition);
  yPosition += 8;
  pdf.text(`Höchsttemperatur: ${maxTemp.toFixed(1)}°C`, 30, yPosition);

  return new Uint8Array(pdf.output('arraybuffer'));
}
