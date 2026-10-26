import type { Locator, Page } from '@playwright/test';

export class BookingsPage {
  readonly heatherBooking: Locator;

  constructor(private readonly page: Page) {
    const listing = page.getByRole('region', { name: 'My bookings', exact: true });
    this.heatherBooking = listing.getByRole('article', { name: /^Heather — / });
  }

  async openFromNavigation(): Promise<void> {
    await this.page.getByRole('navigation', { name: 'Main navigation', exact: true })
      .getByRole('link', { name: 'My bookings', exact: true }).click();
  }
}
