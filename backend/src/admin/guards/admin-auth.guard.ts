import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service.js';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const sessionId = request.cookies?.admin_session || request.headers['x-admin-session'];

    if (!sessionId) {
      throw new UnauthorizedException('No admin session found');
    }

    const client = this.supabaseService.getClient();

    // Check if session exists and is not expired
    const { data: session, error } = await client
      .from('admin_session')
      .select('*, admin_user(*)')
      .eq('id', sessionId)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !session) {
      throw new UnauthorizedException('Invalid or expired admin session');
    }

    // Extend session (sliding window) - 60 minutes
    const newExpiresAt = new Date();
    newExpiresAt.setMinutes(newExpiresAt.getMinutes() + 60);
    await client
      .from('admin_session')
      .update({ expires_at: newExpiresAt.toISOString() })
      .eq('id', sessionId);

    // Attach admin user to request
    request.admin = session.admin_user;
    request.adminSessionId = sessionId;

    return true;
  }
}
