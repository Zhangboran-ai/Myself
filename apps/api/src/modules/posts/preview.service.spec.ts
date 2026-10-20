import type { ConfigService } from '@nestjs/config';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PreviewService } from './preview.service';

function createService() {
  const config = {
    get: vi.fn(() => undefined),
    getOrThrow: vi.fn(() => 'preview-test-secret'),
  } as unknown as ConfigService;
  return new PreviewService(config);
}

describe('PreviewService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-20T06:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('签发的令牌可以通过校验', () => {
    const service = createService();
    const { token } = service.create('draft-post');
    expect(() => service.verify(token, 'draft-post')).not.toThrow();
  });

  it('令牌与文章 slug 绑定', () => {
    const service = createService();
    const { token } = service.create('draft-post');
    expect(() => service.verify(token, 'other-post')).toThrow('预览链接与文章不匹配');
  });

  it('篡改签名会被拒绝', () => {
    const service = createService();
    const { token } = service.create('draft-post');
    const tampered = `${token.slice(0, -1)}x`;
    expect(() => service.verify(tampered, 'draft-post')).toThrow('预览链接无效');
  });

  it('10 分钟后过期', () => {
    const service = createService();
    const { token, expiresAt } = service.create('draft-post');
    expect(expiresAt).toBe('2026-10-20T06:10:00.000Z');

    vi.advanceTimersByTime(10 * 60 * 1000 + 1);
    expect(() => service.verify(token, 'draft-post')).toThrow('预览链接已过期');
  });
});
