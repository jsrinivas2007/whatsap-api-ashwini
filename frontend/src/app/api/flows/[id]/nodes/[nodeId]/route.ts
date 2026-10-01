import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function PATCH(request: Request, props: { params: Promise<{ id: string; nodeId: string }> }) {
  try {
    const params = await props.params;
    const body = await request.json();
    const updates: Record<string, any> = {};

    if (body.config !== undefined) {
      const config = body.config;
      
      // Fetch the current node to know its type
      const { data: currentNode } = await supabase
        .from('flow_nodes')
        .select('type, flow_id')
        .eq('id', params.nodeId)
        .single();
        
      if (currentNode) {
        const type = currentNode.type;
        
        // save_attribute validation
        if (type === 'save_attribute') {
          if (!config.attribute_id) {
            return NextResponse.json({ error: 'attribute_id is required' }, { status: 400 });
          }
          if (config.value === undefined || config.value === null) {
            return NextResponse.json({ error: 'value is required' }, { status: 400 });
          }
          
          if (typeof config.value === 'string' && config.value.includes('{{')) {
            // Check if there is an ask_question node in the flow
            const { data: qNodes } = await supabase
              .from('flow_nodes')
              .select('id')
              .eq('flow_id', currentNode.flow_id)
              .eq('type', 'ask_question')
              .limit(1);
              
            if (!qNodes || qNodes.length === 0) {
              return NextResponse.json({ error: 'Cannot use {{}} reference without an Ask a Question node in the flow' }, { status: 400 });
            }
          }
        }
        
        // add_tag validation
        if (type === 'add_tag') {
          if (!config.tag_id) {
            return NextResponse.json({ error: 'tag_id is required' }, { status: 400 });
          }
        }
        
        // time_delay validation
        if (type === 'time_delay') {
          if (config.mode === 'specific_time') {
            if (!config.specific_datetime) {
              return NextResponse.json({ error: 'specific_datetime is required for specific_time mode' }, { status: 400 });
            }
            const dt = new Date(config.specific_datetime);
            if (isNaN(dt.getTime())) {
              return NextResponse.json({ error: 'Invalid datetime format' }, { status: 400 });
            }
            if (dt.getTime() < Date.now()) {
              // Flagging as likely configuration mistake (could be 400 or just a warning, let's return 400 for strictness as requested)
              return NextResponse.json({ error: 'Specific time is in the past, likely a configuration mistake' }, { status: 400 });
            }
          }
        }
        
        // condition validation
        if (type === 'condition') {
          if (!config.conditions || config.conditions.length === 0) {
            return NextResponse.json({ error: 'At least one condition row is required' }, { status: 400 });
          }
          for (const c of config.conditions) {
            if (!c.attribute_id) {
              return NextResponse.json({ error: 'attribute_id is required for all condition rows' }, { status: 400 });
            }
            if (!c.operator) {
              return NextResponse.json({ error: 'operator is required for all condition rows' }, { status: 400 });
            }
            if (c.operator !== 'is_empty' && c.operator !== 'is_not_empty') {
              if (c.value === undefined || c.value === null || c.value === '') {
                return NextResponse.json({ error: 'value is required for the selected operator' }, { status: 400 });
              }
            }
          }
        }
      }

      updates.config = config;
    }
    if (body.position_x !== undefined) updates.position_x = body.position_x;
    if (body.position_y !== undefined) updates.position_y = body.position_y;

    const { data, error } = await supabase
      .from('flow_nodes')
      .update(updates)
      .eq('id', params.nodeId)
      .eq('flow_id', params.id)
      .select();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data?.[0]);
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string; nodeId: string }> }) {
  try {
    const params = await props.params;
    const { error } = await supabase
      .from('flow_nodes')
      .delete()
      .eq('id', params.nodeId)
      .eq('flow_id', params.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
