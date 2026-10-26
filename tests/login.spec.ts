import { test, expect } from './fixtures.js';
import { LoginPage } from './pages/LoginPage.js';

test('a guest can log in successfully', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();
  await login.login('guest@example.test', 'WeeDemo123!');

  await expect(login.signedInGuest).toHaveText('Signed in as guest@example.test (Guest)');
});
