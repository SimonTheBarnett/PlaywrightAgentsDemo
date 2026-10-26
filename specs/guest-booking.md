# Guest books a room and finds it in My Bookings

Current status: originally created by the official Playwright Planner before booking execution, then approved by the user and generated into [tests/guest-booking.spec.ts](../tests/guest-booking.spec.ts) by the official Generator. The test executed successfully and was subsequently repaired using the official Playwright Healer after the button wording changed to Reserve Heather. The original scenario, steps and expectations below are preserved; the current POM targets the equivalent Reserve Heather button. See the [test strategy](../docs/test-strategy.md).

## Application Overview

One happy-path business scenario for Wee B&B: login, book Heather, verify confirmation and find the booking in My Bookings. Covers the creation/listing portions of GUEST-01 and GUEST-02, with AUTH-01 as setup.

## Starting state and data

- Use the existing local application at http://127.0.0.1:5173 with disposable exercise data under the operator's exclusive control. Before each run, stop the app, run `npm run data:reset`, confirm it succeeds, then start the app normally. Never reset shared data or developer bookings that must be retained. Reset remains separate from the test and agent seed.
- Start with a fresh browser context. The reset supplies three rooms, seeded accounts and zero bookings, so Heather is available.
- Guest: `guest@example.test` / `WeeDemo123!` (public demo credentials).
- Capture `/api/health`'s UTC `today` once; arrival is today + 7 days and departure today + 9 days, formatted YYYY-MM-DD using UTC calendar arithmetic.
- Heather costs £80.00 per night; two nights total £160.00.

## Existing project conventions

Use seed `tests/setup/agent.seed.spec.ts`, project `agent-seed`, and reuse LoginPage and RoomsPage. Tests import test/expect from `tests/fixtures.ts` with the correct relative .js path, use accessible locators and native web-first assertions, and keep business assertions in tests. Scope date inputs to Heather's form. Use the existing application and data reset without new infrastructure, reset hooks or custom fixtures. The test path below is implemented and included in the chromium regression project's test matching.

## Evidence and review

### Historical planning observations

On 26 October 2026, the official Planner ran the existing seed and confirmed guest login, My bookings and Heather's booking form. No booking or reset was performed during planning. At that point, confirmation and populated-list expectations came from the requirements and application source; the complete booking journey had not yet been executed.

### Subsequent verified results

After user approval, the official Generator executed the booking flow and created the test. Its initial targeted Playwright run passed. Following the deliberate Book-to-Reserve UI wording change, the official Healer reproduced the stale button-locator timeout and changed only the exact button name in RoomsPage to Reserve Heather. The post-repair targeted verification passed (1 test in 2.8s), and subsequent ordinary regression execution passed both tests (3.0s). The booking behavior and business assertions were preserved. These are recorded results from the demonstration, not new test runs for this documentation update.

Success means the confirmation and My Bookings describe the booked room, dates and total, with an active booking. Missing or mismatched business details fail the scenario. Reload/restart, validation, conflicts and other users are outside this focused scenario. The original pre-generation review gate was satisfied by explicit user approval. Any further agent work still requires a separate user request.

## Test Scenarios

### 1. Guest booking

**Seed:** `tests/setup/agent.seed.spec.ts`

#### 1.1. Guest books Heather for two nights and sees it in My Bookings

**File:** `tests/guest-booking.spec.ts`

**Steps:**
  1. Log in through LoginPage with the public demo guest credentials.
    - expect: The banner identifies guest@example.test as a signed-in Guest.
  2. Open Rooms through RoomsPage. In Heather's booking form, enter the calculated arrival and departure dates and select Book Heather once.
    - expect: The booking is accepted and a confirmation appears.
  3. Read Heather's booking confirmation.
    - expect: It confirms Heather, the selected arrival and departure dates, and a total of £160.00.
  4. Open My bookings using the main navigation.
    - expect: The guest's booking list shows Heather for the selected dates, total £160.00 and status active.
