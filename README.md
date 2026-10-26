# PlaywrightAgentsDemo — Wee B&B

A local Wee B&B booking site for demonstrating Playwright tests and the official Planner, Generator and Healer agents. Built with React, Vite, TypeScript, Express and file-backed JSON storage; no Docker or external services are needed.

## Install

Use **Windows 11 with PowerShell**, **Node.js 26.x** (`>=26 <27`) and **npm 11**. From the repository folder:

```powershell
npm ci
npx playwright install chromium
```

If `npm ci` fails with a certificate trust error, enable [Node.js system CA certificates](https://nodejs.org/api/cli.html#node_use_system_ca1) for the current PowerShell session and retry:

```powershell
$env:NODE_USE_SYSTEM_CA = "1"
npm ci
```

Optionally persist this for your Windows user (applies to new terminals):

```powershell
[Environment]::SetEnvironmentVariable("NODE_USE_SYSTEM_CA", "1", "User")
```

For the AI agent demonstrations, you also need Codex with a working model connection and the [agent setup](docs/using-playwright-agents.md). The app and ordinary Playwright tests do not require Codex.

## Start the app

```powershell
npm run dev
```

Open **http://127.0.0.1:5173** once the API and frontend are ready. Keep the terminal open; press **Ctrl+C** to stop. Starting the app preserves existing bookings and creates initial data only when absent.

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Guest | `guest@example.test` | `WeeDemo123!` |
| Second guest | `guest2@example.test` | `WeeDemo123!` |
| Administrator | `admin@example.test` | `WeeDemo123!` |

These are public credentials for local demonstration only. Guests can book rooms, view their own bookings and cancel them; administrators can view and cancel all bookings. Dates use UTC: arrival must be today or later, with departure after arrival.

## Run the Playwright tests

The two regression tests cover guest login and booking a room, including confirmation and My bookings. They open Chromium visibly and close it when finished; ordinary test runs need no AI agent or model tokens.

**Stop the app before resetting. Reset deletes all demo bookings in `data/demo.json`—use disposable local data only, never shared bookings or bookings you need to keep.** Before each regression run:

```powershell
npm run data:reset
npm test
```

Playwright starts missing services automatically and stops services it started. A successful booking test leaves one active booking, so reset again before the next run. To run only that test:

```powershell
npm test -- tests/guest-booking.spec.ts
```

## AI integration

PlaywrightAgentsDemo uses Codex as its AI execution environment and includes Codex-specific official Playwright Planner, Generator and Healer definitions. [Playwright also supports Claude Code, VS Code and OpenCode](https://playwright.dev/docs/test-agents), but those environments require their own agent setup and verification, outside this repository's scope. Ordinary Playwright tests run independently of AI, without a model connection or AI tokens.

## What is the agent seed?

The seed gives Planner and Generator a browser starting point: it opens the rooms page and checks that Heather, Thistle and Rowan are visible. It leaves stored data unchanged; `data:reset` restores demo data, while `npm test` runs the regression tests. Running the seed yourself performs that small check and closes the browser without launching an AI agent.

```powershell
npm run agent:seed
```

## Other commands

| Command | Purpose |
| --- | --- |
| `npm run test:report` | Open the latest regression HTML report without rerunning tests |
| `npm run test:e2e` | Alias for `npm test` |
| `npm run typecheck` | Check TypeScript |
| `npm run build` | Typecheck and build the client/server |
| `npm run dev:server` | Start only the API |
| `npm run dev:client` | Start only the frontend |
| `npm run` | List available scripts |

If startup reports a busy port or locked store, stop the other app instance before retrying. Never delete a live store owner's lock. After dependency updates, run `npm ci` again.

## More detail

For agent requests and human review steps, follow the [agent guide](docs/using-playwright-agents.md). The [approved booking scenario](specs/guest-booking.md) is the worked example; agent execution may require model connectivity and corporate authorization.

See the [requirements](docs/requirements.md), [architecture](docs/architecture.md), [test strategy](docs/test-strategy.md), and [engineering instructions](AGENTS.md). This is a local educational demo, not a production booking service.
