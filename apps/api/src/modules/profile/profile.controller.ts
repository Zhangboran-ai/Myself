import { Controller, Get } from '@nestjs/common';
import { ProfileService, type SitePayload } from './profile.service';
import { CacheControl } from '../../common/cache-control';

@Controller('site')
@CacheControl('public, s-maxage=300, stale-while-revalidate=600')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  async getSite(): Promise<{ data: SitePayload }> {
    return { data: await this.profileService.getSite() };
  }
}
