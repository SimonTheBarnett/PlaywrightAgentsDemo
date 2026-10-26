import type { Locator, Page } from '@playwright/test';

export class LoginPage {
  readonly email: Locator;
  readonly password: Locator;
  readonly logInButton: Locator;
  readonly signedInGuest: Locator;

  constructor(private readonly page: Page) {
    this.email = page.getByLabel('Email', { exact: true });
    this.password = page.getByLabel('Password', { exact: true });
    this.logInButton = page.getByRole('button', { name: 'Log in', exact: true });
    this.signedInGuest = page.getByRole('banner').getByText(/^Signed in as .* \(Guest\)$/);
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  async login(email: string, password: string): Promise<void> {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.logInButton.click();
  }
}
