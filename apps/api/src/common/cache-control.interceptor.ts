import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyReply } from 'fastify';
import { Observable } from 'rxjs';
import { CACHE_CONTROL_KEY } from './cache-control';

/** 把 @CacheControl 声明的值写入响应头；未声明时不干预。 */
@Injectable()
export class CacheControlInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const value = this.reflector.getAllAndOverride<string>(CACHE_CONTROL_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (value) {
      context.switchToHttp().getResponse<FastifyReply>().header('Cache-Control', value);
    }

    return next.handle();
  }
}
