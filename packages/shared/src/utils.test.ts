import { describe, expect, it } from 'vitest';
import { excerpt, readingStats, slugify, toNumber } from './utils';

describe('slugify', () => {
  it('把英文标题转成 kebab-case', () => {
    expect(slugify('Hello, World! 2026')).toBe('hello-world-2026');
  });

  it('折叠多余分隔符并去掉首尾短横线', () => {
    expect(slugify('  --React & Next.js--  ')).toBe('react-next-js');
  });

  it('纯中文标题返回空串，由调用方兜底', () => {
    expect(slugify('我的第一篇文章')).toBe('');
  });

  it('长度不超过 160', () => {
    expect(slugify('a'.repeat(300)).length).toBe(160);
  });
});

describe('readingStats', () => {
  it('至少返回 1 分钟', () => {
    expect(readingStats('短文本').readingTime).toBe(1);
  });

  it('忽略代码块内容', () => {
    const withCode = '正文\n\n```ts\nconst a = 1;\n```';
    const withoutCode = '正文';
    expect(readingStats(withCode).wordCount).toBe(readingStats(withoutCode).wordCount);
  });

  it('统计中英文总词数', () => {
    const stats = readingStats('你好世界 hello world');
    expect(stats.wordCount).toBe(6);
  });
});

describe('excerpt', () => {
  it('去除 Markdown 标记并截断', () => {
    const text = excerpt('## 标题\n\n这是一段**加粗**内容，包含[链接](https://example.com)。', 10);
    expect(text.endsWith('…')).toBe(true);
    expect(text).not.toContain('](http');
  });
});

describe('toNumber', () => {
  it('兼容 bigint 与字符串', () => {
    expect(toNumber(12n)).toBe(12);
    expect(toNumber('42')).toBe(42);
  });
});
