import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProjectsController } from './projects.controller';
import { AdminProjectsController } from './admin-projects.controller';
import { TechTagsController } from './tech-tags.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [AuthModule],
  controllers: [ProjectsController, AdminProjectsController, TechTagsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
