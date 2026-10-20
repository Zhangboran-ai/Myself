import { Body, Controller, Put, UseGuards } from '@nestjs/common';
import { experienceListSchema, profileInputSchema } from '@myself/shared';
import { parseOrThrow } from '../../common/http';
import { CsrfGuard } from '../../common/guards/csrf.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ProfileService } from './profile.service';
import { CacheControl } from '../../common/cache-control';

@Controller('admin')
@UseGuards(JwtAuthGuard, CsrfGuard)
@CacheControl('no-store')
export class AdminProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Put('profile')
  async updateProfile(@Body() body: unknown) {
    const input = parseOrThrow(profileInputSchema, body);
    return { data: await this.profileService.updateProfile(input) };
  }

  @Put('experiences')
  async replaceExperiences(@Body() body: unknown) {
    const list = parseOrThrow(experienceListSchema, body);
    return { data: await this.profileService.replaceExperiences(list) };
  }
}
