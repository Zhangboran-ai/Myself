import { Body, Controller, Put, UseGuards } from '@nestjs/common';
import { skillGroupListSchema } from '@myself/shared';
import { parseOrThrow } from '../../common/http';
import { CsrfGuard } from '../../common/guards/csrf.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SkillsService } from './skills.service';
import { CacheControl } from '../../common/cache-control';

@Controller('admin/skills')
@UseGuards(JwtAuthGuard, CsrfGuard)
@CacheControl('no-store')
export class AdminSkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Put()
  async replace(@Body() body: unknown) {
    const groups = parseOrThrow(skillGroupListSchema, body);
    return { data: await this.skillsService.replace(groups) };
  }
}
