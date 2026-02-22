import { createTableIfNotExists } from '@/lib/db';
import { auth, currentUser } from '@clerk/nextjs/server';
import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

// Get or create database user linked to Clerk user
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get Clerk user details
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json(
        { error: 'Could not fetch user details' },
        { status: 500 }
      );
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress;

    if (!email) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    // Ensure database table exists
    await createTableIfNotExists();

    // First, try to find existing user by email (preserves existing name)
    const existingUser = await sql`
      SELECT id, name, email, created_at
      FROM users
      WHERE email = ${email}
    `;

    if (existingUser.rows.length > 0) {
      // Use the existing database user's name (not Clerk's name)
      const row = existingUser.rows[0];
      return NextResponse.json({
        success: true,
        user: {
          id: row.id.toString(),
          name: row.name, // Use stored name from database
          email: row.email,
          clerkId: userId,
        },
      });
    }

    // Only create new user if not found - use email username as default name
    const defaultName = email.split('@')[0];
    const result = await sql`
      INSERT INTO users (name, email, provider, provider_id)
      VALUES (${defaultName}, ${email}, 'clerk', ${userId})
      RETURNING id, name, email, created_at
    `;

    const row = result.rows[0];
    return NextResponse.json({
      success: true,
      user: {
        id: row.id.toString(),
        name: row.name,
        email: row.email,
        clerkId: userId,
      },
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
