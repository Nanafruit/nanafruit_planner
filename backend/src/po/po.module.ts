import { Module } from '@nestjs/common';
import { PoController } from './po.controller';
import { PoService } from './po.service';
import { SharePointService } from './sharepoint.service';
import { SupabaseService } from './supabase.service';

@Module({
  controllers: [PoController],
  providers: [PoService, SharePointService, SupabaseService],
})
export class PoModule {}
