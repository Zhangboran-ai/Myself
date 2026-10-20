import { Module } from '@nestjs/common';
import { RedirectsController } from './redirects.controller';

@Module({ controllers: [RedirectsController] })
export class RedirectsModule {}
