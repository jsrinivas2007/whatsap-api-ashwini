import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function DELETE(request: Request, props: { params: Promise<{ id: string; edgeId: string }> }) {
  try {
    const params = await props.params;
    const { error } = await supabase
      .from('flow_edges')
      .delete()
      .eq('id', params.edgeId)
      .eq('flow_id', params.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
