/**
 * 把任意标题转换为 URL slug。
 * 中文没有内置拼音转换，纯中文标题会得到空串，此时调用方应要求用户手填 slug。
 */
export function slugify(input: string): string {
  const normalized = input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['"’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  return normalized.slice(0, 160);
}

const CJK_PATTERN = /[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/g;
const CODE_FENCE_PATTERN = /```[\s\S]*?```/g;
const INLINE_CODE_PATTERN = /`[^`]*`/g;
const MARKDOWN_MARKS_PATTERN = /[#>*_~[\]()!-]/g;

/** 粗略统计正文字数与阅读时长（分钟），中文按 400 字/分钟，英文按 200 词/分钟。 */
export function readingStats(markdown: string): { readingTime: number; wordCount: number } {
  const plain = markdown
    .replace(CODE_FENCE_PATTERN, ' ')
    .replace(INLINE_CODE_PATTERN, ' ')
    .replace(MARKDOWN_MARKS_PATTERN, ' ');

  const cjkCount = (plain.match(CJK_PATTERN) ?? []).length;
  const latinWords = plain
    .replace(CJK_PATTERN, ' ')
    .split(/\s+/)
    .filter((word) => /[a-zA-Z0-9]/.test(word)).length;

  const wordCount = cjkCount + latinWords;
  const readingTime = Math.max(1, Math.ceil(cjkCount / 400 + latinWords / 200));

  return { readingTime, wordCount };
}

/** 从 Markdown 中提取纯文本摘要，用于列表降级或 SEO 兜底。 */
export function excerpt(markdown: string, maxLength = 120): string {
  const plain = markdown
    .replace(CODE_FENCE_PATTERN, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(MARKDOWN_MARKS_PATTERN, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return plain.length > maxLength ? `${plain.slice(0, maxLength)}…` : plain;
}

/** 把字符串或数字安全转换为 number，用于 Prisma BigInt 序列化。 */
export function toNumber(value: bigint | number | string): number {
  return typeof value === 'number' ? value : Number(value);
}
