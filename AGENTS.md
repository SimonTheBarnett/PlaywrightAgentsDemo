# Engineering instructions

## Scope and working method

Maintain PlaywrightAgentsDemo: a completed local Wee B&B demonstration site, Playwright tests and official Playwright Test Agents. Read README.md, docs/requirements.md, docs/architecture.md and docs/test-strategy.md before changing anything.

- Engineering judgment takes precedence over generated output. Keep changes small, explicit and reviewable.
- Keep changes within the user's requested scope.
- Report evidence, limitations and changes for human review.
- Use TypeScript, consistent descriptive names and responsibility-based modules. Explain non-obvious decisions and update the architecture documentation when the system changes.
- Prefer the smallest practical solution. Avoid speculative abstractions, unnecessary dependencies, UI libraries, Docker and external infrastructure.
- Use npm, maintain package-lock.json and document the supported toolchain. Use Windows-compatible commands and Node scripts instead of shell-specific orchestration.
- Use package.json scripts as the command entry points: npm ci for dependencies and npm run dev for the combined local app. Startup must not install packages or reset data.
- Do not overwrite unrelated user work. Report verification actually performed; do not claim proposed commands or acceptance criteria have passed.

## Application and data

- Enforce authentication, roles, ownership, input validation and overlap checks in the API. UI controls are not authorization.
- Store salted password hashes, never plaintext passwords. Public demo credentials may be documented; never commit real credentials, session tokens or authentication-state files.
- Keep storage embedded and file-backed. Serialize conflict checking and writes in one API process; acknowledge the limits of this architecture.
- Keep test data deterministic, isolated and resettable. Never reset a shared or developer store from a test.
- Treat dates as date-only values and prices as integer pence. Follow the requirements rather than inventing business behavior.

## Tests

- Keep this a Playwright demonstration. Use the existing browser regressions and independent agent seed for automated testing; do not add unit/smoke suites or separate testing infrastructure. Build/typecheck remain ordinary development checks.
- Use Playwright's built-in waiting and web-first assertions. Never use arbitrary sleeps or `waitForTimeout()` for synchronization.
- Prefer accessible roles and labels, then stable test IDs where needed; use Playwright native assertions. Avoid brittle CSS/XPath.
- Keep RoomsPage and LoginPage; agent-generated tests should reuse them where appropriate. Add a small, focused page object when a new page or meaningful reusable interaction justifies it. Page objects own locators/interactions; business assertions stay in tests. Avoid generic BasePage abstractions and unnecessary selector/interaction duplication.
- Import test and expect from tests/fixtures.ts (using the correct relative path and .js extension). It re-exports native Playwright fixtures; isolated browser contexts are enough for the agent seed and login regression. No custom fixtures or reset hooks are needed yet.
- npm test selects tests/login.spec.ts and the agent-generated tests/guest-booking.spec.ts. The independent agent seed is tests/setup/agent.seed.spec.ts, selected by npm run agent:seed; it must not mutate business data or enter normal regression reporting. Application data reset remains scripts/reset.ts via npm run data:reset, run separately with the app stopped on disposable, exclusively controlled demo data before booking-test runs. No Cucumber, Gherkin, BDD libraries or extra test frameworks.
- Never weaken, delete or bypass an assertion to manufacture a pass. Skips, expected failures and blanket retries are not repairs.
- Diagnose failures as application, automation, data or environment issues using evidence. Fix application defects as application changes with regression coverage.
- Run checks appropriate to the change, retain useful failure traces and report unresolved failures accurately.
- Ordinary Playwright execution must require no model connection, AI SDK or AI tokens.

## Official Playwright Test Agent Routing

Route natural-language requests to these registered Codex subagent roles by default:

- Plan, design or explore test scenarios: `playwright_test_planner`.
- Generate Playwright tests from a human-approved Markdown plan: `playwright_test_generator`.
- Diagnose or repair failing Playwright tests: `playwright_test_healer`.

Use the named role as `agent_type`; never substitute parent Codex planning, test generation or healing. If delegation is unavailable, explain the problem and stop. Routine application development, Git/configuration work and ordinary Playwright runs stay with the parent.

Keep each task to one scenario and agreed files. Reuse the POM/fixtures and native waiting rules above; no arbitrary sleeps or Cucumber. Never silently weaken assertions or automatically skip failures. Require human review between agents; do not chain them or invoke Healer automatically after a failure. A diagnosis-only request does not authorize a patch. These instructions guide routing; they do not technically enforce it. Verify the named role in Codex activity as described in [the guide](docs/using-playwright-agents.md).

## Official agents and review

- Use only official Playwright Planner, Generator and Healer definitions created by the pinned Playwright CLI. Do not invent substitutes or edit vendor instructions to bypass safeguards.
- Agent setup and routing are documented in docs/using-playwright-agents.md. Agent work requires a user request; preparation or documentation work never authorizes execution. Do not change global trust settings silently.
- This AGENTS.md is project policy, not an official agent definition. `specs/` holds scenario plans, `tests/` holds executable tests and POMs, and `.codex/agents/` holds official agent definitions. Keep bounded task prompts in the agent request.
- Regenerate official definitions after Playwright upgrades and review all resulting file changes, including seed tests and configuration.
- Require human approval of a scenario plan before Generator work and human review of every agent patch before acceptance.
- Limit each request to one named scenario and explicit output files. For Healer, allow one diagnosis/patch cycle and one verification run, then stop for review. Stop sooner if the host cannot enforce the budget.
- A Healer skip is unresolved work. Preserve the original expected behavior and record evidence, classification and the proposed repair. An automatic green result alone is insufficient.
- Agent instructions are safeguards, not a technical guarantee. Observe execution and stop unauthorized retries or scope expansion. Record model usage when the host exposes it; do not estimate token counts as fact.

This file provides persistent project guidance following [OpenAI's AGENTS.md guidance](https://developers.openai.com/codex/guides/agents-md). The project-specific task boundaries, agent review gates and repair budget are deliberate repository policies.
