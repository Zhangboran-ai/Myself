import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { loginSchema } from '@myself/shared';
import { parseOrThrow } from '../../common/http';
import { AuthService } from './auth.service';
import { JwtAuthGuard, type AuthRequest } from '../../common/guards/jwt-auth.guard';
import { CacheControl } from '../../common/cache-control';

interface CookieRequest extends FastifyRequest {
  cookies: Record<string, string | undefined>;
}

@Controller('auth')
@CacheControl('no-store')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() body: unknown,
    @Req() req: CookieRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<{ data: unknown }> {
    const input = parseOrThrow(loginSchema, body);
    const { user, tokens } = await this.auth.login(input.username, input.password, {
      ip: req.ip,
      userAgent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined,
    });

    this.writeCookies(reply, tokens.accessToken, tokens.refreshToken, tokens.csrfToken);
    return { data: user };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() req: CookieRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<{ data: unknown }> {
    const { user, tokens } = await this.auth.refresh(req.cookies.rt, {
      ip: req.ip,
      userAgent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined,
    });

    this.writeCookies(reply, tokens.accessToken, tokens.refreshToken, tokens.csrfToken);
    return { data: user };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(
    @Req() req: CookieRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<{ data: { ok: true } }> {
    await this.auth.logout(req.cookies.rt);
    reply.clearCookie('at', { path: '/' });
    reply.clearCookie('rt', { path: '/' });
    reply.clearCookie('csrf', { path: '/' });
    return { data: { ok: true } };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: AuthRequest): Promise<{ data: unknown }> {
    if (!req.user) return { data: null };
    return { data: await this.auth.me(req.user.id) };
  }

  private writeCookies(
    reply: FastifyReply,
    accessToken: string,
    refreshToken: string,
    csrfToken: string,
  ): void {
    const secure = this.config.get<string>('NODE_ENV') === 'production';
    const base = { path: '/', sameSite: 'lax' as const, secure };
    const refreshDays = Number(this.config.get<string>('REFRESH_TOKEN_TTL_DAYS') ?? '7');

    reply.setCookie('at', accessToken, { ...base, httpOnly: true, maxAge: 15 * 60 });
    reply.setCookie('rt', refreshToken, {
      ...base,
      httpOnly: true,
      maxAge: refreshDays * 24 * 60 * 60,
    });
    reply.setCookie('csrf', csrfToken, {
      ...base,
      httpOnly: false,
      maxAge: refreshDays * 24 * 60 * 60,
    });
  }
}
