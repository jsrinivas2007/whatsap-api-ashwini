import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcrypt';
import * as readline from 'readline';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> => new Promise(resolve => rl.question(query, resolve));

async function createAdmin() {
  console.log('--- Create Super Admin ---');
  const email = await question('Admin Email: ');
  const password = await question('Admin Password: ');
  
  if (!email || !password) {
    console.error('Email and password are required');
    rl.close();
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from('admin_user')
    .insert({
      email,
      password_hash: passwordHash
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating admin user:', error.message);
  } else {
    console.log('Admin user created successfully:', data.id);
  }

  rl.close();
}

createAdmin();
