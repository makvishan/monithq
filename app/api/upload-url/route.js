// /app/api/upload-url/route.js
import { NextResponse } from 'next/server';
import { getSignedUrlForPut } from '@/lib/s3'; // You need to implement this helper for your S3 provider

export async function POST(request) {
  try {
    const { filename, type, folder } = await request.json();
    if (!filename || !type) {
      return NextResponse.json({ error: 'Missing filename or type' }, { status: 400 });
    }
    // Compose key with folder if provided
    const key = folder ? `${folder}/${Date.now()}-${filename}` : `${Date.now()}-${filename}`;
    // Get a signed PUT URL from S3
    const url = await getSignedUrlForPut(key, type);
    return NextResponse.json({ url, key });
  } catch (err) {
    console.error('Error generating S3 upload URL:', err);
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
  }
}
