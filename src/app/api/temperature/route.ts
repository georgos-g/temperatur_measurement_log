import {
  createTableIfNotExists,
  getAllTemperatureRecords,
  insertTemperatureRecord,
} from '@/lib/db';
import { uploadToLinode } from '@/lib/s3';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const temperature = parseFloat(formData.get('temperature') as string);
    const date = formData.get('date') as string;
    const time = formData.get('time') as string;
    const screenshot = formData.get('screenshot') as File | null;

    // Validate required fields
    if (!temperature || !date || !time) {
      return NextResponse.json(
        { error: 'Temperatur, Datum und Uhrzeit sind erforderlich' },
        { status: 400 }
      );
    }

    // Validate temperature range
    if (temperature < -50 || temperature > 100) {
      return NextResponse.json(
        { error: 'Temperatur muss zwischen -50°C und 100°C liegen' },
        { status: 400 }
      );
    }

    let screenshotUrl: string | undefined;

    // Upload screenshot if provided
    if (screenshot && screenshot.size > 0) {
      try {
        screenshotUrl = await uploadToLinode(
          screenshot,
          screenshot.name || 'screenshot.jpg'
        );
      } catch (uploadError) {
        console.error('Screenshot-Upload fehlgeschlagen:', uploadError);
        // Continue without screenshot rather than failing the entire request
      }
    }

    // Ensure database table exists
    await createTableIfNotExists();

    // Create temperature record in database
    const record = await insertTemperatureRecord({
      temperature,
      date,
      time,
      screenshotUrl,
    });

    // Also save to localStorage as backup for development
    try {
      const existing =
        typeof localStorage !== 'undefined'
          ? localStorage.getItem('temperature_records')
          : null;
      const records = existing ? JSON.parse(existing) : [];

      const localRecord = {
        id: record.id,
        temperature: record.temperature,
        date: record.date,
        time: record.time,
        screenshotUrl: record.screenshotUrl,
        createdAt: record.createdAt,
      };

      records.unshift(localRecord);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('temperature_records', JSON.stringify(records));
      }
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }

    console.log('Temperaturaufzeichnung gespeichert:', {
      id: record.id,
      temperature: record.temperature,
      date: record.date,
      time: record.time,
      hasScreenshot: !!record.screenshotUrl,
    });

    return NextResponse.json({
      success: true,
      record: {
        id: record.id,
        temperature: record.temperature,
        date: record.date,
        time: record.time,
        screenshotUrl: record.screenshotUrl,
      },
    });
  } catch (error) {
    console.error('Fehler bei der Verarbeitung der Temperaturdaten:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Ensure database table exists
    await createTableIfNotExists();

    // Get all records from database
    const records = await getAllTemperatureRecords();

    return NextResponse.json({
      success: true,
      records: records.map((record) => ({
        id: record.id,
        temperature: record.temperature,
        date: record.date,
        time: record.time,
        screenshotUrl: record.screenshotUrl,
      })),
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Temperaturaufzeichnungen:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
