const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config({ path: '.env.local' });

const s3Client = new S3Client({
  region: 'eu-central-1',
  endpoint: 'https://eu-central-1.linodeobjects.com',
  credentials: {
    accessKeyId: process.env.LINODE_ACCESS_KEY,
    secretAccessKey: process.env.LINODE_SECRET_KEY,
  },
  forcePathStyle: true,
});

async function main() {
  try {
    const bucketName = process.env.LINODE_BUCKET_NAME || 'temp-log';
    const objectKey = `screenshots/test-${Date.now()}.txt`;
    console.log('Testing upload to', bucketName, objectKey);

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      Body: Buffer.from('hello world'),
      ContentType: 'text/plain',
      ACL: 'public-read',
    });

    const res = await s3Client.send(command);
    console.log('Upload success!');
  } catch (e) {
    console.error('Upload failed:', e);
  }
}

main();
