import { Controller, Get } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CacheControl } from '../../common/cache-control';

@Controller('tech-tags')
@CacheControl('public, s-maxage=120, stale-while-revalidate=300')
export class TechTagsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  async list() {
    return { data: await this.projectsService.techTags() };
  }
}
