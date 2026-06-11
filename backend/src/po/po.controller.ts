import {
  BadRequestException,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserPayload } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PoService } from './po.service';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

@Controller('po')
@UseGuards(JwtAuthGuard)
export class PoController {
  constructor(private readonly poService: PoService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE } }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    // เช็ค magic bytes จริง ไม่เชื่อ mimetype ที่ client ส่งมา
    const isPdf = file.buffer
      .subarray(0, 5)
      .toString('latin1')
      .startsWith('%PDF');
    if (!isPdf) {
      throw new BadRequestException('Only PDF files are allowed');
    }
    return this.poService.upload(file, user);
  }

  @Get()
  list() {
    return this.poService.list();
  }
}
