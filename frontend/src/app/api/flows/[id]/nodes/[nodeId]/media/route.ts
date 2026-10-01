import { NextResponse } from 'next/server';

export async function POST(request: Request, props: { params: Promise<{ id: string; nodeId: string }> }) {
  try {
    const params = await props.params;
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // In a real implementation, you would upload this to Supabase Storage or an S3 bucket
    // and validate file type (image/video/document).
    // For now, return a mock URL.
    const mockUrl = `https://example.com/mock-media-${Date.now()}.jpg`;

    return NextResponse.json({ media_url: mockUrl, media_type: 'image' });
  } catch (err) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
