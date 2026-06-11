import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PoModule } from './po/po.module';

@Module({
  // ConfigModule ต้องมาก่อน เพื่อให้ .env ถูกโหลดเข้า process.env
  // ก่อนที่ provider อื่น (JwtStrategy, SupabaseService) จะถูกสร้าง
  imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule, PoModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
