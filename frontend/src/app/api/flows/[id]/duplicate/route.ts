import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    // 1. Fetch original
    const { data: original, error: fetchError } = await supabase
      .from('automation_flows')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !original) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // 2. Insert copy
    const { data: copy, error: insertError } = await supabase
      .from('automation_flows')
      .insert([
        {
          account_id: original.account_id,
          name: original.name + ' (copy)',
          trigger_type: original.trigger_type,
          trigger_config: original.trigger_config,
          flow_definition: original.flow_definition,
          status: 'inactive',
          trigger_count: 0
        }
      ])
      .select();

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
    return NextResponse.json(copy?.[0], { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
