# Wee B&B requirements

Wee B&B is a local booking demonstration. Visitors browse rooms, guests book and manage their own stays, and administrators view and cancel bookings.

## Rooms and accounts

| Room | ID | Nightly price |
| --- | --- | --- |
| Heather | `room-1` | GBP 80 |
| Thistle | `room-2` | GBP 100 |
| Rowan | `room-3` | GBP 120 |

Each room has a description and represents one bookable unit. The public catalog always shows all three rooms; availability is checked for the dates submitted. Demo accounts comprise two guests and one administrator; credentials are in the [README](../README.md).

## Booking rules

- Dates are calendar dates in `YYYY-MM-DD` format, with years 1000–9999. Arrival must be today or later in UTC; departure must be after arrival.
- A stay includes arrival and excludes departure. Back-to-back stays are allowed; overlapping active stays in the same room are rejected. Cancelled bookings do not block dates.
- Prices use integer pence. Total is calendar nights times the nightly price recorded at booking, with no fees or discounts.
- Each booking has a generated reference, owner, room, dates, nightly price, total and active/cancelled status. The server determines the owner and prices.

## Public access and authentication

| ID | Acceptance criteria |
| --- | --- |
| PUB-01 | A signed-out visitor sees exactly three named rooms, descriptions and GBP nightly prices. |
| PUB-02 | An accessible login link opens a labeled email/password form. |
| AUTH-01 | Valid demo credentials sign in the guest or administrator and show appropriate navigation. Invalid credentials return a generic error and create no session. |
| AUTH-02 | Logout revokes the session and clears its cookie; the old cookie cannot access protected resources. |

## Guest bookings

| ID | Acceptance criteria |
| --- | --- |
| GUEST-01 | A signed-in guest books a known room for valid available dates, sees confirmation with dates and total, and retains the booking after page reload and API restart. |
| GUEST-02 | My bookings shows only the guest's own active/cancelled bookings, including room, dates, nightly price, total and status. Other guests' bookings are absent from the UI and API response. |
| GUEST-03 | Cancelling an owned booking marks it cancelled, keeps it visible and frees its dates. Repeated cancellation returns the same state without a duplicate mutation. |

## Administration

| ID | Acceptance criteria |
| --- | --- |
| ADMIN-01 | Only administrators can view all bookings, including owner email and status. Direct guest access is denied without disclosing the list. |
| ADMIN-02 | Administrators can cancel either guest's booking. Administrator booking creation is outside scope and returns 403. |

## Validation and security

| ID | Acceptance criteria |
| --- | --- |
| VAL-01 | Missing, malformed, impossible or past arrival dates, equal dates and departure before arrival return 400 and create no booking. Arrival today is allowed; leap-day validity follows the calendar. UI errors explain the issue and preserve entered dates. |
| VAL-02 | Exact, contained and partial overlaps with an active stay return 409 without creating a booking. Adjacent dates, another room and cancelled stays do not conflict. Concurrent conflicting requests create exactly one booking and return one 409. |
| SEC-01 | Anonymous create/list/cancel/admin API requests return 401 and make no change. |
| SEC-02 | Guest access to admin endpoints and cancellation of another guest's booking return 403. Client-supplied owner or price values cannot override server values. |
| SEC-03 | Store salted password hashes, never plaintext passwords. Responses and normal logs must not expose password hashes or session tokens. Logout, API restart and data reset invalidate affected sessions. |

## Accessibility and local operation

| ID | Acceptance criteria |
| --- | --- |
| UX-01 | Controls have meaningful names and labels, forms work by keyboard, and confirmation/validation messages are accessible. |
| DATA-01 | With the API stopped, the operator reset restores three rooms, three accounts and zero bookings. Repeated reset produces the same logical baseline; tests do not reset data themselves. |
| LOCAL-01 | After installation, the local app and ordinary Playwright tests require no internet connection, paid services or AI tokens. |

These criteria describe application behavior, not a claim of complete automated coverage. See the [test strategy](test-strategy.md) for the focused browser checks and [architecture](architecture.md) for API contracts and limitations.

## Out of scope

Registration, password recovery, external authentication, payments, email, party sizes, calendar widgets, booking edits, room/pricing management and production hosting are outside this demonstration.
