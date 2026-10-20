import type { NextConfig } from 'next';

/**
 * 图片白名单：对象存储域名与站点自身域名。
 * 部署时 S3_PUBLIC_BASE 通常与站点同域（经 Caddy /media 反代），
 * 因此把 NEXT_PUBLIC_SITE_URL 的主机也加进来，避免上传后图片 403。
 */
function imageRemotePatterns(): NonNullable<NextConfig['images']>['remotePatterns'] {
  const patterns: NonNullable<NextConfig['images']>['remotePatterns'] = [
    { protocol: 'http', hostname: 'localhost' },
  ];

  for (const host of (process.env.NEXT_IMAGE_HOSTS ?? '').split(',')) {
    const hostname = host.trim();
    if (hostname) patterns.push({ protocol: 'https', hostname });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) {
    try {
      const url = new URL(siteUrl);
      patterns.push({
        protocol: url.protocol === 'http:' ? 'http' : 'https',
        hostname: url.hostname,
      });
    } catch {
      // 配置不合法时忽略，保持构建可用。
    }
  }

  return patterns;
}

const nextConfig: NextConfig = {
  // standalone 输出用于 Docker 部署；Windows 本地构建没有创建符号链接的权限，默认关闭。
  output: process.env.NEXT_OUTPUT_STANDALONE === '1' ? 'standalone' : undefined,
  reactStrictMode: true,
  transpilePackages: ['@myself/shared'],
  images: {
    // 只允许配置过的图片域名，避免把对象存储白名单放宽到所有站点。
    remotePatterns: imageRemotePatterns(),
  },
};

export default nextConfig;
