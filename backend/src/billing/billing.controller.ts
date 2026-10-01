import { Controller, Get, Post, Body, Headers, BadRequestException, UseGuards } from '@nestjs/common';
import { PlanEnforcementService } from './plan-enforcement.service.js';
import { SupabaseService } from '../supabase/supabase.service.js';

@Controller('api/billing')
export class BillingController {
  constructor(
    private readonly planEnforcementService: PlanEnforcementService,
    private readonly supabaseService: SupabaseService
  ) {}

  private getAccountId(headers: any): string {
    return headers['x-account-id'] || '00000000-0000-0000-0000-000000000000';
  }

  @Get('plans')
  async getPlans() {
    const client = this.supabaseService.getClient();
    const { data: plans } = await client.from('plans').select('*').order('sort_order', { ascending: true });
    return plans;
  }

  @Get('subscription-status')
  async getSubscriptionStatus(@Headers() headers: any) {
    const accountId = this.getAccountId(headers);
    return await this.planEnforcementService.getActiveSubscription(accountId);
  }

  // Placeholder for Razorpay / PhonePe integration
  @Post('create-order')
  async createOrder(@Body() body: any, @Headers() headers: any) {
    // 1. Initialize payment gateway here
    // 2. Return order ID and details to frontend
    return { orderId: 'order_mock_' + Date.now(), amount: body.amount, currency: 'INR' };
  }
}
