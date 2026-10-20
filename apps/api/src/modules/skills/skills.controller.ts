import { Controller, Get } from '@nestjs/common';
import type { SkillGroup } from '@myself/shared';
import { SkillsService } from './skills.service';
import { CacheControl } from '../../common/cache-control';

@Controller('skills')
@CacheControl('public, s-maxage=300, stale-while-revalidate=600')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Get()
  async list(): Promise<{ data: SkillGroup[] }> {
    return { data: await this.skillsService.list() };
  }
}
