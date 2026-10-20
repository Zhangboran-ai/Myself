import { Controller, Get } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CacheControl } from '../../common/cache-control';

@Controller('tags')
@CacheControl('public, s-maxage=120, stale-while-revalidate=300')
export class TagsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  async list() {
    return { data: await this.postsService.tags() };
  }
}
