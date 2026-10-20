import { describe, expect, it } from 'vitest';
import { demoContent } from './demo-content';

describe('内置示例内容兜底', () => {
  it('文章列表支持分页、标签与关键词筛选', () => {
    const firstPage = demoContent.getPosts({ pageSize: 2 });
    expect(firstPage.items).toHaveLength(2);
    expect(firstPage.meta).toEqual({ page: 1, pageSize: 2, total: 4, totalPages: 2 });

    const tagged = demoContent.getPosts({ tag: 'performance' });
    expect(tagged.meta.total).toBe(1);
    expect(tagged.items.every((post) => post.tags.includes('性能优化'))).toBe(true);

    const searched = demoContent.getPosts({ q: '缓存' });
    expect(searched.items.map((post) => post.slug)).toContain('nextjs-cache-boundaries');
  });

  it('文章详情按发布时间维护上一篇与下一篇', () => {
    const post = demoContent.getPost('nextjs-cache-boundaries');
    expect(post?.prev?.slug).toBe('design-tokens-in-practice');
    expect(post?.next?.slug).toBe('building-dark-starfield');
  });

  it('项目列表支持技术栈筛选与精选筛选', () => {
    const nextjs = demoContent.getProjects({ tech: 'next-js' });
    expect(nextjs.meta.total).toBe(1);
    expect(nextjs.items[0]?.slug).toBe('star-atlas');

    const featured = demoContent.getProjects({ featured: true });
    expect(featured.meta.total).toBe(2);
  });

  it('未知 slug 返回 null，交由调用方转换成 404', () => {
    expect(demoContent.getPost('missing-post')).toBeNull();
    expect(demoContent.getProject('missing-project')).toBeNull();
  });
});
