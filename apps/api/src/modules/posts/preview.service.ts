import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';

const PREVIEW_TTL_MS = 10 * 60 * 1000;

interface PreviewTokenPayload {
  token: string;
  expiresAt: string;
}

/**
 * 草稿预览令牌：HMAC 签名 + 10 分钟有效期。
 * 只暴露给持有链接的人，不依赖登录态，方便在手机上临时查看。
 */
@Injectable()
export class PreviewService {
  constructor(private readonly config: ConfigService) {}

  create(slug: string): PreviewTokenPayload {
    const expiresAt = Date.now() + PREVIEW_TTL_MS;
    const encodedSlug = Buffer.from(slug, 'utf8').toString('base64url');
    const payload = `${encodedSlug}.${expiresAt}`;
    const signature = this.sign(payload);
    return {
      token: `${payload}.${signature}`,
      expiresAt: new Date(expiresAt).toISOString(),
    };
  }

  verify(token: string, slug: string): void {
    const [encodedSlug, expiresAt, signature] = token.split('.');
    if (!encodedSlug || !expiresAt || !signature) {
      throw new UnauthorizedException('预览链接无效');
    }

    const expected = this.sign(`${encodedSlug}.${expiresAt}`);
    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (
      actualBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(actualBuffer, expectedBuffer)
    ) {
      throw new UnauthorizedException('预览链接无效');
    }

    if (Number(expiresAt) < Date.now()) {
      throw new UnauthorizedException('预览链接已过期，请重新生成');
    }

    const decodedSlug = Buffer.from(encodedSlug, 'base64url').toString('utf8');
    if (decodedSlug !== slug) {
      throw new UnauthorizedException('预览链接与文章不匹配');
    }
  }

  private sign(payload: string): string {
    const secret =
      this.config.get<string>('PREVIEW_SECRET') ??
      this.config.getOrThrow<string>('JWT_ACCESS_SECRET');
    return createHmac('sha256', secret).update(payload).digest('base64url');
  }
}
