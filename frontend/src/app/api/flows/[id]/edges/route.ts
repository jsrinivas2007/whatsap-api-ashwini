import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { data, error } = await supabase
      .from('flow_edges')
      .select('*')
      .eq('flow_id', params.id)
      .order('created_at', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const body = await request.json();
    const { source_node_id, target_node_id, source_handle } = body;

    if (!source_node_id || !target_node_id) {
      return NextResponse.json({ error: 'source_node_id and target_node_id are required' }, { status: 400 });
    }

    // Enforce single-outgoing-edge-per-handle: delete any existing edge from this handle
    if (source_handle) {
      await supabase
        .from('flow_edges')
        .delete()
        .eq('flow_id', params.id)
        .eq('source_node_id', source_node_id)
        .eq('source_handle', source_handle);
    } else {
      // For edges with no specific handle, remove existing ones from same source with null handle
      await supabase
        .from('flow_edges')
        .delete()
        .eq('flow_id', params.id)
        .eq('source_node_id', source_node_id)
        .is('source_handle', null);
    }

    const { data, error } = await supabase
      .from('flow_edges')
      .insert([{ flow_id: params.id, source_node_id, target_node_id, source_handle: source_handle || null }])
      .select();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data?.[0], { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
