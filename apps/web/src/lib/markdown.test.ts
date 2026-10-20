import { describe, expect, it } from 'vitest';
import { extractToc, renderMarkdown } from './markdown';

describe('renderMarkdown 安全清洗', () => {
  it('不输出原始 HTML 与脚本标签', async () => {
    const html = await renderMarkdown('<script>alert(1)</script>\n\n正文 **加粗**');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('alert(1)');
    expect(html).toContain('<strong>加粗</strong>');
  });

  it('移除事件处理器与危险协议', async () => {
    const html = await renderMarkdown(
      '<img src="x" onerror="alert(1)">\n\n[危险](javascript:alert(1))\n\n[数据](data:text/html,abc)',
    );
    expect(html).not.toContain('onerror');
    expect(html).not.toContain('javascript:');
    expect(html).not.toContain('data:text/html');
  });

  it('外部链接补全安全属性，站内链接保持不变', async () => {
    const html = await renderMarkdown('[外部](https://example.com)\n\n[站内](/blog)');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toMatch(/href="\/blog"/);
    expect(html).not.toMatch(/href="\/blog"[^>]*target="_blank"/);
  });

  it('代码块输出 Shiki 高亮结果并保留语言类名', async () => {
    const html = await renderMarkdown('```ts\nconst answer: number = 42;\n```');
    expect(html).toContain('class="shiki');
    expect(html).toContain('answer');
  });

  it('GFM 表格可用', async () => {
    const html = await renderMarkdown('| 列 A | 列 B |\n| --- | --- |\n| 1 | 2 |');
    expect(html).toContain('<table>');
    expect(html).toContain('<td>1</td>');
  });
});

describe('extractToc', () => {
  it('只提取 h2/h3 并为重复标题生成唯一锚点', () => {
    const toc = extractToc(
      ['# 标题', '## 同一节', '### 子节', '## 同一节', '#### 忽略'].join('\n\n'),
    );

    expect(toc.map((item) => item.text)).toEqual(['同一节', '子节', '同一节']);
    expect(toc[0]?.id).toBe('同一节');
    expect(toc[2]?.id).toBe('同一节-1');
    expect(toc.every((item) => item.level === 2 || item.level === 3)).toBe(true);
  });

  it('忽略空标题与代码块内的井号', () => {
    const toc = extractToc('##  \n\n```md\n## 代码里的标题\n```');
    expect(toc).toEqual([]);
  });
});
