import { Injectable, UnauthorizedException, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(private supabaseService: SupabaseService) {}

  private async logAudit(adminUserId: string, action: string, ipAddress: string | null, targetAccountId?: string, metadata?: any) {
    const client = this.supabaseService.getClient();
    await client.from('admin_audit_log').insert({
      admin_user_id: adminUserId,
      action,
      ip_address: ipAddress,
      target_account_id: targetAccountId || null,
      metadata: metadata || {}
    });
  }

  private loginAttemptsByIp = new Map<string, { attempts: number; lockUntil: number }>();
  private loginAttemptsByEmail = new Map<string, { attempts: number; lockUntil: number }>();
  
  private checkRateLimit(key: string, map: Map<string, { attempts: number; lockUntil: number }>) {
    const record = map.get(key) || { attempts: 0, lockUntil: 0 };
    if (record.lockUntil > Date.now()) {
      throw new UnauthorizedException(`Account locked due to too many failed attempts. Try again later.`);
    }
    return record;
  }
  
  private recordFailedAttempt(key: string, record: { attempts: number; lockUntil: number }, map: Map<string, { attempts: number; lockUntil: number }>) {
    record.attempts += 1;
    if (record.attempts >= 5) {
      // Exponential backoff: 5 mins, 15 mins, 30 mins...
      const lockoutMins = record.attempts === 5 ? 5 : (record.attempts === 6 ? 15 : 30);
      record.lockUntil = Date.now() + lockoutMins * 60000;
      // Here we would typically send an email alert to the operator
      console.warn(`[SECURITY ALERT] Admin lockout triggered for ${key} until ${new Date(record.lockUntil).toISOString()}`);
    }
    map.set(key, record);
  }
  
  private resetFailedAttempts(key: string, map: Map<string, { attempts: number; lockUntil: number }>) {
    map.delete(key);
  }

  async login(email: string, password: string, ip: string, userAgent: string) {
    const ipRecord = this.checkRateLimit(ip, this.loginAttemptsByIp);
    const emailRecord = this.checkRateLimit(email, this.loginAttemptsByEmail);
    
    const client = this.supabaseService.getClient();
    
    const { data: user, error } = await client
      .from('admin_user')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      this.recordFailedAttempt(ip, ipRecord, this.loginAttemptsByIp);
      this.recordFailedAttempt(email, emailRecord, this.loginAttemptsByEmail);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      this.recordFailedAttempt(ip, ipRecord, this.loginAttemptsByIp);
      this.recordFailedAttempt(email, emailRecord, this.loginAttemptsByEmail);
      throw new UnauthorizedException('Invalid credentials');
    }
    
    this.resetFailedAttempts(ip, this.loginAttemptsByIp);
    this.resetFailedAttempts(email, this.loginAttemptsByEmail);

    // Update last login
    await client
      .from('admin_user')
      .update({ last_login_at: new Date().toISOString(), last_login_ip: ip })
      .eq('id', user.id);

    // Create session (expires in 60 minutes)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 60);

    const { data: session, error: sessionError } = await client
      .from('admin_session')
      .insert({
        admin_user_id: user.id,
        ip_address: ip,
        user_agent: userAgent,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (sessionError || !session) {
      throw new InternalServerErrorException('Could not create admin session');
    }

    await this.logAudit(user.id, 'LOGIN', ip);

    return { sessionId: session.id, user: { email: user.email, id: user.id } };
  }

  async logout(sessionId: string, adminUserId: string, ip: string) {
    const client = this.supabaseService.getClient();
    await client.from('admin_session').delete().eq('id', sessionId);
    await this.logAudit(adminUserId, 'LOGOUT', ip);
    return { success: true };
  }

  async getOverview(adminUserId: string, ip: string) {
    const client = this.supabaseService.getClient();
    
    const { count: totalAccounts } = await client.from('accounts').select('*', { count: 'exact', head: true });
    const { count: activeSubscriptions } = await client.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active');
    const { count: trialingSubscriptions } = await client.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'trialing');

    await this.logAudit(adminUserId, 'VIEW_OVERVIEW', ip);

    return {
      totalAccounts: totalAccounts || 0,
      activeSubscriptions: activeSubscriptions || 0,
      trialingSubscriptions: trialingSubscriptions || 0,
    };
  }

  async getAccounts(adminUserId: string, ip: string) {
    const client = this.supabaseService.getClient();
    
    // Fetch accounts
    const { data: accounts, error: accError } = await client
      .from('accounts')
      .select('id, name, created_at')
      .order('created_at', { ascending: false });

    if (accError) {
       throw new InternalServerErrorException('Error fetching accounts');
    }

    // Fetch subscriptions for these accounts
    const accountIds = accounts?.map(a => a.id) || [];
    const { data: subscriptions } = await client
      .from('subscriptions')
      .select('id, account_id, status, plan_id, trial_ends_at, current_period_end')
      .in('account_id', accountIds);

    // Join manually
    const joined = accounts?.map(acc => {
      return {
        ...acc,
        subscriptions: subscriptions?.filter(s => s.account_id === acc.id) || []
      };
    }) || [];

    await this.logAudit(adminUserId, 'VIEW_ACCOUNTS_LIST', ip);
    return joined;
  }

  async getAccountDetail(adminUserId: string, ip: string, accountId: string) {
    const client = this.supabaseService.getClient();
    
    const { data: account, error } = await client
      .from('accounts')
      .select('id, name, created_at')
      .eq('id', accountId)
      .single();

    if (error || !account) {
       throw new NotFoundException('Account not found');
    }

    // Fetch relations
    const [ { data: users }, { data: subscriptions }, { data: whatsapp_accounts } ] = await Promise.all([
      client.from('users').select('id, email, full_name, role').eq('account_id', accountId),
      client.from('subscriptions').select('id, status, plan_id, trial_ends_at, current_period_end, created_at').eq('account_id', accountId),
      client.from('whatsapp_accounts').select('id, status, waba_id, phone_number_id').eq('account_id', accountId)
    ]);

    await this.logAudit(adminUserId, 'VIEW_ACCOUNT_DETAIL', ip, accountId);
    return {
      ...account,
      users: users || [],
      subscriptions: subscriptions || [],
      whatsapp_accounts: whatsapp_accounts || []
    };
  }

  async extendTrial(adminUserId: string, ip: string, accountId: string, days: number) {
    const client = this.supabaseService.getClient();
    
    const { data: sub } = await client.from('subscriptions').select('*').eq('account_id', accountId).eq('status', 'trialing').single();
    if (!sub) throw new BadRequestException('No active trial found for this account');

    const newEnd = new Date(sub.trial_ends_at);
    newEnd.setDate(newEnd.getDate() + days);

    await client.from('subscriptions').update({ trial_ends_at: newEnd.toISOString() }).eq('id', sub.id);
    await this.logAudit(adminUserId, 'EXTEND_TRIAL', ip, accountId, { days_added: days });
    
    return { success: true };
  }
}
