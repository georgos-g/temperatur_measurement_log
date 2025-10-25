import { runNextAuthMigration } from '@/lib/nextauth-migration';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting NextAuth migration...');
    await runNextAuthMigration();

    return NextResponse.json({
      success: true,
      message: 'NextAuth migration completed successfully',
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
