import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function GET(request: Request) {
  try {
    const { data, error } = await supabase
      .from('automation_flows')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // In a real app we'd get the account_id from auth session.
    // For now we get a mock account_id or use the first one available
    const { data: accounts } = await supabase.from('accounts').select('id').limit(1);
    const account_id = accounts?.[0]?.id;

    if (!account_id) return NextResponse.json({ error: 'No account found' }, { status: 400 });

    const { data, error } = await supabase
      .from('automation_flows')
      .insert([
        {
          account_id,
          name: body.name,
          trigger_type: body.trigger_type || 'not_set',
          status: 'inactive'
        }
      ])
      .select();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data?.[0], { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
