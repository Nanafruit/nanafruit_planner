import { Module } from '@nestjs/common';
import { OcrService } from './ocr.service';
import { PoController } from './po.controller';
import { PoService } from './po.service';
import { SharePointService } from './sharepoint.service';
import { SupabaseService } from './supabase.service';

@Module({
  controllers: [PoController],
  providers: [PoService, SharePointService, SupabaseService, OcrService],
})
export class PoModule {}
