import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { projectInputSchema } from '@myself/shared';
import { parseOrThrow } from '../../common/http';
import { CsrfGuard } from '../../common/guards/csrf.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ProjectsService } from './projects.service';
import { CacheControl } from '../../common/cache-control';

@Controller('admin/projects')
@UseGuards(JwtAuthGuard, CsrfGuard)
@CacheControl('no-store')
export class AdminProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  async list() {
    return { data: await this.projectsService.adminList() };
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    return { data: await this.projectsService.adminGet(BigInt(id)) };
  }

  @Post()
  async create(@Body() body: unknown) {
    const input = parseOrThrow(projectInputSchema, body);
    return { data: await this.projectsService.create(input) };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: unknown) {
    const input = parseOrThrow(projectInputSchema, body);
    return { data: await this.projectsService.update(BigInt(id), input) };
  }

  @Delete(':id')
  @HttpCode(200)
  async remove(@Param('id') id: string) {
    return { data: await this.projectsService.remove(BigInt(id)) };
  }
}
