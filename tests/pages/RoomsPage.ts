import type { Locator, Page } from '@playwright/test';

export class RoomsPage {
  readonly listing: Locator;
  readonly heather: Locator;
  readonly thistle: Locator;
  readonly rowan: Locator;
  readonly heatherBookingForm: Locator;
  readonly heatherConfirmation: Locator;

  constructor(private readonly page: Page) {
    this.listing = page.getByRole('region', { name: 'Our rooms', exact: true });
    this.heather = this.listing.getByRole('article', { name: 'Heather', exact: true });
    this.thistle = this.listing.getByRole('article', { name: 'Thistle', exact: true });
    this.rowan = this.listing.getByRole('article', { name: 'Rowan', exact: true });
    this.heatherBookingForm = this.heather.getByRole('form', { name: 'Book Heather', exact: true });
    this.heatherConfirmation = this.heatherBookingForm.getByRole('status');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  async bookHeather(arrival: string, departure: string): Promise<void> {
    await this.heatherBookingForm.getByLabel('Arrival', { exact: true }).fill(arrival);
    await this.heatherBookingForm.getByLabel('Departure', { exact: true }).fill(departure);
    await this.heatherBookingForm.getByRole('button', { name: 'Reserve Heather', exact: true }).click();
  }
}
