import { requireAuthentication } from '@/lib/auth';
import { getTemperatureRecordsByUserId } from '@/lib/db';
import { downloadAndResizeImage } from '@/lib/image-processor';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const user = requireAuthentication(request);

    // Fetch user's records
    const records = await getTemperatureRecordsByUserId(user.id);

    // Filter records with screenshots
    const recordsWithImages = records.filter((record) => record.screenshotUrl);

    if (recordsWithImages.length === 0) {
      return NextResponse.json({
        message: 'No records with screenshots found',
        totalRecords: records.length,
        recordsWithImages: 0,
      });
    }

    // Test image processing for each screenshot
    const imageTests = await Promise.all(
      recordsWithImages.map(async (record) => {
        const startTime = Date.now();

        try {
          // Test basic URL accessibility
          const response = await fetch(record.screenshotUrl!, {
            method: 'HEAD',
            headers: {
              'User-Agent': 'Temperature-Debug/1.0',
            },
          });

          const urlAccessible = response.ok;
          const contentType = response.headers.get('content-type');
          const contentLength = response.headers.get('content-length');

          // Test image processing
          const processedImage = await downloadAndResizeImage(
            record.screenshotUrl!,
            { maxWidth: 200, maxHeight: 112, quality: 1.0 }
          );

          const processingTime = Date.now() - startTime;

          return {
            recordId: record.id,
            date: record.date,
            time: record.time,
            temperature: record.temperature,
            location: record.location,
            screenshotUrl: record.screenshotUrl,
            urlAccessible,
            contentType,
            contentLength: contentLength ? parseInt(contentLength) : null,
            processingSuccess: !!processedImage,
            processingTime,
            processedImageSize: processedImage
              ? processedImage.data.length
              : null,
            processedImageDimensions: processedImage
              ? {
                  width: processedImage.width,
                  height: processedImage.height,
                  isRotated: processedImage.isRotated,
                }
              : null,
            error: null,
          };
        } catch (error) {
          const processingTime = Date.now() - startTime;

          return {
            recordId: record.id,
            date: record.date,
            time: record.time,
            temperature: record.temperature,
            location: record.location,
            screenshotUrl: record.screenshotUrl,
            urlAccessible: false,
            contentType: null,
            contentLength: null,
            processingSuccess: false,
            processingTime,
            processedImageSize: null,
            processedImageDimensions: null,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      })
    );

    // Calculate statistics
    const successful = imageTests.filter(
      (test) => test.processingSuccess
    ).length;
    const failed = imageTests.filter((test) => !test.processingSuccess).length;
    const accessible = imageTests.filter((test) => test.urlAccessible).length;
    const inaccessible = imageTests.filter(
      (test) => !test.urlAccessible
    ).length;

    return NextResponse.json({
      summary: {
        totalRecords: records.length,
        recordsWithImages: recordsWithImages.length,
        successfulProcessing: successful,
        failedProcessing: failed,
        accessibleUrls: accessible,
        inaccessibleUrls: inaccessible,
        successRate: `${((successful / recordsWithImages.length) * 100).toFixed(
          1
        )}%`,
      },
      imageTests,
      recommendations: [
        ...(inaccessible > 0
          ? [
              `${inaccessible} images have inaccessible URLs - check Linode bucket permissions`,
            ]
          : []),
        ...(failed > 0
          ? [`${failed} images failed processing - check image format and size`]
          : []),
        ...(successful === recordsWithImages.length
          ? ['All images processed successfully!']
          : []),
      ],
    });
  } catch (error) {
    console.error('Error in debug-images endpoint:', error);
    return NextResponse.json(
      {
        error: 'Debug endpoint failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
