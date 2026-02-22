import { deleteFromLinode } from '@/lib/s3';
import { currentUser } from '@clerk/nextjs/server';
import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest) {
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

    const { createOrGetUser } = await import('@/lib/db');
    const dbUser = await createOrGetUser(name, email, 'clerk', clerkUser.id);
    const dbUserId = dbUser.id;

    const { recordId } = await request.json();

    if (!recordId) {
      return NextResponse.json(
        { success: false, message: 'Record ID ist erforderlich' },
        { status: 400 },
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
        { status: 404 },
      );
    }

    const record = rows[0];

    // Check if the record belongs to the authenticated user
    // The DB stores mapped Postgres integer IDs as strings
    if (record.user_id !== dbUserId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Nicht autorisiert, diesen Datensatz zu löschen',
        },
        { status: 403 },
      );
    }

    // If there's a screenshot, delete it from Linode Object Storage first
    if (record.screenshot_url) {
      // Extract object key from URL
      const url = new URL(record.screenshot_url);
      const objectKey = url.pathname.substring(1); // Remove leading slash

      // Delete from Linode Object Storage
      const deleteSuccess = await deleteFromLinode(objectKey);

      if (!deleteSuccess) {
        console.warn(
          'Failed to delete screenshot from Linode, but proceeding with entry deletion',
        );
      }
    }

    // Delete the entire record from database
    await sql`
      DELETE FROM temperature_records
      WHERE id = ${recordId}
    `;

    return NextResponse.json({
      success: true,
      message: 'Eintrag erfolgreich gelöscht',
    });
  } catch (error) {
    console.error('Fehler beim Löschen des Eintrags:', error);
    return NextResponse.json(
      { success: false, message: 'Interner Serverfehler' },
      { status: 500 },
    );
  }
}
