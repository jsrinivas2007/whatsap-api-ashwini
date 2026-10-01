import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';

@Injectable()
export class QuickRepliesService {
  constructor(private readonly supabase: SupabaseService) {}

  async getQuickReplies(accountId: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('quick_replies')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return data;
  }

  async createQuickReply(accountId: string, payload: { title: string; message: string; shortcut?: string }) {
    let shortcut = payload.shortcut ? payload.shortcut.trim().toLowerCase().replace(/\s+/g, '') : null;
    if (shortcut === '') shortcut = null;

    const { data, error } = await this.supabase
      .getClient()
      .from('quick_replies')
      .insert({
        account_id: accountId,
        title: payload.title,
        message: payload.message,
        shortcut: shortcut,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new HttpException('Shortcut already exists', HttpStatus.CONFLICT);
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return data;
  }

  async updateQuickReply(accountId: string, id: string, payload: { title?: string; message?: string; shortcut?: string }) {
    let shortcut: string | null | undefined = payload.shortcut;
    if (typeof shortcut === 'string') {
      shortcut = shortcut.trim().toLowerCase().replace(/\s+/g, '');
      if (shortcut === '') shortcut = null;
    }

    const updateData: any = {};
    if (payload.title !== undefined) updateData.title = payload.title;
    if (payload.message !== undefined) updateData.message = payload.message;
    if (shortcut !== undefined) updateData.shortcut = shortcut;

    const { data, error } = await this.supabase
      .getClient()
      .from('quick_replies')
      .update(updateData)
      .eq('account_id', accountId)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new HttpException('Shortcut already exists', HttpStatus.CONFLICT);
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return data;
  }

  async deleteQuickReply(accountId: string, id: string) {
    const { error } = await this.supabase
      .getClient()
      .from('quick_replies')
      .delete()
      .eq('account_id', accountId)
      .eq('id', id);

    if (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return { success: true };
  }
}
