import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './common/prisma.module';
import { CacheControlInterceptor } from './common/cache-control.interceptor';
import { AuthModule } from './modules/auth/auth.module';
import { ProfileModule } from './modules/profile/profile.module';
import { SkillsModule } from './modules/skills/skills.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { PostsModule } from './modules/posts/posts.module';
import { ContactModule } from './modules/contact/contact.module';
import { HealthModule } from './modules/health/health.module';
import { RedirectsModule } from './modules/redirects/redirects.module';
import { StatsModule } from './modules/stats/stats.module';
import { RevalidateModule } from './modules/revalidate/revalidate.module';
import { MediaModule } from './modules/media/media.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    PrismaModule,
    AuthModule,
    ProfileModule,
    SkillsModule,
    ProjectsModule,
    PostsModule,
    ContactModule,
    HealthModule,
    RedirectsModule,
    StatsModule,
    RevalidateModule,
    MediaModule,
  ],
  providers: [{ provide: APP_INTERCEPTOR, useClass: CacheControlInterceptor }],
})
export class AppModule {}
