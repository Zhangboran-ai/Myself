import { HttpStatus, UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import type { User } from '@prisma/client';
import { verify } from '@node-rs/argon2';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../common/prisma.service';
import { AuthService } from './auth.service';

vi.mock('@node-rs/argon2', () => ({ verify: vi.fn() }));

const user = {
  id: 1n,
  username: 'admin',
  email: 'admin@example.com',
  displayName: '站长',
  role: 'OWNER',
  passwordHash: 'hashed',
  avatarUrl: null,
  lastLoginAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
} as unknown as User;

function createService() {
  const prisma = {
    user: {
      findFirst: vi.fn().mockResolvedValue(user),
      update: vi.fn().mockResolvedValue(user),
    },
    refreshToken: {
      findUnique: vi.fn(),
      create: vi.fn().mockResolvedValue({ id: 1n }),
      update: vi.fn().mockResolvedValue({}),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  } as unknown as PrismaService;

  const jwt = {
    signAsync: vi.fn().mockResolvedValue('access-token'),
  } as unknown as JwtService;

  const config = {
    get: vi.fn((key: string) => {
      const values: Record<string, string> = {
        ACCESS_TOKEN_TTL: '15m',
        REFRESH_TOKEN_TTL_DAYS: '7',
      };
      return values[key];
    }),
    getOrThrow: vi.fn(() => 'test-secret'),
  } as unknown as ConfigService;

  return { service: new AuthService(prisma, jwt, config), prisma, jwt };
}

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('连续失败 5 次后锁定 15 分钟', async () => {
    const { service } = createService();
    vi.mocked(verify).mockResolvedValue(false);

    for (let index = 0; index < 5; index += 1) {
      await expect(
        service.login('admin', 'wrong', { ip: '127.0.0.1' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    }

    await expect(service.login('admin', 'wrong', { ip: '127.0.0.1' })).rejects.toMatchObject({
      status: HttpStatus.TOO_MANY_REQUESTS,
    });
  });

  it('登录成功下发访问/刷新/CSRF 令牌并更新最后登录时间', async () => {
    const { service, prisma } = createService();
    vi.mocked(verify).mockResolvedValue(true);

    const result = await service.login('admin', 'correct', { ip: '127.0.0.1' });

    expect(result.user).toMatchObject({ id: '1', username: 'admin' });
    expect(result.tokens.accessToken).toBe('access-token');
    expect(result.tokens.refreshToken).toMatch(/^[a-f0-9]{64}$/);
    expect(result.tokens.csrfToken).toMatch(/^[a-f0-9]{32}$/);
    expect(prisma.user.update).toHaveBeenCalledOnce();
  });

  it('刷新令牌缺失时拒绝', async () => {
    const { service } = createService();
    await expect(service.refresh(undefined, {})).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('已轮换的刷新令牌重放时吊销该用户全部会话', async () => {
    const { service, prisma } = createService();
    vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue({
      id: 9n,
      userId: 1n,
      revokedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
      user,
    } as never);

    await expect(service.refresh('leaked-token', {})).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: 1n, revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });

  it('过期的刷新令牌被拒绝', async () => {
    const { service, prisma } = createService();
    vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue({
      id: 9n,
      userId: 1n,
      revokedAt: null,
      expiresAt: new Date(Date.now() - 1_000),
      user,
    } as never);

    await expect(service.refresh('expired', {})).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.refreshToken.update).not.toHaveBeenCalled();
  });
});
