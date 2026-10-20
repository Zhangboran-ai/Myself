import { Controller, Get, UseGuards } from '@nestjs/common';
import { CsrfGuard } from '../../common/guards/csrf.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StatsService } from './stats.service';
import { CacheControl } from '../../common/cache-control';

@Controller('admin')
@UseGuards(JwtAuthGuard, CsrfGuard)
@CacheControl('no-store')
export class AdminStatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('stats/overview')
  async overview() {
    return { data: await this.statsService.overview() };
  }
}
