import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { postInputSchema, restoreRevisionSchema } from '@myself/shared';
import { parseOrThrow } from '../../common/http';
import { CsrfGuard } from '../../common/guards/csrf.guard';
import { JwtAuthGuard, type AuthRequest } from '../../common/guards/jwt-auth.guard';
import { PostsService } from './posts.service';
import { PreviewService } from './preview.service';
import { CacheControl } from '../../common/cache-control';

@Controller('admin/posts')
@UseGuards(JwtAuthGuard, CsrfGuard)
@CacheControl('no-store')
export class AdminPostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly previewService: PreviewService,
  ) {}

  @Get()
  async list() {
    return { data: await this.postsService.adminList() };
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    return { data: await this.postsService.adminGet(BigInt(id)) };
  }

  @Get(':id/revisions')
  async revisions(@Param('id') id: string) {
    return { data: await this.postsService.revisions(BigInt(id)) };
  }

  @Post()
  async create(@Body() body: unknown, @Req() req: AuthRequest) {
    const input = parseOrThrow(postInputSchema, body);
    const authorId = BigInt(req.user?.id ?? '0');
    return { data: await this.postsService.create(input, authorId) };
  }

  @Post(':id/preview')
  @HttpCode(200)
  async preview(@Param('id') id: string) {
    const post = await this.postsService.adminGet(BigInt(id));
    return { data: this.previewService.create(post.slug) };
  }

  @Post(':id/restore')
  @HttpCode(200)
  async restore(@Param('id') id: string, @Body() body: unknown) {
    const input = parseOrThrow(restoreRevisionSchema, body);
    return { data: await this.postsService.restore(BigInt(id), BigInt(input.revisionId)) };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: unknown) {
    const input = parseOrThrow(postInputSchema, body);
    return { data: await this.postsService.update(BigInt(id), input) };
  }

  @Delete(':id')
  @HttpCode(200)
  async remove(@Param('id') id: string) {
    return { data: await this.postsService.remove(BigInt(id)) };
  }
}
