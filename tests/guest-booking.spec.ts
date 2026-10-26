// spec: specs/guest-booking.md
// seed: tests/setup/agent.seed.spec.ts
import { test, expect } from './fixtures.js';
import { LoginPage } from './pages/LoginPage.js';
import { RoomsPage } from './pages/RoomsPage.js';
import { BookingsPage } from './pages/BookingsPage.js';

test.describe('Guest booking', () => {
  test('Guest books Heather for two nights and sees it in My Bookings', async ({ page, request }) => {
    const login = new LoginPage(page);
    const rooms = new RoomsPage(page);
    const bookings = new BookingsPage(page);
    const health = await request.get('/api/health');
    await expect(health).toBeOK();
    const { today } = await health.json() as { today: string };
    const futureDate = (days: number): string => {
      const date = new Date(`${today}T00:00:00Z`);
      date.setUTCDate(date.getUTCDate() + days);
      return date.toISOString().slice(0, 10);
    };
    const arrival = futureDate(7);
    const departure = futureDate(9);

    // 1. Log in through LoginPage with the public demo guest credentials.
    await login.goto();
    await login.login('guest@example.test', 'WeeDemo123!');
    await expect(login.signedInGuest).toHaveText('Signed in as guest@example.test (Guest)');

    // 2. Open Rooms through RoomsPage. In Heather's booking form, enter the calculated arrival and departure dates and select Book Heather once.
    await rooms.goto();
    await rooms.bookHeather(arrival, departure);

    // 3. Read Heather's booking confirmation.
    await expect(rooms.heatherConfirmation).toContainText(
      `Booking confirmed: Heather, ${arrival} to ${departure}. Total £160.00.`,
    );

    // 4. Open My bookings using the main navigation.
    await bookings.openFromNavigation();
    await expect(bookings.heatherBooking).toBeVisible();
    await expect(bookings.heatherBooking).toContainText(`${arrival} to ${departure}`);
    await expect(bookings.heatherBooking).toContainText('Total £160.00');
    await expect(bookings.heatherBooking).toContainText('Status: active');
  });
});
