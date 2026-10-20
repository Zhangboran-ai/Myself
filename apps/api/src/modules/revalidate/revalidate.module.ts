import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminRevalidateController } from './admin-revalidate.controller';

@Module({
  imports: [AuthModule],
  controllers: [AdminRevalidateController],
})
export class RevalidateModule {}
