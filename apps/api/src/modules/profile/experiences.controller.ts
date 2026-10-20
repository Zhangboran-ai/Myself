import { Controller, Get } from '@nestjs/common';
import type { Experience } from '@myself/shared';
import { ProfileService } from './profile.service';
import { CacheControl } from '../../common/cache-control';

@Controller('experiences')
@CacheControl('public, s-maxage=300, stale-while-revalidate=600')
export class ExperiencesController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  async list(): Promise<{ data: Experience[] }> {
    return { data: await this.profileService.getExperiences() };
  }
}
