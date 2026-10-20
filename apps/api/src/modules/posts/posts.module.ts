import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PostsController } from './posts.controller';
import { AdminPostsController } from './admin-posts.controller';
import { TagsController } from './tags.controller';
import { PostsService } from './posts.service';
import { PreviewService } from './preview.service';

@Module({
  imports: [AuthModule],
  controllers: [PostsController, AdminPostsController, TagsController],
  providers: [PostsService, PreviewService],
  exports: [PostsService],
})
export class PostsModule {}
