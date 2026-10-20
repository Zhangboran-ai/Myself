import { BadRequestException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { z, ZodTypeAny } from 'zod';

/**
 * 使用 zod 校验输入，失败时抛出可读的 400 错误。
 * 返回 `z.output` 而非 `z.input`：带 `.default()` 的字段在输出中一定有值。
 */
export function parseOrThrow<S extends ZodTypeAny>(schema: S, data: unknown): z.output<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const detail = result.error.issues
      .map((issue) => `${issue.path.join('.') || '参数'}: ${issue.message}`)
      .join('; ');
    throw new BadRequestException(detail);
  }
  return result.data as z.output<S>;
}

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/** IP 只存哈希，满足日志脱敏要求。 */
export function hashIp(ip: string | undefined): string | null {
  if (!ip) return null;
  return sha256(`ip:${ip}`).slice(0, 64);
}

/** 中文标题无法转 slug 时，用内容哈希生成稳定且合法的 slug。 */
export function slugFromName(name: string, prefix = 'tag'): string {
  const ascii = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (ascii) return ascii.slice(0, 60);
  return `${prefix}-${sha256(name).slice(0, 10)}`;
}

export function pageMeta(total: number, page: number, pageSize: number) {
  return { total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}
