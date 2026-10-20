import { expect, test } from '@playwright/test';

test.describe('访客主流程', () => {
  test('首页 → 项目列表 → 项目详情 → 博客 → 文章详情', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await page.goto('/projects');
    const firstProject = page.locator('a[href^="/projects/"]').first();
    await expect(firstProject).toBeVisible();
    await firstProject.click();
    await expect(page).toHaveURL(/\/projects\/[^/]+$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await page.goto('/blog');
    const firstPost = page.locator('a[href^="/blog/"]').first();
    await expect(firstPost).toBeVisible();
    await firstPost.click();
    await expect(page).toHaveURL(/\/blog\/[^/]+$/);
    await expect(page.locator('article')).toBeVisible();
  });

  test('RSS 与 sitemap 可访问', async ({ request }) => {
    const rss = await request.get('/rss.xml');
    expect(rss.status()).toBe(200);
    expect(rss.headers()['content-type']).toContain('xml');

    const sitemap = await request.get('/sitemap.xml');
    expect(sitemap.status()).toBe(200);
  });

  test('404 页面返回正确状态码', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist');
    expect(response?.status()).toBe(404);
  });
});
