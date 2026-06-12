import { Module } from '@nestjs/common';
import { BomController } from './bom.controller';
import { BomService } from './bom.service';
import { BomSupabaseService } from './bom-supabase.service';

@Module({
  controllers: [BomController],
  providers: [BomService, BomSupabaseService],
})
export class BomModule {}
