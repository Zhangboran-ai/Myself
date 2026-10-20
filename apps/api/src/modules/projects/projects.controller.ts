import { Controller, Get, Param, Query } from '@nestjs/common';
import { projectQuerySchema } from '@myself/shared';
import { parseOrThrow } from '../../common/http';
import { ProjectsService } from './projects.service';
import { CacheControl } from '../../common/cache-control';

@Controller('projects')
@CacheControl('public, s-maxage=60, stale-while-revalidate=300')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  async list(@Query() query: Record<string, string>) {
    const parsed = parseOrThrow(projectQuerySchema, query);
    return { data: await this.projectsService.list(parsed) };
  }

  @Get(':slug')
  async detail(@Param('slug') slug: string) {
    return { data: await this.projectsService.detail(slug) };
  }
}
