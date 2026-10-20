import {
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { postQuerySchema } from '@myself/shared';
import { parseOrThrow } from '../../common/http';
import { PostsService } from './posts.service';
import { PreviewService } from './preview.service';
import { CacheControl } from '../../common/cache-control';

@Controller('posts')
@CacheControl('public, s-maxage=60, stale-while-revalidate=300')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly previewService: PreviewService,
  ) {}

  @Get()
  async list(@Query() query: Record<string, string>) {
    const parsed = parseOrThrow(postQuerySchema, query);
    return { data: await this.postsService.list(parsed) };
  }

  @Get(':slug')
  async detail(@Param('slug') slug: string) {
    return { data: await this.postsService.detail(slug) };
  }

  @Get(':slug/preview')
  @CacheControl('no-store')
  async preview(@Param('slug') slug: string, @Query('token') token?: string) {
    if (!token) throw new UnauthorizedException('缺少预览令牌');
    this.previewService.verify(token, slug);
    return { data: await this.postsService.preview(slug) };
  }

  @Post(':slug/view')
  @HttpCode(200)
  @CacheControl('no-store')
  async view(@Param('slug') slug: string, @Req() req: FastifyRequest) {
    return { data: await this.postsService.incrementView(slug, req.ip) };
  }
}
