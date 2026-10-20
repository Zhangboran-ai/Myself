import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { createHash } from 'node:crypto';
import { encode as encodeBlurhash } from 'blurhash';
import sharp from 'sharp';
import type { MediaItem } from '@myself/shared';
import { PrismaService } from '../../common/prisma.service';
import { pageMeta } from '../../common/http';

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const VARIANT_WIDTHS = [400, 800, 1600] as const;

interface DetectedImage {
  mime: string;
  ext: string;
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/**
 * 只接受 jpg / png / webp / avif，并通过 magic bytes 判断真实类型，
 * 不信任客户端提供的扩展名与 Content-Type（SVG 一律拒绝）。
 */
export function detectImageType(buffer: Buffer): DetectedImage | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: 'image/jpeg', ext: 'jpg' };
  }
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    return { mime: 'image/png', ext: 'png' };
  }
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return { mime: 'image/webp', ext: 'webp' };
  }
  if (buffer.length >= 12 && buffer.toString('ascii', 4, 8) === 'ftyp') {
    const brand = buffer.toString('ascii', 8, 12);
    if (brand === 'avif' || brand === 'avis' || brand === 'mif1') {
      return { mime: 'image/avif', ext: 'avif' };
    }
  }
  return null;
}

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private client?: S3Client;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async list(page: number, pageSize: number, q?: string): Promise<{
    items: MediaItem[];
    meta: ReturnType<typeof pageMeta>;
  }> {
    const where = q ? { OR: [{ alt: { contains: q } }, { url: { contains: q } }] } : {};
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.media.count({ where }),
      this.prisma.media.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return { items: rows.map((row) => this.toItem(row)), meta: pageMeta(total, page, pageSize) };
  }

  async upload(
    buffer: Buffer,
    alt: string | null,
    createdBy: bigint | null,
  ): Promise<MediaItem> {
    const detected = detectImageType(buffer);
    if (!detected) {
      throw new ConflictException('仅支持 JPG、PNG、WebP、AVIF 图片');
    }

    const stats = await sharp(buffer).metadata().catch(() => null);
    if (!stats || !stats.format || !stats.width || !stats.height) {
      throw new ConflictException('图片解析失败，请换一张图片');
    }

    const checksum = createHash('sha256').update(buffer).digest('hex');
    const existing = await this.prisma.media.findUnique({ where: { checksum } });
    if (existing) return this.toItem(existing);

    const storage = this.storage();
    const now = new Date();
    const yyyy = String(now.getUTCFullYear());
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
    const env = this.config.get<string>('NODE_ENV') ?? 'development';
    const baseKey = `${env}/${yyyy}/${mm}/${checksum.slice(0, 2)}/${checksum}`;
    const originalKey = `${baseKey}.${detected.ext}`;

    const keys: string[] = [originalKey];
    try {
      await storage.client.send(
        new PutObjectCommand({
          Bucket: storage.bucket,
          Key: originalKey,
          Body: buffer,
          ContentType: detected.mime,
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      );

      // 生成 3 档 WebP 变体，宽度小于目标尺寸时不放大。
      for (const width of VARIANT_WIDTHS) {
        if (stats.width <= width) continue;
        const key = `${baseKey}-${width}.webp`;
        const variant = await sharp(buffer)
          .rotate()
          .resize({ width, withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer();
        await storage.client.send(
          new PutObjectCommand({
            Bucket: storage.bucket,
            Key: key,
            Body: variant,
            ContentType: 'image/webp',
            CacheControl: 'public, max-age=31536000, immutable',
          }),
        );
        keys.push(key);
      }
    } catch (error) {
      this.logger.error(`图片上传失败: ${String(error)}`);
      await this.deleteObjects(keys).catch(() => undefined);
      throw new ServiceUnavailableException('图片存储暂时不可用，请稍后重试');
    }

    const blurhash = await this.computeBlurhash(buffer);
    const row = await this.prisma.media.create({
      data: {
        storageKey: originalKey,
        url: `${storage.publicBase}/${originalKey}`,
        mime: detected.mime,
        size: buffer.length,
        width: stats.width,
        height: stats.height,
        blurhash,
        checksum,
        alt,
        createdBy,
      },
    });

    return this.toItem(row);
  }

  async updateAlt(id: bigint, alt: string | null): Promise<MediaItem> {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) throw new NotFoundException('图片不存在');
    const updated = await this.prisma.media.update({ where: { id }, data: { alt } });
    return this.toItem(updated);
  }

  async remove(id: bigint): Promise<{ ok: true }> {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) throw new NotFoundException('图片不存在');

    const [postRefs, projectRefs] = await this.prisma.$transaction([
      this.prisma.post.count({ where: { coverUrl: media.url, deletedAt: null } }),
      this.prisma.project.count({ where: { coverUrl: media.url, deletedAt: null } }),
    ]);
    if (postRefs + projectRefs > 0) {
      throw new ConflictException('该图片仍被文章或项目引用，请先替换封面');
    }

    const baseKey = media.storageKey.replace(/\.[a-z0-9]+$/i, '');
    const keys = [media.storageKey, ...VARIANT_WIDTHS.map((width) => `${baseKey}-${width}.webp`)];
    await this.deleteObjects(keys);

    await this.prisma.media.delete({ where: { id } });
    return { ok: true };
  }

  private storage(): { client: S3Client; bucket: string; publicBase: string } {
    const endpoint = this.config.get<string>('S3_ENDPOINT');
    const bucket = this.config.get<string>('S3_BUCKET');
    const accessKeyId = this.config.get<string>('S3_ACCESS_KEY');
    const secretAccessKey = this.config.get<string>('S3_SECRET_KEY');
    const publicBase = this.config.get<string>('S3_PUBLIC_BASE');

    if (!endpoint || !bucket || !accessKeyId || !secretAccessKey || !publicBase) {
      throw new ServiceUnavailableException('对象存储未配置，暂时无法上传图片');
    }

    if (!this.client) {
      this.client = new S3Client({
        region: this.config.get<string>('S3_REGION') ?? 'auto',
        endpoint,
        forcePathStyle: true,
        credentials: { accessKeyId, secretAccessKey },
      });
    }

    return {
      client: this.client,
      bucket,
      publicBase: publicBase.replace(/\/+$/, ''),
    };
  }

  private async deleteObjects(keys: string[]): Promise<void> {
    const storage = this.storage();
    for (const key of keys) {
      await storage.client.send(new DeleteObjectCommand({ Bucket: storage.bucket, Key: key }));
    }
  }

  private async computeBlurhash(buffer: Buffer): Promise<string | null> {
    try {
      const { data, info } = await sharp(buffer)
        .resize(16, 16, { fit: 'inside' })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      return encodeBlurhash(new Uint8ClampedArray(data), info.width, info.height, 4, 4);
    } catch {
      return null;
    }
  }

  private toItem(row: {
    id: bigint;
    url: string;
    mime: string;
    size: number;
    width: number | null;
    height: number | null;
    alt: string | null;
    blurhash: string | null;
    createdAt: Date;
  }): MediaItem {
    return {
      id: String(row.id),
      url: row.url,
      mime: row.mime,
      size: row.size,
      width: row.width,
      height: row.height,
      alt: row.alt,
      blurhash: row.blurhash,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
