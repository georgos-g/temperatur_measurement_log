import { createOrGetUser, createTableIfNotExists } from '@/lib/db';
import { userSchema } from '@/types/user';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = userSchema.parse(body);
    const { name, email } = validatedData;

    // Ensure database tables exist
    await createTableIfNotExists();

    // Create or get user
    const user = await createOrGetUser(name, email);

    // Return user data (without sensitive info)
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    console.error('Login error:', error);

    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: 'Invalid input data' },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
