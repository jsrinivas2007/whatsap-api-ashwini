import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-server';

// GET endpoint for Meta Webhook Verification
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (mode && token) {
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('WEBHOOK_VERIFIED');
      return new NextResponse(challenge, { status: 200 });
    } else {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  return new NextResponse('Bad Request', { status: 400 });
}

// POST endpoint for handling incoming WhatsApp Webhook Events
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    console.log('Incoming Meta Webhook Payload:', JSON.stringify(payload, null, 2));

    // Return 200 OK immediately as required by Meta
    const response = new NextResponse('EVENT_RECEIVED', { status: 200 });

    // Process the event asynchronously
    processWebhookEvent(payload).catch((err) => {
      console.error('Error processing webhook event:', err);
    });

    return response;
  } catch (error) {
    console.error('Error parsing webhook payload:', error);
    return new NextResponse('Bad Request', { status: 400 });
  }
}

async function processWebhookEvent(payload: any) {
  if (payload.object === 'whatsapp_business_account') {
    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        if (change.value && change.value.messages) {
          const metadata = change.value.metadata;
          const phone_number_id = metadata.phone_number_id;

          // Find the account_id associated with this phone_number_id
          const { data: wabaAccount, error: wabaErr } = await supabase
            .from('waba_accounts')
            .select('account_id')
            .eq('phone_number_id', phone_number_id)
            .limit(1)
            .maybeSingle();

          if (wabaErr || !wabaAccount) {
            console.error(`Could not find waba_account for phone_number_id: ${phone_number_id}`);
            continue;
          }

          const accountId = (wabaAccount as any).account_id;

          for (const message of change.value.messages) {
            const contactPhone = message.from; // e.g., '1234567890'
            const messageId = message.id;
            const timestamp = new Date(parseInt(message.timestamp) * 1000).toISOString();
            
            // Extract text or other message types
            let text = '';
            if (message.type === 'text') {
              text = message.text.body;
            } else if (message.type === 'button') {
              text = message.button.text;
            } else if (message.type === 'interactive') {
              text = message.interactive?.button_reply?.title || message.interactive?.list_reply?.title || 'Interactive response';
            } else {
              text = `[${message.type} message]`;
            }

            // Check if message already exists to prevent duplicate processing on retries
            const { data: existingMsg } = await supabase
              .from('messages')
              .select('id')
              .eq('message_id', messageId) // Assuming you have a message_id column or can add it
              .maybeSingle();
              
            if (existingMsg) {
              console.log(`Message ${messageId} already processed. Skipping.`);
              continue;
            }

            // Find or create Contact
            let contactId = null;
            const { data: existingContact } = await supabase
              .from('contacts')
              .select('id')
              .eq('account_id', accountId)
              .eq('whatsapp_number', contactPhone)
              .limit(1)
              .maybeSingle();

            if (existingContact) {
              contactId = (existingContact as any).id;
            } else {
              // Extract contact name from payload if available
              const contactName = change.value.contacts?.find((c: any) => c.wa_id === contactPhone)?.profile?.name || 'Unknown Contact';
              
              const { data: newContact, error: contactErr } = await supabase
                .from('contacts')
                .insert({
                  account_id: accountId,
                  name: contactName,
                  whatsapp_number: contactPhone,
                  country_code: '', // Can be extracted if needed
                  source: 'Chat',
                } as any)
                .select('id')
                .single();

              if (contactErr) {
                console.error('Error creating contact:', contactErr);
                continue;
              }
              contactId = (newContact as any).id;
            }

            // Find or create Conversation
            let conversationId = null;
            const { data: existingConv } = await supabase
              .from('conversations')
              .select('id')
              .eq('account_id', accountId)
              .eq('contact_id', contactId)
              .in('status', ['open', 'new', 'snoozed'])
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (existingConv) {
              conversationId = (existingConv as any).id;
              // Update last_message_at
              await (supabase
                .from('conversations') as any)
                .update({ last_message_at: timestamp })
                .eq('id', conversationId);
            } else {
              const { data: newConv, error: convErr } = await supabase
                .from('conversations')
                .insert({
                  account_id: accountId,
                  contact_id: contactId,
                  status: 'new', // Or 'open' based on preference
                  last_message_at: timestamp
                } as any)
                .select('id')
                .single();

              if (convErr) {
                console.error('Error creating conversation:', convErr);
                continue;
              }
              conversationId = (newConv as any).id;
            }

            // Save the Message
            const { error: msgErr } = await supabase
              .from('messages')
              .insert({
                conversation_id: conversationId,
                direction: 'inbound',
                type: message.type,
                content: { text: text },
                status: 'received',
                message_id: messageId,
                created_at: timestamp // If allowed to insert timestamp
              } as any);

            if (msgErr) {
              console.error('Error saving message:', msgErr);
            } else {
              console.log(`Saved inbound message ${messageId} to conversation ${conversationId}`);
            }
          }
        }
      }
    }
  }
}
