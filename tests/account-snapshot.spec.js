import { test, expect } from '@playwright/test';

test('Gapviz Account Page Visual Snapshot', async ({ page, isMobile }) => {
  // Give test up to 90 seconds for visual rendering across environments
  test.setTimeout(90000);

  // 1. Force a completely clean session (clear cookies and storage)
  await page.context().clearCookies();
  await page.goto('https://gapviz-react.pages.dev', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear()).catch(() => {});

  // 2. Locate Email field or landing page login button
  const emailInput = page.getByPlaceholder(/email/i)
    .or(page.locator('input[type="email"]'))
    .or(page.locator('input[name*="email" i]'));

  // If email input isn't visible yet, check if there's a landing page "Log In" button
  if (!(await emailInput.isVisible({ timeout: 4000 }).catch(() => false))) {
    const loginNavBtn = page.getByRole('button', { name: /log in|sign in/i })
      .or(page.getByRole('link', { name: /log in|sign in/i }));
    if (await loginNavBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await loginNavBtn.click();
    }
  }

  // 3. Fill Login Credentials if on the login form
  if (await emailInput.isVisible({ timeout: 10000 }).catch(() => false)) {
    await emailInput.fill(process.env.TEST_EMAIL || 'steven_joseph_wilson@hotmail.com');

    const passwordInput = page.getByPlaceholder(/password/i)
      .or(page.locator('input[type="password"]'));
    await passwordInput.fill(process.env.TEST_PASSWORD || 'Claremont1!');

    await page.getByRole('button', { name: /login|sign in|submit/i }).click();
  }

  // 4. Navigate to Account/Settings Page
  // Uses locators found in your page snapshot (Settings icon or #top-avatar)
  const settingsOrAvatar = page.getByRole('generic', { name: 'Settings' })
    .or(page.locator('#top-avatar'))
    .or(page.getByText('Settings', { exact: true }));

  await settingsOrAvatar.waitFor({ state: 'visible', timeout: 20000 });

  // Handle mobile drawer if the settings/avatar button is hidden
  if (isMobile && !(await settingsOrAvatar.isVisible())) {
    const menuBtn = page.getByRole('button', { name: /menu|toggle/i });
    if (await menuBtn.isVisible()) {
      await menuBtn.click();
    }
  }

  await settingsOrAvatar.click();

  // Click 'Account' option if present inside a dropdown/sub-menu
  const accountLink = page.getByText('Account', { exact: true });
  if (await accountLink.isVisible({ timeout: 3000 }).catch(() => false)) {
    await accountLink.click();
  }

  // 5. Wait for account page element or route to be stable
  await page.waitForTimeout(2000); // Brief pause to allow fonts/CSS transitions to complete

  // 6. Perform Visual Snapshot Comparison
  await expect(page).toHaveScreenshot('account-page.png', {
    fullPage: true,
    animations: 'disabled',
    maxDiffPixelRatio: 0.05,
  });
});