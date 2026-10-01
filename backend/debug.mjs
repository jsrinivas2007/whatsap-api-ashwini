import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fpatgvlzsekrurbtavbk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_1ohljUcHLvPSTQjYt6A4TQ_2lX4RAa2';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
  console.log("Checking public.users...");
  const { data: users, error: usersErr } = await supabase.from('users').select('*');
  console.log("Users:", users, "Error:", usersErr);

  console.log("Checking public.accounts...");
  const { data: accounts, error: accErr } = await supabase.from('accounts').select('*');
  console.log("Accounts:", accounts, "Error:", accErr);
}

check();
