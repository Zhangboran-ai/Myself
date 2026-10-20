import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

export interface AuthUser {
  id: string;
  username: string;
  role: string;
}

export interface AuthRequest {
  method?: string;
  cookies?: Record<string, string | undefined>;
  headers: Record<string, string | string[] | undefined>;
  user?: AuthUser;
}

interface JwtPayload {
  sub: string;
  username: string;
  role: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const bearer = request.headers.authorization;
    const headerToken =
      typeof bearer === 'string' && bearer.startsWith('Bearer ') ? bearer.slice(7) : undefined;
    const token = request.cookies?.at ?? headerToken;

    if (!token) {
      throw new UnauthorizedException('请先登录');
    }

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
      request.user = { id: payload.sub, username: payload.username, role: payload.role };
      return true;
    } catch {
      throw new UnauthorizedException('登录已过期，请重新登录');
    }
  }
}
