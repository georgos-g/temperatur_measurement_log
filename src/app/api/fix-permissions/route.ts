import { fixObjectPermissions } from '@/lib/s3';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { objectKey } = await request.json();

    if (!objectKey) {
      return NextResponse.json(
        { success: false, message: 'Object key is required' },
        { status: 400 }
      );
    }

    const bucketName = process.env.LINODE_BUCKET_NAME || 'temp-log';
    const success = await fixObjectPermissions(bucketName, objectKey);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Permissions fixed successfully',
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Failed to fix permissions' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fixing permissions:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

