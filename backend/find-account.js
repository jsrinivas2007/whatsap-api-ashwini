import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fpatgvlzsekrurbtavbk.supabase.co';
const supabaseKey = 'sb_publishable_1ohljUcHLvPSTQjYt6A4TQ_2lX4RAa2';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('contacts').select('account_id').limit(1);
  console.log(JSON.stringify(data, null, 2));
  console.log('Error:', error);
}

test();
