import { renderMarkdown } from '@/lib/markdown';
import { CodeEnhancer } from './CodeEnhancer';

/**
 * 正文渲染唯一入口：Markdown 经过 remark → rehype → sanitize 白名单清洗后
 * 才允许注入 HTML，且不允许原始 HTML 与 MDX。
 */
export async function Markdown({ content }: { content: string }) {
  const html = await renderMarkdown(content);
  return (
    <div className="prose-wrap">
      <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
      <CodeEnhancer />
    </div>
  );
}
