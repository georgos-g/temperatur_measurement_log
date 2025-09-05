import { generateTemperaturePDF } from '@/lib/pdf';
import { NextRequest, NextResponse } from 'next/server';

// Import the temperature records from the temperature API
// In a real app, this would come from a database
let temperatureRecords: Array<{
  id: string;
  temperature: number;
  date: string;
  time: string;
  screenshotUrl?: string;
}> = [];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Fetch current records directly from database to get full TemperatureRecord objects
    const { getAllTemperatureRecords } = await import('@/lib/db');
    const records = await getAllTemperatureRecords();
    temperatureRecords = records.map((record) => ({
      id: record.id,
      temperature: record.temperature,
      date: record.date,
      time: record.time,
      screenshotUrl: record.screenshotUrl,
    }));

    // Filter records by date range if provided
    let filteredRecords = temperatureRecords;

    if (startDate && endDate) {
      filteredRecords = temperatureRecords.filter((record) => {
        const recordDate = new Date(record.date.split('.').reverse().join('-'));
        const start = new Date(startDate);
        const end = new Date(endDate);
        return recordDate >= start && recordDate <= end;
      });
    }

    if (filteredRecords.length === 0) {
      return NextResponse.json(
        {
          error:
            'Keine Temperaturaufzeichnungen für den angegebenen Zeitraum gefunden',
        },
        { status: 404 }
      );
    }

    // Generate PDF
    const pdfBuffer = generateTemperaturePDF(filteredRecords);

    // Return PDF as response
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="temperature-log-${
          new Date().toISOString().split('T')[0]
        }.pdf"`,
      },
    });
  } catch (error) {
    console.error('Fehler beim Erstellen der PDF:', error);
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der PDF' },
      { status: 500 }
    );
  }
}
