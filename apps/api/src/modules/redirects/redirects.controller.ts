import { BadRequestException, Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CacheControl } from '../../common/cache-control';

@Controller('redirects')
@CacheControl('public, s-maxage=300, stale-while-revalidate=600')
export class RedirectsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':entityType/:slug')
  async resolve(@Param('entityType') entityType: string, @Param('slug') slug: string) {
    if (entityType !== 'post' && entityType !== 'project') {
      throw new BadRequestException('不支持的实体类型');
    }

    const redirect = await this.prisma.slugRedirect.findUnique({
      where: { entityType_oldSlug: { entityType, oldSlug: slug } },
    });
    if (!redirect) throw new NotFoundException('没有对应的重定向');

    return { data: { newSlug: redirect.newSlug } };
  }
}
