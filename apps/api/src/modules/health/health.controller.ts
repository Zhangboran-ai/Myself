import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CacheControl } from '../../common/cache-control';

@Controller('health')
@CacheControl('no-store')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException('数据库连接不可用');
    }
    return { data: { status: 'ok', db: 'up', timestamp: new Date().toISOString() } };
  }
}
