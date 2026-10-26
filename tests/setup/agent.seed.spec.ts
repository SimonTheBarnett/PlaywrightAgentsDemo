import { test, expect } from '../fixtures.js';
import { RoomsPage } from '../pages/RoomsPage.js';

test('seed: public room listing', async ({ page }) => {
  const rooms = new RoomsPage(page);
  await rooms.goto();

  await expect(rooms.listing).toBeVisible();
  await expect(rooms.heather).toBeVisible();
  await expect(rooms.thistle).toBeVisible();
  await expect(rooms.rowan).toBeVisible();
});
