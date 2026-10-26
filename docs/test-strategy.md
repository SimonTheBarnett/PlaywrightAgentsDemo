# Test strategy

The demo uses Playwright Test with TypeScript and a small Page Object Model. There are two regression tests and a separate agent seed; no unit or smoke suite. Installation and startup are covered in the [README](../README.md).

## Tests and page objects

| File | Purpose |
| --- | --- |
| `tests/login.spec.ts` | Sign in as the demo guest and check the visible identity. |
| `tests/guest-booking.spec.ts` | Book Heather for two nights, check the GBP 160 confirmation, and find the active booking with matching dates/total in My bookings. |
| `tests/setup/agent.seed.spec.ts` | Open the public catalog and check Heather, Thistle and Rowan are visible. |

LoginPage, RoomsPage and BookingsPage own accessible locators and interactions; business assertions stay in tests. `tests/fixtures.ts` re-exports native Playwright `test` and `expect`, imported with the appropriate relative `.js` path. Use native waiting and web-first assertions, without arbitrary sleeps, generic page wrappers or custom reset fixtures.

## Agent seed

The seed gives Planner and Generator a known browser starting point through project `agent-seed`. It is independent of login, data reset and the regressions, and does not change stored data. Running `npm run agent:seed` checks that starting point without an AI agent and closes the browser afterwards.

## Deterministic demo data

Before every booking run, stop the app and run `npm run data:reset` separately. **Reset removes all bookings in `data/demo.json`; never use shared data or bookings you need to retain.** A successful run leaves one active booking, so reset again before repeating it.

The reset supplies fixed rooms/accounts and zero bookings. The booking test reads UTC `today` from `/api/health` and uses arrival +7 days/departure +9 days. Prices are integer pence and stays use UTC calendar arithmetic. Fresh browser contexts isolate cookies, not the file-backed store; only one booking run may use it at a time.

## Execution and reporting

| Setting | Behavior |
| --- | --- |
| `npm test` / `npm run test:e2e` | Select the `chromium` project: login and booking only. |
| `npm run agent:seed` | Select the `agent-seed` project with list-only reporting. |
| Browser | Headed Chromium, one worker, no fully parallel execution, zero retries, 10-second per-test timeout. |
| Servers | Native readiness checks on ports 5173/3001; reuse local services, refuse existing services in CI, stop only services started by Playwright. |
| Results | Regression artifacts in `test-results/regression`; seed artifacts in `test-results/agent-seed`. |
| Reports | Regression list/HTML reporting; `npm run test:report` opens the latest report without rerunning tests. The seed leaves that report alone. |
| Failure evidence | Retain-on-failure traces; generated artifacts and auth state stay outside Git. |

Bare `npx playwright test` selects both projects; use the npm scripts to keep seed and regression reporting separate. Ordinary Playwright runs require no model connection or AI tokens.

## Official agents

Planner creates a scenario specification, Generator implements an approved specification, and Healer investigates a named failure. Follow the [agent guide](using-playwright-agents.md) for routing, example prompts and review checkpoints. Keep the existing POM/fixture conventions and meaningful assertions; skipped tests or weakened assertions are not successful repairs.

Agent work needs an explicit request and may use model tokens. The one-diagnosis/patch-cycle and one-verification Healer budget is supervised project practice, not a technically guaranteed host limit. After Playwright upgrades, regenerate official definitions with the pinned CLI and project `agent-seed`, then review all resulting changes, including seed/configuration files.

## Replaying the locator example

On a scratch branch, temporarily change only RoomsPage's button locator from Reserve Heather to Book Heather. Reset disposable data with the app stopped and run the booking test to reproduce the locator failure. Restore the locator to Reserve Heather afterwards, or request the bounded Healer workflow. Keep the intended business assertions unchanged.

## Coverage limits

The two regressions cover guest login and the booking happy path, not the full [requirements](requirements.md). Cancellation, administrator/error journeys, invalid dates/overlaps, reload/restart persistence, storage failures and exhaustive accessibility are outside this browser suite.

Other platforms, headless CI, physical network/model disconnection and exhaustive visual/keyboard behavior are not established by these tests. This demo is not a production security assessment. See [architecture](architecture.md) for storage and authentication boundaries.
