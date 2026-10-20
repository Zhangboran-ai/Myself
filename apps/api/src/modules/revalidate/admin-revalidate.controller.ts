import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { revalidateInputSchema } from '@myself/shared';
import { parseOrThrow } from '../../common/http';
import { CacheControl } from '../../common/cache-control';
import { CsrfGuard } from '../../common/guards/csrf.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RevalidateService } from '../../common/revalidate.service';

/** 人工兜底：内容已更新但前台仍是旧缓存时，可在这里按 tag 强制失效。 */
@Controller('admin/revalidate')
@UseGuards(JwtAuthGuard, CsrfGuard)
@CacheControl('no-store')
export class AdminRevalidateController {
  constructor(private readonly revalidate: RevalidateService) {}

  @Post()
  @HttpCode(200)
  async trigger(@Body() body: unknown) {
    const input = parseOrThrow(revalidateInputSchema, body);
    return { data: await this.revalidate.trigger(input.tags) };
  }
}
