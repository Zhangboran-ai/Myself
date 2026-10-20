import { describe, expect, it } from 'vitest';
import { detectImageType } from './media.service';

/** 只构造文件头，足以验证 magic bytes 判断逻辑。 */
const header = (...bytes: number[]) => Buffer.from(bytes);

describe('detectImageType', () => {
  it('识别 JPEG', () => {
    expect(detectImageType(header(0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10))).toEqual({
      mime: 'image/jpeg',
      ext: 'jpg',
    });
  });

  it('识别 PNG', () => {
    const png = Buffer.concat([
      header(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a),
      Buffer.alloc(4),
    ]);
    expect(detectImageType(png)).toEqual({ mime: 'image/png', ext: 'png' });
  });

  it('识别 WebP', () => {
    const webp = Buffer.concat([
      Buffer.from('RIFF', 'ascii'),
      header(0x00, 0x00, 0x00, 0x00),
      Buffer.from('WEBP', 'ascii'),
    ]);
    expect(detectImageType(webp)).toEqual({ mime: 'image/webp', ext: 'webp' });
  });

  it('识别 AVIF', () => {
    const avif = Buffer.concat([
      header(0x00, 0x00, 0x00, 0x20),
      Buffer.from('ftypavif', 'ascii'),
    ]);
    expect(detectImageType(avif)).toEqual({ mime: 'image/avif', ext: 'avif' });
  });

  it('拒绝 SVG（避免脚本注入）', () => {
    expect(detectImageType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'))).toBeNull();
  });

  it('拒绝 GIF 与普通文本', () => {
    expect(detectImageType(Buffer.from('GIF89a....'))).toBeNull();
    expect(detectImageType(Buffer.from('not an image'))).toBeNull();
  });
});
