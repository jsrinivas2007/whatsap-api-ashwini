import { Controller, Post, Body, Get, UseGuards, Req, Res, Param, HttpCode } from '@nestjs/common';
import { AdminService } from './admin.service.js';
import { AdminAuthGuard } from './guards/admin-auth.guard.js';

@Controller('internal-ops/api')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: any, @Req() req: any, @Res({ passthrough: true }) res: any) {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';
    
    const result = await this.adminService.login(body.email, body.password, ip, userAgent);
    
    // Set cookie
    res.cookie('admin_session', result.sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 1000 // 1 hour
    });

    return { user: result.user };
  }

  @Post('logout')
  @UseGuards(AdminAuthGuard)
  @HttpCode(200)
  async logout(@Req() req: any, @Res({ passthrough: true }) res: any) {
    const ip = req.ip || req.connection.remoteAddress;
    await this.adminService.logout(req.adminSessionId, req.admin.id, ip);
    res.clearCookie('admin_session');
    return { success: true };
  }

  @Get('overview')
  @UseGuards(AdminAuthGuard)
  async getOverview(@Req() req: any) {
    const ip = req.ip || req.connection.remoteAddress;
    const overview = await this.adminService.getOverview(req.admin.id, ip);
    return { ...overview, user: req.admin };
  }

  @Get('accounts')
  @UseGuards(AdminAuthGuard)
  async getAccounts(@Req() req: any) {
    const ip = req.ip || req.connection.remoteAddress;
    return this.adminService.getAccounts(req.admin.id, ip);
  }

  @Get('accounts/:id')
  @UseGuards(AdminAuthGuard)
  async getAccountDetail(@Param('id') id: string, @Req() req: any) {
    const ip = req.ip || req.connection.remoteAddress;
    return this.adminService.getAccountDetail(req.admin.id, ip, id);
  }

  @Post('accounts/:id/extend-trial')
  @UseGuards(AdminAuthGuard)
  async extendTrial(@Param('id') id: string, @Body('days') days: number, @Req() req: any) {
    const ip = req.ip || req.connection.remoteAddress;
    return this.adminService.extendTrial(req.admin.id, ip, id, days || 7);
  }

  @Get('audit-log')
  @UseGuards(AdminAuthGuard)
  async getAuditLog(@Req() req: any) {
    const client = (this.adminService as any).supabaseService.getClient();
    const { data } = await client.from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(50);
    return data || [];
  }
}
