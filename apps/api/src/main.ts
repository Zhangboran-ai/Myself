import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import { AppModule } from './app.module';
import { ProblemFilter } from './common/problem.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      trustProxy: true,
      bodyLimit: 12 * 1024 * 1024,
    }),
  );

  const config = app.get(ConfigService);
  const origins = (config.get<string>('WEB_ORIGIN') ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  await app.register(cookie);
  // 图片上传：单文件 10MB；更严格的类型校验在 MediaService 中按 magic bytes 执行。
  await app.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 5 },
  });
  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: origins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'Authorization'],
  });
  app.useGlobalFilters(new ProblemFilter());
  app.enableShutdownHooks();

  const port = Number(config.get<string>('PORT') ?? '4000');
  await app.listen(port, '0.0.0.0');

  Logger.log(`API 已启动：http://localhost:${port}/api/v1`, 'Bootstrap');
}

void bootstrap();
