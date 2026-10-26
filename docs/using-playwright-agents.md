# Using the official Playwright agents

Planner explores the application and writes a Markdown scenario. Generator turns an approved scenario into a Playwright test. Healer investigates failing tests and proposes or applies a repair, depending on your request.

## Setup

Follow the [README](../README.md) to install dependencies and Chromium. Open this repository in Codex with model access and the project's Playwright MCP tools enabled; review and trust the project configuration when prompted.

Check the configured MCP server with:

```powershell
codex.exe mcp get playwright-test
```

Start Wee B&B with `npm run dev`, or let Playwright start missing services. Before any booking run, stop the app and use `npm run data:reset` on disposable demo data: it removes all bookings.

The seed, `tests/setup/agent.seed.spec.ts` in project `agent-seed`, opens the rooms page for Planner and Generator. It leaves stored data unchanged; `data:reset` restores application data, while `npm test` runs the regressions. The agents run the seed through their setup tools, so you do not need to run it manually first.

## How Agent Routing Works in This Project

[AGENTS.md](../AGENTS.md) provides engineering standards and natural-language routing. The official definitions are in `.codex/agents/*.toml`; `.codex/config.toml` configures MCP. Codex hosts the agent work, while Playwright Test runs the resulting tests independently.

| Your request | Official agent |
| --- | --- |
| Plan or explore a scenario | `playwright_test_planner` |
| Generate a test from an approved plan | `playwright_test_generator` |
| Investigate or repair a failing test | `playwright_test_healer` |

You can ask naturally without naming the agent. Check Codex activity for the matching `agent_type`: project instructions guide routing but do not guarantee it. If delegation is unavailable, report that issue rather than substitute ordinary Codex work.

## Example Prompts — Guest Booking Demonstration

### Planner

```text
Plan one meaningful guest-booking scenario:
log in, book Heather, verify confirmation and check My Bookings.
Use seedFile tests/setup/agent.seed.spec.ts and project agent-seed.
Reuse the existing application, POM and data reset.
Save the plan to specs/guest-booking.md and stop for review.
```

Review the room, dates and expected results before approving generation.

### Generator

```text
I approve specs/guest-booking.md.
Generate its single test in tests/guest-booking.spec.ts.
Reuse existing page objects and fixtures.
Keep meaningful business assertions and no arbitrary waits.
Stop for review.
```

Review the patch and page-object changes. The generated TypeScript runs with ordinary Playwright afterwards.

### Healer

```text
Investigate and repair tests/guest-booking.spec.ts.
Preserve the intended business behaviour and assertions.
Allow one diagnosis/patch cycle and one targeted verification.
Report your findings and stop for review.
```

Use this for an actual failing test and supply its error or trace. Review the diagnosis and repair; skipped tests or weakened assertions do not establish a successful repair.

## Review and run tests

The handover is **plan → review → generation → review → test run → Healer if requested → review**. These checkpoints are project practice; agents do not automatically enforce them.

Inspect changes with:

```powershell
git status --short
git diff
```

Stop the app before resetting. Reset deletes demo bookings, so never use data you need to retain:

```powershell
npm run data:reset
npm test
npm run test:report
```

For booking only, use `npm test -- tests/guest-booking.spec.ts`. A successful run leaves a booking; reset before repeating it. Agent work may use model tokens; normal Playwright execution does not.

For replay instructions, see [test strategy](test-strategy.md#replaying-the-locator-example). To try changes separately, create a branch with `git switch -c demo/guest-booking`.

## Help

If MCP or the named roles are unavailable, check project trust and restart Codex after configuration changes. Keep the official agent definitions unchanged.

Official documentation: [Test Agents](https://playwright.dev/docs/test-agents), [page objects](https://playwright.dev/docs/pom) and [best practices](https://playwright.dev/docs/best-practices).
