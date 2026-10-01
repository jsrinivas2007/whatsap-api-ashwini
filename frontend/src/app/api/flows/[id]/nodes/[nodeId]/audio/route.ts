import { NextResponse } from 'next/server';

export async function POST(request: Request, props: { params: Promise<{ id: string; nodeId: string }> }) {
  try {
    const params = await props.params;
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // In a real implementation, you would validate file type (AAC, AMR, MP3, M4A, or OGG, max 16MB)
    // and upload this to Supabase Storage or an S3 bucket.
    // For now, return a mock URL.
    const mockUrl = `https://example.com/mock-audio-${Date.now()}.mp3`;

    return NextResponse.json({ audio_url: mockUrl });
  } catch (err) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
