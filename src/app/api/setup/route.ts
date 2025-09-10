import { createTableIfNotExists } from '@/lib/db';
import { ensureBucketPublicAccess } from '@/lib/s3';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Setup database
    await createTableIfNotExists();

    // Setup Linode bucket for public access
    const bucketName = process.env.LINODE_BUCKET_NAME || 'temp-log-img';
    await ensureBucketPublicAccess(bucketName);

    return NextResponse.json({
      success: true,
      message: 'Database and bucket setup completed successfully',
    });
  } catch (error) {
    console.error('Error setting up services:', error);
    return NextResponse.json(
      { error: 'Failed to setup services' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Setup database
    await createTableIfNotExists();

    // Setup Linode bucket for public access
    const bucketName = process.env.LINODE_BUCKET_NAME || 'temp-log-img';
    await ensureBucketPublicAccess(bucketName);

    return NextResponse.json({
      success: true,
      message: 'Database and bucket setup verified successfully',
    });
  } catch (error) {
    console.error('Error verifying setup:', error);
    return NextResponse.json(
      { error: 'Setup verification failed' },
      { status: 500 }
    );
  }
}
