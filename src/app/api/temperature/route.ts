import {
  createOrGetUser,
  createTableIfNotExists,
  insertTemperatureRecord,
} from '@/lib/db';
import { uploadToLinode } from '@/lib/s3';
import { currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user from Clerk
    const clerkUser = await currentUser();

    if (!clerkUser) {
      console.log('No Clerk session found, returning 401');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress || '';
    const name =
      `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() ||
      'User';

    // Map Clerk user to existing Postgres user based on email (or create new if none)
    const dbUser = await createOrGetUser(name, email, 'clerk', clerkUser.id);
    const userId = dbUser.id; // The integer ID from Postgres

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
        { status: 400 },
      );
    }

    // Validate temperature range
    if (temperature < -50 || temperature > 100) {
      return NextResponse.json(
        { error: 'Temperatur muss zwischen -50°C und 100°C liegen' },
        { status: 400 },
      );
    }

    let screenshotUrl: string | undefined;

    // Upload screenshot if provided
    if (screenshot && screenshot.size > 0) {
      // Validate MIME type
      if (!screenshot.type.startsWith('image/')) {
        return NextResponse.json(
          { error: 'Nur Bilder sind als Screenshot erlaubt' },
          { status: 400 },
        );
      }

      // Validate file size (max 5MB)
      const MAX_SIZE_MB = 5;
      if (screenshot.size > MAX_SIZE_MB * 1024 * 1024) {
        return NextResponse.json(
          { error: `Das Bild darf maximal ${MAX_SIZE_MB}MB groß sein` },
          { status: 400 },
        );
      }

      try {
        screenshotUrl = await uploadToLinode(
          screenshot,
          screenshot.name || 'screenshot.jpg',
        );
      } catch (uploadError) {
        console.error('Screenshot-Upload fehlgeschlagen:', uploadError);
        // Continue without screenshot rather than failing the entire request
      }
    }

    // Ensure database table exists
    await createTableIfNotExists();

    const record = await insertTemperatureRecord(
      {
        temperature,
        date,
        time,
        location,
        screenshotUrl,
      },
      userId,
    );

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
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    // Get authenticated user from Clerk
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress || '';
    const name =
      `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() ||
      'User';

    // Ensure database table exists
    await createTableIfNotExists();

    // Map Clerk user to existing Postgres user based on email
    const dbUser = await createOrGetUser(name, email, 'clerk', clerkUser.id);
    const userId = dbUser.id; // Target user_id

    // Get records for the mapped authenticated user
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
      { status: 500 },
    );
  }
}
