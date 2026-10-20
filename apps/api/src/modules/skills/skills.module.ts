import { Module } from '@nestjs/common';
import { AdminSkillsController } from './admin-skills.controller';
import { SkillsController } from './skills.controller';
import { SkillsService } from './skills.service';

@Module({
  controllers: [SkillsController, AdminSkillsController],
  providers: [SkillsService],
  exports: [SkillsService],
})
export class SkillsModule {}
