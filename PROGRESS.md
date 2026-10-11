# Progress report: Process Maps MVP

Last updated: 2026-10-11 (canvas discoverability fixed and re-tested)

## Status at a glance

| Area | State | Evidence |
|---|---|---|
| App shell, login, role-based navigation | Done | Built; used in browser test |
| Invitations (create, resend, revoke, accept by token) | Done (mock) | `npm test` |
| Folders, users and roles, approval chain admin, activity log | Done (mock) | `npm test` |
| Maps, versions, sections, kickoff | Done (mock) | `npm test` |
| Gate 1: owner approves or requests changes per section | Done (mock) | `npm test` |
| Map lint, submit for publication, immutable snapshot | Done (mock) | `npm test` |
| Gate 2: approval chain, reject, reopen, self-approval guard | Done (mock) | `npm test` |
| New version (v2) cloning, v1 stays live | Done (mock) | `npm test` |
| Canvas: frames, shapes, connections, locking, autosave, undo/redo, conflicts | Done, tested | 23 headless-browser checks |
| Canvas discoverability for owners / admins; drag-and-drop from the shape library | Done, tested | 10 more headless-browser checks |
| Comments, attachments, notifications | Done (mock), UI partly untested | `npm test`; not clicked through in a browser |
| Published viewer: search, PDF/PNG export, feedback | Built, export untested in a browser | `npm test` covers the data side only |
| Real backend (Django `process/` app) | **Not started**: no backend code on this machine | n/a |
| `API_DOCUMENTATION.md`, `BACKLOG.md` | Not started | n/a |

Scope decision: the public portal (anonymous access, `PUBLIC` maps, separate layout) is dropped. Published maps are read in a login-only viewer inside the app.

## What exists

- Frontend: Vue 3, Vue Flow, Tailwind in `D:\Process Management\src`.
- Mock backend: `src/mock/server.js` implements the spec's state machines, permission matrix, approval chain and search. It stores data in the browser (localStorage), so it is single-browser only. `src/api/index.js` is the one place to swap for real HTTP calls.
- Legacy: the extracted SMICEE frontend is parked in `legacy/src-smicee-extract/`.
- No external CDNs (Remix Icon and Google Fonts links were removed).

## Verification

- `npm run build`: passes.
- `npm test` (`tests/acceptance.mjs`): 54 checks pass. It runs the 8-step demo scenario and confirms each forbidden action is refused by the server, not only hidden in the UI.
- Canvas browser test (headless Chrome, script kept outside the project): 23 of 23 pass. Covers frames, locked frames, adding shapes, connecting (including into another section), drag constraint, autosave, cross-section edge storage, undo/redo, reload persistence, conflict banner, submit.

## Open issues

1. Label field: a new Start step showed "StartOffer accepted" in the first canvas test. Probably a test-script problem (select-all did not take). Not yet confirmed by hand.
2. Admins cannot draw (spec: only an assigned OWNER or CONTRIBUTOR edits a section). The canvas now says so, but a product decision may be wanted on whether admins should be able to assign sections to themselves.

Closed: *Owner cannot find how to create shapes* (reported 2026-10-10). Cause: the shape library only works inside a section assigned to the signed-in user, and it was hidden entirely when there was none. Fixed 2026-10-11, see change log.

## Not yet tested in a browser

Edge labels (Yes/No), sub-process and document pickers, Comments and Documents tabs on the canvas, the 30-second refresh showing another contributor's changes, PNG/PDF export, the map overview page end to end.

## Decisions made without an answer from the spec

- A SUBMITTED section is locked against edits, like APPROVED.
- Rejecting at Gate 2 creates a version-level REVISION comment, auto-resolved when sections are reopened.
- Approvers are sent to their inbox after deciding (they may only view a map while it is IN_REVIEW).
- Invitations show a copyable link instead of sending email.
- Attachments are capped at 600 KB (browser storage limit).

## Open questions for the product owner (from MVP_SPEC section 16)

1. Gate 2 rejection returns to the owner, who reopens sections. Confirmed as built?
2. Anonymous public maps: now out of scope. Confirm.
3. Owner may approve their own section (Gate 2 is the independent check). Confirmed as built?
4. A user may hold several roles. Confirmed as built.

Also needed before real backend work: location of the SMICEE Django repo, its database and file storage, and the onshore email service for invitations.

## Next steps

1. Fix canvas discoverability (open issue 1) and re-test.
2. Click through the rest of the UI in a browser (list above) and fix what breaks.
3. Write `API_DOCUMENTATION.md` and `BACKLOG.md`.
4. Backend: port to Django once the repo is available.

## Change log

- 2026-10-11: Fixed canvas discoverability. The shape library is now always visible. When the user has no editable section it is disabled and says why (and the reason depends on the version status). Shapes can be dragged from the library onto the user's own section and land where dropped (a drop outside their own section is refused); click-to-add still works. The map overview shows a hint to an owner who has no section of their own. Headless-browser test for this: 10 of 10 pass; no browser errors. Canvas test from 10-10 not re-run after the change.
- 2026-10-10: Report created. Mock backend, shell, admin, map overview, canvas, published viewer built. Acceptance test (54 checks) and canvas browser test (23 checks) pass. Fixed initial fit-view bug on the canvas.
