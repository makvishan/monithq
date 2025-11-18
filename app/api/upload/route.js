import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { requireAuth } from '@/lib/api-middleware';

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION,
  endpoint: process.env.AWS_S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Server-side upload to S3 (no CORS issues)
export async function POST(request) {
  try {
    // Verify authentication
    const user = await requireAuth(request);
    if (user instanceof NextResponse) {
      return user;
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const folder = formData.get('folder') || '';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique key with organization/user ID to prevent conflicts
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueId = `${user.organizationId || user.id}-${Date.now()}`;
    const key = folder
      ? `${folder}/${uniqueId}-${sanitizedFileName}`
      : `${uniqueId}-${sanitizedFileName}`;

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    });

    await s3Client.send(command);

    // Return public URL
    const region = process.env.AWS_S3_REGION || 'ap-south-1';
    const bucket = process.env.AWS_S3_BUCKET;
    const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

    return NextResponse.json({ url, key });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
