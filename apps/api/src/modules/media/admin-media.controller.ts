import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  PayloadTooLargeException,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { MultipartFile } from '@fastify/multipart';
import type { FastifyRequest } from 'fastify';
import { mediaAltSchema, mediaQuerySchema } from '@myself/shared';
import { parseOrThrow } from '../../common/http';
import { CacheControl } from '../../common/cache-control';
import { CsrfGuard } from '../../common/guards/csrf.guard';
import { JwtAuthGuard, type AuthRequest } from '../../common/guards/jwt-auth.guard';
import { MAX_IMAGE_BYTES, MediaService } from './media.service';

type MultipartRequest = FastifyRequest & { file: () => Promise<MultipartFile | undefined> };

@Controller('admin/media')
@UseGuards(JwtAuthGuard, CsrfGuard)
@CacheControl('no-store')
export class AdminMediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  async list(@Query() query: unknown) {
    const input = parseOrThrow(mediaQuerySchema, query);
    return { data: await this.mediaService.list(input.page, input.pageSize, input.q) };
  }

  @Post()
  async upload(
    @Req() req: MultipartRequest & AuthRequest,
    @Query('alt') altQuery?: string,
  ) {
    let file: MultipartFile | undefined;
    try {
      file = await req.file();
    } catch (error) {
      if ((error as { code?: string }).code === 'FST_REQ_FILE_TOO_LARGE') {
        throw new PayloadTooLargeException('图片不能超过 10MB');
      }
      throw new BadRequestException('上传请求格式不正确');
    }

    if (!file) throw new BadRequestException('请选择要上传的图片');

    let buffer: Buffer;
    try {
      buffer = await file.toBuffer();
    } catch (error) {
      if ((error as { code?: string }).code === 'FST_REQ_FILE_TOO_LARGE') {
        throw new PayloadTooLargeException('图片不能超过 10MB');
      }
      throw new BadRequestException('读取上传内容失败');
    }

    if (buffer.length === 0) throw new BadRequestException('上传内容为空');
    if (buffer.length > MAX_IMAGE_BYTES) throw new PayloadTooLargeException('图片不能超过 10MB');

    const alt = typeof altQuery === 'string' ? altQuery.trim().slice(0, 200) || null : null;
    const createdBy = req.user ? BigInt(req.user.id) : null;

    return { data: await this.mediaService.upload(buffer, alt, createdBy) };
  }

  @Patch(':id')
  async updateAlt(@Param('id') id: string, @Body() body: unknown) {
    const input = parseOrThrow(mediaAltSchema, body);
    return { data: await this.mediaService.updateAlt(BigInt(id), input.alt ?? null) };
  }

  @Delete(':id')
  @HttpCode(200)
  async remove(@Param('id') id: string) {
    return { data: await this.mediaService.remove(BigInt(id)) };
  }
}
