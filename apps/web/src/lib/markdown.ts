import type { TocItem } from '@myself/shared';
import GithubSlugger from 'github-slugger';
import type { Heading, Root as MdastRoot, RootContent } from 'mdast';
import rehypeSanitize, { defaultSchema, type Options as SanitizeOptions } from 'rehype-sanitize';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeShiki from '@shikijs/rehype';
import rehypeExternalLinks from 'rehype-external-links';
import { unified } from 'unified';

/**
 * 白名单：只允许 Markdown 常规结构。
 * 原始 HTML 不会被解析（未启用 rehype-raw），链接协议收紧到 http/https/mailto。
 */
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), ['className', /^language-./]],
    span: [...(defaultSchema.attributes?.span ?? []), ['className']],
    a: [...(defaultSchema.attributes?.a ?? []), 'target', 'rel'],
    img: [...(defaultSchema.attributes?.img ?? []), 'loading', 'decoding'],
  },
  protocols: {
    ...defaultSchema.protocols,
    href: ['http', 'https', 'mailto'],
    src: ['https', 'http'],
  },
} as SanitizeOptions;

export async function renderMarkdown(markdown: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeSanitize, sanitizeSchema)
    .use(rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] })
    .use(rehypeShiki, {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: 'dark',
      lazy: true,
    })
    .use(rehypeStringify)
    .process(markdown);

  return String(file);
}

function nodeText(node: RootContent | Heading): string {
  if (node.type === 'text') return node.value;
  if ('children' in node && Array.isArray(node.children)) {
    return node.children.map((child) => nodeText(child as RootContent)).join('');
  }
  return '';
}

/** 提取 h2/h3 作为目录，slug 与 rehype-slug 使用同一算法。 */
export function extractToc(markdown: string): TocItem[] {
  const slugger = new GithubSlugger();
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown) as MdastRoot;
  const items: TocItem[] = [];

  for (const node of tree.children) {
    if (node.type !== 'heading') continue;
    const heading = node as Heading;
    if (heading.depth < 2 || heading.depth > 3) continue;

    const text = nodeText(heading).trim();
    if (!text) continue;

    items.push({ id: slugger.slug(text), text, level: heading.depth });
  }

  return items;
}
