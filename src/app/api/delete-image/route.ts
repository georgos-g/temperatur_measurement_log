import { deleteFromLinode } from '@/lib/s3';
import { auth } from '@clerk/nextjs/server';
import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest) {
  try {
    // Get authenticated user from Clerk
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { recordId } = await request.json();

    if (!recordId) {
      return NextResponse.json(
        { success: false, message: 'Record ID ist erforderlich' },
        { status: 400 }
      );
    }

    // Get the current record and verify ownership
    const { rows } = await sql`
      SELECT screenshot_url, user_id FROM temperature_records
      WHERE id = ${recordId}
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Datensatz nicht gefunden' },
        { status: 404 }
      );
    }

    const record = rows[0];

    // Check if the record belongs to the authenticated user
    if (record.user_id !== userId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Nicht autorisiert, dieses Bild zu löschen',
        },
        { status: 403 }
      );
    }

    if (!record.screenshot_url) {
      return NextResponse.json(
        { success: false, message: 'Kein Screenshot zum Löschen vorhanden' },
        { status: 400 }
      );
    }

    // Extract object key from URL
    const url = new URL(record.screenshot_url);
    const objectKey = url.pathname.substring(1); // Remove leading slash

    // Delete from Linode Object Storage
    const deleteSuccess = await deleteFromLinode(objectKey);

    if (!deleteSuccess) {
      return NextResponse.json(
        {
          success: false,
          message: 'Fehler beim Löschen des Bildes von Linode',
        },
        { status: 500 }
      );
    }

    // Update database record to remove screenshot URL
    await sql`
      UPDATE temperature_records
      SET screenshot_url = NULL
      WHERE id = ${recordId}
    `;

    return NextResponse.json({
      success: true,
      message: 'Screenshot erfolgreich gelöscht',
    });
  } catch (error) {
    console.error('Fehler beim Löschen des Screenshots:', error);
    return NextResponse.json(
      { success: false, message: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
