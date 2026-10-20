import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { FastifyReply } from 'fastify';

const TITLES: Record<number, string> = {
  400: '请求参数不正确',
  401: '未登录或登录已过期',
  403: '没有权限执行该操作',
  404: '资源不存在',
  409: '资源冲突',
  422: '业务校验未通过',
  429: '请求过于频繁',
  500: '服务器内部错误',
};

/** 把异常统一转换为 RFC 7807 problem+json，且不向外暴露堆栈与 SQL。 */
@Catch()
export class ProblemFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const reply = host.switchToHttp().getResponse<FastifyReply>();
    // 错误响应不缓存，避免 CDN 把 4xx/5xx 固定下来。
    reply.header('Cache-Control', 'no-store');

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      const detail =
        typeof response === 'string'
          ? response
          : typeof response === 'object' && response !== null && 'message' in response
            ? String((response as { message: unknown }).message)
            : undefined;

      void reply
        .status(status)
        .type('application/problem+json')
        .send({
          type: 'about:blank',
          title: TITLES[status] ?? '请求失败',
          status,
          detail,
        });
      return;
    }

    this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    void reply
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .type('application/problem+json')
      .send({
        type: 'about:blank',
        title: TITLES[500],
        status: 500,
      });
  }
}
