import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient<any, "public", any>;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || 'placeholder-service-key';

    this.supabase = createClient<any, "public", any>(supabaseUrl, supabaseKey);
  }

  getClient(): SupabaseClient<any, "public", any> {
    return this.supabase;
  }
}

