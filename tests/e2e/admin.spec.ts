import { expect, test } from '@playwright/test';

const username = process.env.E2E_ADMIN_USERNAME ?? 'admin';
const password = process.env.E2E_ADMIN_PASSWORD ?? '';

test.describe('后台发布链路', () => {
  test.skip(!password, '需要设置 E2E_ADMIN_PASSWORD 才能运行后台 E2E');

  test('登录 → 发布文章 → 前台可见 → 删除', async ({ page }) => {
    const slug = `e2e-post-${Date.now()}`;
    const title = `E2E 验证文章 ${slug}`;

    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/login/);

    await page.getByLabel('用户名').fill(username);
    await page.getByLabel('密码').fill(password);
    await page.getByRole('button', { name: '登录' }).click();
    await expect(page).toHaveURL(/\/admin\/posts$/);

    await page.goto('/admin/posts/new');
    await page.locator('#post-title').fill(title);
    await page.locator('#post-slug').fill(slug);
    await page.locator('#post-summary').fill('由 Playwright 自动创建，用于验证发布链路。');
    await page.locator('#post-body').fill('## 自动化测试\n\n这篇文章会在测试结束后被删除。');
    await page.locator('#post-status').selectOption('PUBLISHED');
    await page.getByRole('button', { name: '保存' }).click();

    await expect(page).toHaveURL(/\/admin\/posts$/);
    await expect(page.getByRole('link', { name: title })).toBeVisible();

    // 发布后前台应立即可见（ISR 失效链路）。
    await expect
      .poll(async () => {
        const response = await page.request.get(`/blog/${slug}`);
        return response.status();
      })
      .toBe(200);

    await page.goto(`/blog/${slug}`);
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();

    // 清理：删除后前台不再返回 200。
    page.on('dialog', (dialog) => void dialog.accept());
    await page.goto('/admin/posts');
    await page.getByRole('button', { name: `删除文章 ${title}` }).click();
    await expect(page.getByRole('link', { name: title })).toHaveCount(0);
  });
});
