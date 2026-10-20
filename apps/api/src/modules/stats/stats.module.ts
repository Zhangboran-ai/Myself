import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminStatsController } from './admin-stats.controller';
import { StatsService } from './stats.service';

@Module({
  imports: [AuthModule],
  controllers: [AdminStatsController],
  providers: [StatsService],
})
export class StatsModule {}
