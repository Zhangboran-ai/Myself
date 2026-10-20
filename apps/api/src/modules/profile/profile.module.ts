import { Module } from '@nestjs/common';
import { AdminProfileController } from './admin-profile.controller';
import { ProfileController } from './profile.controller';
import { ExperiencesController } from './experiences.controller';
import { ProfileService } from './profile.service';

@Module({
  controllers: [ProfileController, ExperiencesController, AdminProfileController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
