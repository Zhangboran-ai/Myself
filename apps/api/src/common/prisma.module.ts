import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { RevalidateService } from './revalidate.service';

@Global()
@Module({
  providers: [PrismaService, RevalidateService],
  exports: [PrismaService, RevalidateService],
})
export class PrismaModule {}
