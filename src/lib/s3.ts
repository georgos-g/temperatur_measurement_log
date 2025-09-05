import {
  DeleteObjectCommand,
  GetBucketPolicyCommand,
  PutBucketPolicyCommand,
  PutObjectAclCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: 'eu-central-1',
  endpoint: 'https://eu-central-1.linodeobjects.com',
  credentials: {
    accessKeyId: process.env.LINODE_ACCESS_KEY!,
    secretAccessKey: process.env.LINODE_SECRET_KEY!,
  },
  forcePathStyle: true,
});

export async function uploadToLinode(
  file: File,
  fileName: string
): Promise<string> {
  const bucketName =
    process.env.LINODE_BUCKET_NAME || 'temperature-screenshots';

  try {
    // Ensure bucket has public access policy
    await ensureBucketPublicAccess(bucketName);

    // Generate unique filename
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}-${fileName}`;
    const objectKey = `screenshots/${uniqueFileName}`;

    // Convert File to Uint8Array
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      Body: buffer,
      ContentType: file.type,
      ACL: 'public-read',
    });

    await s3Client.send(command);

    // Return the public URL
    const publicUrl = `https://${bucketName}.eu-central-1.linodeobjects.com/${objectKey}`;
    console.log('Screenshot uploaded successfully:', publicUrl);

    return publicUrl;
  } catch (error) {
    console.error('Fehler beim Upload zu Linode:', error);
    throw new Error('Screenshot-Upload fehlgeschlagen');
  }
}

export async function ensureBucketPublicAccess(bucketName: string) {
  try {
    // Check current bucket policy
    try {
      await s3Client.send(new GetBucketPolicyCommand({ Bucket: bucketName }));
      console.log('Bucket policy already exists');
    } catch (error: unknown) {
      // If no policy exists, create one
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (
        errorMessage.includes('NoSuchBucketPolicy') ||
        (error as { name?: string })?.name === 'NoSuchBucketPolicy'
      ) {
        const publicReadPolicy = {
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'PublicReadGetObject',
              Effect: 'Allow',
              Principal: '*',
              Action: 's3:GetObject',
              Resource: `arn:aws:s3:::${bucketName}/*`,
            },
          ],
        };

        await s3Client.send(
          new PutBucketPolicyCommand({
            Bucket: bucketName,
            Policy: JSON.stringify(publicReadPolicy),
          })
        );

        console.log('Bucket policy set to allow public read access');
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error setting bucket policy:', error);
    // Don't throw here as individual object ACL might still work
  }
}

export async function fixObjectPermissions(
  bucketName: string,
  objectKey: string
) {
  try {
    const command = new PutObjectAclCommand({
      Bucket: bucketName,
      Key: objectKey,
      ACL: 'public-read',
    });

    await s3Client.send(command);
    console.log(`Fixed permissions for ${objectKey}`);
    return true;
  } catch (error) {
    console.error(`Error fixing permissions for ${objectKey}:`, error);
    return false;
  }
}

export async function deleteFromLinode(objectKey: string): Promise<boolean> {
  const bucketName = process.env.LINODE_BUCKET_NAME || 'temp-log';

  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });

    await s3Client.send(command);
    console.log(`Deleted object: ${objectKey}`);
    return true;
  } catch (error) {
    console.error('Fehler beim Löschen von Linode:', error);
    return false;
  }
}
