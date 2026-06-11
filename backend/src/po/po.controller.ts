import {
  BadRequestException,
  Body,
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
import { PoSubmissionSchema } from './po-submission.schema';
import { PoService } from './po.service';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

function requirePdf(
  file: Express.Multer.File | undefined,
): Express.Multer.File {
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
  return file;
}

@Controller('po')
@UseGuards(JwtAuthGuard)
export class PoController {
  constructor(private readonly poService: PoService) {}

  @Post('extract')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE } }),
  )
  extract(@UploadedFile() file: Express.Multer.File | undefined) {
    return this.poService.extract(requirePdf(file));
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE } }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: CurrentUserPayload,
    @Body('data') data: string | undefined,
  ) {
    const validated = requirePdf(file);

    if (!data) {
      throw new BadRequestException('Missing form data');
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(data);
    } catch {
      throw new BadRequestException('Invalid form data');
    }
    const result = PoSubmissionSchema.safeParse(parsed);
    if (!result.success) {
      throw new BadRequestException(
        `Invalid form data: ${result.error.message}`,
      );
    }

    return this.poService.upload(validated, result.data, user);
  }

  @Get()
  list() {
    return this.poService.list();
  }
}
