import { expect, test } from '@playwright/test';

test.describe('移动端与无障碍', () => {
  test('375px 下无横向滚动，抽屉可 Esc 关闭', async ({ page, isMobile }) => {
    test.skip(!isMobile, '仅在移动端视口运行');

    await page.goto('/');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);

    const menuButton = page.getByRole('button', { name: '打开导航菜单' });
    await menuButton.click();

    const dialog = page.getByRole('dialog', { name: '导航菜单' });
    await expect(dialog).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(menuButton).toBeFocused();
  });

  test('键盘可以跳到主内容', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: '跳到主要内容' });
    await expect(skipLink).toBeFocused();
    await skipLink.press('Enter');
    await expect(page).toHaveURL(/#main$/);
  });

  test('页面只有一个 h1', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveCount(1);
  });
});
