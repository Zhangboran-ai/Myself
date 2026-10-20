import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { verify } from '@node-rs/argon2';
import type { User } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../../common/prisma.service';
import { hashIp, sha256 } from '../../common/http';

export interface SessionUser {
  id: string;
  username: string;
  displayName: string;
  role: string;
}

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
}

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;

@Injectable()
export class AuthService {
  /** 登录失败计数，单实例内存即可；多实例部署时替换为 Redis。 */
  private readonly loginAttempts = new Map<string, { count: number; firstAt: number }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(
    username: string,
    password: string,
    meta: { ip?: string; userAgent?: string },
  ): Promise<{ user: SessionUser; tokens: IssuedTokens }> {
    const key = `${username}:${meta.ip ?? 'unknown'}`;
    this.assertNotLocked(key);

    const user = await this.prisma.user.findFirst({
      where: { username, deletedAt: null },
    });

    const valid = user ? await verify(user.passwordHash, password) : false;
    if (!user || !valid) {
      this.recordFailure(key);
      throw new UnauthorizedException('用户名或密码不正确');
    }

    this.loginAttempts.delete(key);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.issueTokens(user, meta);
    return {
      user: this.toSessionUser(user),
      tokens,
    };
  }

  async refresh(
    rawToken: string | undefined,
    meta: { ip?: string; userAgent?: string },
  ): Promise<{ user: SessionUser; tokens: IssuedTokens }> {
    if (!rawToken) throw new UnauthorizedException('缺少刷新令牌');

    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: sha256(rawToken) },
      include: { user: true },
    });

    if (!record || record.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('登录已过期，请重新登录');
    }

    if (record.revokedAt) {
      // 已轮换的令牌被再次使用，视为泄露，吊销该用户所有会话
      await this.prisma.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('登录状态异常，请重新登录');
    }

    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });

    const tokens = await this.issueTokens(record.user, meta);
    return { user: this.toSessionUser(record.user), tokens };
  }

  async logout(rawToken: string | undefined): Promise<void> {
    if (!rawToken) return;
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: sha256(rawToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async me(userId: string): Promise<SessionUser> {
    const user = await this.prisma.user.findFirst({
      where: { id: BigInt(userId), deletedAt: null },
    });
    if (!user) throw new UnauthorizedException('账号不存在');
    return this.toSessionUser(user);
  }

  private async issueTokens(
    user: User,
    meta: { ip?: string; userAgent?: string },
  ): Promise<IssuedTokens> {
    const accessToken = await this.jwt.signAsync(
      { sub: String(user.id), username: user.username, role: user.role },
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.accessTtlSeconds(),
      },
    );

    const refreshToken = randomBytes(32).toString('hex');
    const refreshDays = Number(this.config.get<string>('REFRESH_TOKEN_TTL_DAYS') ?? '7');

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: sha256(refreshToken),
        userAgent: meta.userAgent?.slice(0, 300),
        ipHash: hashIp(meta.ip),
        expiresAt: new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      csrfToken: randomBytes(16).toString('hex'),
    };
  }

  private assertNotLocked(key: string): void {
    const entry = this.loginAttempts.get(key);
    if (!entry) return;
    if (Date.now() - entry.firstAt > LOGIN_WINDOW_MS) {
      this.loginAttempts.delete(key);
      return;
    }
    if (entry.count >= LOGIN_MAX_ATTEMPTS) {
      throw new HttpException('尝试次数过多，请 15 分钟后再试', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private recordFailure(key: string): void {
    const entry = this.loginAttempts.get(key);
    if (!entry || Date.now() - entry.firstAt > LOGIN_WINDOW_MS) {
      this.loginAttempts.set(key, { count: 1, firstAt: Date.now() });
      return;
    }
    entry.count += 1;
  }

  private toSessionUser(user: User): SessionUser {
    return {
      id: String(user.id),
      username: user.username,
      displayName: user.displayName,
      role: user.role,
    };
  }

  /** 把 15m / 2h 这类配置转成秒，避免依赖 jsonwebtoken 的字符串类型。 */
  private accessTtlSeconds(): number {
    const raw = this.config.get<string>('ACCESS_TOKEN_TTL') ?? '15m';
    const match = /^(\d+)([smhd])$/.exec(raw);
    if (!match) return 900;
    const value = Number(match[1] ?? '0');
    const unit = match[2] ?? 'm';
    const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
    return value * (multipliers[unit ?? 'm'] ?? 60);
  }
}
