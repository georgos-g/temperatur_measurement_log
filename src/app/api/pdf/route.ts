import { generateTemperaturePDF } from '@/lib/pdf';
import { currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user from Clerk
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const userName = searchParams.get('userName');

    const email = clerkUser.emailAddresses[0]?.emailAddress || '';
    const name =
      `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() ||
      'User';

    // Map Clerk user to existing Postgres user
    const { getTemperatureRecordsByUserId, createOrGetUser } =
      await import('@/lib/db');
    const dbUser = await createOrGetUser(name, email, 'clerk', clerkUser.id);
    const userId = dbUser.id;

    // Fetch current records for the authenticated user only
    const records = await getTemperatureRecordsByUserId(userId);
    const temperatureRecords = records.map((record) => ({
      id: record.id,
      temperature: record.temperature,
      date: record.date,
      time: record.time,
      location: record.location,
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
        { status: 404 },
      );
    }

    // Generate PDF with user name if provided
    const pdfBuffer = await generateTemperaturePDF(
      filteredRecords,
      userName || undefined,
    );

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
      { status: 500 },
    );
  }
}
