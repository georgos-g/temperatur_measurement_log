import { authOptions } from '@/lib/auth';
import { createTableIfNotExists, insertTemperatureRecord } from '@/lib/db';
import { uploadToLinode } from '@/lib/s3';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Try to get authenticated user from NextAuth session first
    const session = await getServerSession(authOptions);
    console.log('Session in POST:', session);

    let userId: string;

    if (session?.user?.id) {
      userId = session.user.id;
      console.log('Using NextAuth session, User ID:', userId);
    } else {
      // Fallback to old authentication method for backward compatibility
      const userIdHeader = request.headers.get('x-user-id');
      const userEmailHeader = request.headers.get('x-user-email');

      if (!userIdHeader || !userEmailHeader) {
        console.log('No session or headers found, returning 401');
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      userId = userIdHeader;
      console.log('Using header authentication, User ID:', userId);
    }

    const formData = await request.formData();

    const temperature = parseFloat(formData.get('temperature') as string);
    const date = formData.get('date') as string;
    const time = formData.get('time') as string;
    const location = formData.get('location') as string;
    const screenshot = formData.get('screenshot') as File | null;

    // Validate required fields
    if (!temperature || !date || !time || !location) {
      return NextResponse.json(
        { error: 'Temperatur, Datum, Uhrzeit und Standort sind erforderlich' },
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
    console.log('Database tables ensured');

    // Create temperature record in database
    console.log('Creating temperature record with data:', {
      temperature,
      date,
      time,
      location,
      screenshotUrl,
      userId,
    });

    const record = await insertTemperatureRecord(
      {
        temperature,
        date,
        time,
        location,
        screenshotUrl,
      },
      userId
    );
    console.log('Temperature record created:', record);

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
        location: record.location,
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

    return NextResponse.json({
      success: true,
      record: {
        id: record.id,
        temperature: record.temperature,
        date: record.date,
        time: record.time,
        location: record.location,
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

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user from NextAuth session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Ensure database table exists
    await createTableIfNotExists();

    // Get records for the authenticated user only
    const { getTemperatureRecordsByUserId } = await import('@/lib/db');
    const records = await getTemperatureRecordsByUserId(userId);

    return NextResponse.json({
      success: true,
      records: records.map((record) => ({
        id: record.id,
        temperature: record.temperature,
        date: record.date,
        time: record.time,
        location: record.location,
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
