import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { AuthRequest } from './jwt-auth.guard';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** 双提交 CSRF 校验：只拦截写操作，请求头必须与 cookie 中的 token 一致。 */
@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    if (request.method && SAFE_METHODS.has(request.method)) return true;

    const cookieToken = request.cookies?.csrf;
    const headerToken = request.headers['x-csrf-token'];

    if (!cookieToken || typeof headerToken !== 'string' || headerToken !== cookieToken) {
      throw new ForbiddenException('CSRF 校验失败，请刷新页面后重试');
    }
    return true;
  }
}
