const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../frontend/src');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// 1. API: /api/flows/route.ts
const apiFlowsDir = path.join(srcDir, 'app/api/flows');
ensureDir(apiFlowsDir);
fs.writeFileSync(path.join(apiFlowsDir, 'route.ts'), `import { NextResponse } from 'next/server';
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
`);

// 2. API: /api/flows/[id]/route.ts
const apiFlowsIdDir = path.join(apiFlowsDir, '[id]');
ensureDir(apiFlowsIdDir);
fs.writeFileSync(path.join(apiFlowsIdDir, 'route.ts'), `import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { error } = await supabase
      .from('automation_flows')
      .delete()
      .eq('id', params.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { error, data } = await supabase
      .from('automation_flows')
      .update(body)
      .eq('id', params.id)
      .select();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data?.[0]);
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { data, error } = await supabase
      .from('automation_flows')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
`);

// 3. API: /api/flows/[id]/status/route.ts
const apiFlowsIdStatusDir = path.join(apiFlowsIdDir, 'status');
ensureDir(apiFlowsIdStatusDir);
fs.writeFileSync(path.join(apiFlowsIdStatusDir, 'route.ts'), `import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { status } = await request.json();
    const { data, error } = await supabase
      .from('automation_flows')
      .update({ status })
      .eq('id', params.id)
      .select();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data?.[0]);
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
`);

// 4. API: /api/flows/[id]/duplicate/route.ts
const apiFlowsIdDuplicateDir = path.join(apiFlowsIdDir, 'duplicate');
ensureDir(apiFlowsIdDuplicateDir);
fs.writeFileSync(path.join(apiFlowsIdDuplicateDir, 'route.ts'), `import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    // 1. Fetch original
    const { data: original, error: fetchError } = await supabase
      .from('automation_flows')
      .select('*')
      .eq('id', params.id)
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
`);

// 5. API: /api/flows/[id]/insights/route.ts
const apiFlowsIdInsightsDir = path.join(apiFlowsIdDir, 'insights');
ensureDir(apiFlowsIdInsightsDir);
fs.writeFileSync(path.join(apiFlowsIdInsightsDir, 'route.ts'), `import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // Get count of runs for this flow
    const { count, error } = await supabase
      .from('automation_runs')
      .select('*', { count: 'exact', head: true })
      .eq('flow_id', params.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      total_fires: count || 0,
      completion_rate: 100 // dummy for now
    });
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
`);

console.log("Backend APIs generated!");
