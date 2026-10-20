import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { pageMeta, parseOrThrow, slugFromName } from './http';

describe('parseOrThrow', () => {
  const schema = z.object({ page: z.coerce.number().int().min(1) });

  it('返回校验后的数据', () => {
    expect(parseOrThrow(schema, { page: '2' })).toEqual({ page: 2 });
  });

  it('校验失败抛出 400 并带上字段路径', () => {
    try {
      parseOrThrow(schema, { page: '0' });
      expect.unreachable('应当抛出异常');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).message).toContain('page');
    }
  });
});

describe('slugFromName', () => {
  it('英文名转小写短横线', () => {
    expect(slugFromName('Next.js App Router')).toBe('next-js-app-router');
  });

  it('中文名生成稳定哈希，且每次一致', () => {
    const first = slugFromName('性能优化', 'tag');
    const second = slugFromName('性能优化', 'tag');
    expect(first).toMatch(/^tag-[a-f0-9]{10}$/);
    expect(first).toBe(second);
  });

  it('不同中文名不会碰撞', () => {
    expect(slugFromName('设计')).not.toBe(slugFromName('工程化'));
  });
});

describe('pageMeta', () => {
  it('计算总页数并保证至少一页', () => {
    expect(pageMeta(21, 1, 10)).toEqual({ total: 21, page: 1, pageSize: 10, totalPages: 3 });
    expect(pageMeta(0, 1, 10).totalPages).toBe(1);
  });
});
