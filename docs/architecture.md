# Architecture

Wee B&B uses one npm package containing a React/Vite frontend, a TypeScript/Express API and a local JSON store.

```text
Browser -> Vite (127.0.0.1:5173) -> /api proxy -> Express (127.0.0.1:3001)
                                                   |
                                             booking service
                                                   |
                                       JSON repository -> local file
```

## Frontend

`app/client` provides the room catalog, login, My bookings and administration views at `/`, `/login`, `/bookings` and `/admin`. It displays API results and accessible messages; client-side checks support users while the API remains authoritative.

## API

`app/server` handles authentication, roles, ownership, date validation, pricing, conflicts and persistence. A booking is confirmed only after it has been saved. Business rules are in the [requirements](requirements.md).

All routes below have the `/api` prefix. Lists return `{ rooms: [...] }` or `{ bookings: [...] }`; booking mutations return `{ booking: ... }`.

| Method and route | Access | Result |
| --- | --- | --- |
| `GET /health` | Public | Readiness and UTC `today` |
| `GET /rooms` | Public | Room catalog |
| `POST /auth/login` | Public | User ID/email/role and session cookie; invalid credentials return 401 |
| `GET /auth/me` | Signed in | Current user ID/email/role |
| `POST /auth/logout` | Any caller | Revoke presented session, clear cookie; 204 and idempotent |
| `GET /bookings` | Guest | Own active/cancelled bookings |
| `POST /bookings` | Guest | Create booking; 201; accepts only roomId, arrival and departure |
| `POST /bookings/:id/cancel` | Owner or administrator | Cancel booking; 200 |
| `GET /admin/bookings` | Administrator | All bookings with owner email |

Errors use `{ error: { code, message } }` without stack traces. Invalid payloads or unknown fields return 400, missing authentication 401, forbidden access 403, unknown resources 404, conflicts 409 and unexpected storage errors 500.

Mutation requests must have the exact local application Origin before JSON parsing. For well-formed requests, authentication and role checks precede business validation. This educational API returns 403 for cancellation of an existing foreign booking, accepting that limited existence disclosure.

## Authentication

- Demo passwords are checked with scrypt and per-account salts.
- Random opaque sessions are held in API memory for eight hours. Logout revokes a session; restart clears all sessions. Reset requires stopping the API first.
- The cookie is HttpOnly, SameSite=Strict and scoped to `/`. Secure is omitted for loopback HTTP; tokens are not stored in localStorage.
- Protected routes enforce roles and ownership independently of UI controls. No permissive CORS is enabled.

## File-backed storage

`data/demo.json` holds fixed demo rooms/accounts, bookings and the booking-ID counter. It is created when absent. Startup validates stored records and booking invariants; malformed data is refused rather than silently reset.

One API process owns the store. PID/UUID owner markers in `data/demo.json.lock/` block concurrent writers, including the reset command. Only definitely exited owners are recovered automatically; inaccessible or malformed owner records fail closed. Never delete a live owner's lock. Preserve needed data before restoring a backup or explicitly resetting a malformed store.

Within that process, conflict checking, ID assignment and writing are serialized. Updates are written to a temporary file and renamed over the store before success is acknowledged. A failed write retains the previous in-memory booking state. This is single-process protection, not database-grade durability or distributed transactions.

## Running and resetting

`npm run dev` starts the API and Vite through `scripts/dev.mjs`. Ports are fixed; startup does not switch silently when a port is busy. Ctrl+C requests shutdown, closes services and drains API writes; expected IPC channel closure during shutdown is handled.

`npm run data:reset` is a separate operator command. **Stop the app first: reset deletes all bookings and restores the demo accounts and rooms. Use only disposable, exclusively controlled data.** There is no HTTP reset endpoint or alternate test store. See the [README](../README.md) for commands and the [test strategy](test-strategy.md) for browser execution.

## Boundaries

The supported environment is Windows 11/PowerShell with Node.js 26.x and npm 11. Both services bind to loopback. Public demo credentials, local HTTP and file-backed storage are appropriate to this educational demo; internet hosting, rate limiting, account lifecycle features and production deployment are outside scope. The API refuses production mode.

Multiple API writers and concurrent booking-test runs against the same store are unsupported. Reports, traces, local data and authentication state are excluded from Git.
