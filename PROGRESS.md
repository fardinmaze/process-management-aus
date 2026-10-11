# Progress report: Process Maps MVP

Last updated: 2026-10-11 (outline editor, generated map and new data model built and browser-tested; connector routing fixed)

## Direction change (2026-10-11)

The free-form Vue Flow canvas has been replaced by a Nintex-style model: contributors write sections as outlines (activities, tasks, role, system, notes, Yes/No decisions) and the system generates a read-only swimlane map. Basis: `public/Nintex Process Manager UX Flow Analysis.md`. `MVP_SPEC.md` (sections 3, 5, 6, 9 to 15), `CLAUDE.md` (rules, build order) and `BACKLOG.md` were rewritten to match.

Status: build steps 1 to 3 of the new order in `CLAUDE.md` are done (below). The mock backend is the only backend; the Django port has not started.

## Build steps 1 to 3 done (2026-10-11)

Steps 1 (layout spike), 2 (data model and mock API) and 3 (outline editor) are built together, so the app stays usable.

- **Layout:** `src/layout/` (dagre ranks, lanes by role, collision fix). `ProcessMap.vue` draws it read-only in Vue Flow. Numeric results on three samples in `tests/layout-spike.mjs`: no overlaps; loops give backward arrows and crossings, so decisions are forward-only.
- **Data model (mock server):** sections hold `activities` (activity or decision; role, system, tasks, notes, `next`). New role library and systems list (admin page `/admin/roles-systems`), map Expert, folder default Expert and members, objective, change descriptions required on section submit and map submit (stored on the activity log), mark as reviewed (`map/mark-reviewed`, `map/review-list`, Reviews due card on the dashboard), feedback with `responseRequired`, owner reply, resolve and reopen, "My feedback" list for readers. New lint rules (no role, same Yes/No target, dangling target, empty map; warnings for no label, no tasks, unreachable step). Snapshot is the ordered activity list with role and system names. Old saved demo data is discarded automatically (schema 2).
- **Editor:** `/maps/:id/edit` (`Editor.vue`) replaces the canvas. One outline per section, live map preview, other sections read-only, autosave with 409 conflict banner, 30-second refresh, submit with a change description, Comments and Documents anchored to the selected step. `/maps/:id/canvas` redirects to it.
- **Viewer:** `PublishedMap.vue` has Map and Procedure tabs, step details, PNG/PDF export of the map, print for the procedure, feedback on a step.
- **Removed:** `Canvas.vue`, `ShapeNode.vue`, `SectionNode.vue`, `graph.js`, the spike page. The earlier shape resize and rename work went with them.
- **Tests:** `npm test` 86 of 86 pass (rewritten for activities, plus role library, change descriptions, forward-only decisions, cross-section jump, review loop, feedback threads). Build passes.
- **Browser test (headless Chrome, `tests/e2e/browser-test.mjs`):** 37 of 37 pass after fixes. It drives the real UI through: new map with Expert and objective, sections and kickoff, the outline editor (activities, roles, tasks, decision, autosave, map preview, click-to-select, comment badge, submit with a required description), contributor read-only view, lint, publish, approver, viewer search, Map and Procedure tabs, step details, feedback with response required, PNG and PDF download, mark as reviewed, all overview tabs, to-do, dashboard card, roles page, folder default Expert, `/canvas` redirect. No console errors except a missing `favicon.ico`, and no external requests.
- **Found and fixed while testing:** a section the owner filled in stayed ASSIGNED so its assignee could not submit it (a save now moves ASSIGNED or CHANGES_REQUESTED to IN_PROGRESS); the editor now warns when Yes and No lead to the same step; the map now opens at a readable zoom instead of shrinking to fit.
- **Connector overlap fixed (2026-10-11):** connectors are now routed by `src/layout/route.js` (vertical runs only in the gutters between columns, long runs only in the free channel at the top or bottom of a lane), drawn as a custom Vue Flow edge in `ProcessMap.vue`. A new `throughNodes` metric in `tests/layout-spike.mjs` is 0 on all three samples. The map also pans to a step picked in the outline. Browser test still 37 of 37. Parallel connectors that end at the same step can still run alongside each other for a short stretch.
- **Decisions taken without an answer:** loops are forward-only; activities have an optional `next`; folder defaults are Expert and members only (approvers stay on the single chain); change log is derived from the activity log; the Expert can mark reviewed and resolve feedback but has no edit rights beyond section allocation.
- **Still to do:** step 4 items already working in the mock but not clicked through (approval flow), step 5 polish, `API_DOCUMENTATION.md`, `.env.example` cleanup, Django backend.

## Status at a glance

| Area | State | Evidence |
|---|---|---|
| App shell, login, role-based navigation | Done | Browser test |
| Invitations, folders (default Expert and members), users and roles, approval chain admin, activity log | Done (mock) | `npm test`; folders in browser test |
| Role library and systems list (admin page) | Done (mock) | `npm test`; browser test |
| Maps, versions, sections, kickoff, Expert, objective | Done (mock) | `npm test`; browser test |
| Outline editor (activities, tasks, role, system, notes, Yes/No decisions), autosave, 409 conflicts, 30-second refresh | Done | Browser test; conflict banner and 30-second refresh not exercised in a browser |
| Generated swimlane map (dagre ranks, lanes by role, routed connectors) in the editor and viewer | Done | `tests/layout-spike.mjs` (0 overlaps, 0 connectors through boxes); browser test; screenshots checked |
| Gate 1 (owner approves or requests changes), change description required on section submit | Done (mock) | `npm test`; browser test (submit) |
| Map lint, submit for publication with change description, immutable snapshot | Done (mock) | `npm test`; browser test |
| Gate 2 approval chain, reject, reopen, self-approval guard, new version cloning | Done (mock) | `npm test`; browser test covers approve only |
| Published viewer: search, Map and Procedure tabs, step details, feedback (response required, reply, resolve), PNG/PDF export | Done | Browser test (feedback reply and resolve are covered by `npm test` only) |
| Review loop: Mark as reviewed, Reviews due card | Done | `npm test`; browser test |
| Summary, tags, to-do list, change log, documents, comments | Done (mock) | `npm test`; browser test (render and to-do add) |
| Real backend (Django `process/` app) | **Not started**: no backend code on this machine | n/a |
| `API_DOCUMENTATION.md` | Not started | n/a |
| `BACKLOG.md` | Done | n/a |

Scope decision: the public portal (anonymous access, `PUBLIC` maps, separate layout) is dropped. Published maps are read in a login-only viewer inside the app.

## What exists

- Frontend: Vue 3, Vue Flow (read-only map), dagre (layout), Tailwind, in this folder's `src/`.
- Mock backend: `src/mock/server.js` implements the state machines, permission matrix, approval chain, lint, snapshot and search. It stores data in the browser (localStorage), so it is single-browser only. `src/api/index.js` is the one place to swap for real HTTP calls.
- Legacy: the extracted SMICEE frontend is parked in `legacy/src-smicee-extract/`.
- No external CDNs.

## Verification

- `npm run build`: passes.
- `npm test` (`tests/acceptance.mjs`): 86 checks pass. It runs the demo scenario against the API layer and confirms each forbidden action is refused by the server, not only hidden in the UI.
- `node tests/layout-spike.mjs`: three sample processes, no overlapping boxes, no connector crosses a box.
- `tests/e2e/browser-test.mjs` (headless Chrome via `playwright-core`, installed outside the project): 37 of 37 pass. Needs the dev server on port 3000.

## Open issues

1. Admins cannot edit sections. The map's own owner can edit any section of their map; everyone else only their assigned section. A product decision may be wanted on whether admins should be able to.
2. An owner's edit to an APPROVED section keeps it APPROVED and is not re-reviewed (Gate 2 still reviews the whole map).
3. Parallel connectors that end at the same step can run side by side for a short stretch, and a lane with many connectors gets crowded.
4. Wide maps (13 columns for the sample onboarding) need panning. The map opens at 70% zoom or more, left aligned.
5. `.env.example` is stale (Laravel and SMICEE host settings).

## Not yet tested in a browser

The editor 409 conflict banner and the 30-second refresh showing another contributor's changes, Gate 1 "request changes" and the resubmit loop, Gate 2 reject and reopen, new version (v2) flow, document upload and the portal-visible toggle in the UI, invitations in the UI, the Procedure tab's print output, and narrow window layouts. The first six are covered by `npm test` at the API level.

## Decisions made without an answer from the spec

- A SUBMITTED section is locked against edits, like APPROVED.
- Rejecting at Gate 2 creates a version-level REVISION comment, auto-resolved when sections are reopened.
- Approvers are sent to their inbox after deciding (they may only view a map while it is IN_REVIEW).
- Invitations show a copyable link instead of sending email.
- Attachments are capped at 600 KB (browser storage limit).
- The map's own owner (the initiator) may edit any section of the map while the version is IN_PROGRESS, including SUBMITTED and APPROVED sections. A save by anyone moves an ASSIGNED or CHANGES_REQUESTED section to IN_PROGRESS; SUBMITTED and APPROVED stay as they are. Spec section 8 updated.
- Assigning a to-do adds the assignee to the map team, which also lets them view the unpublished map. Only OWNER and CONTRIBUTOR users can be assigned.
- Loops (backward decisions) are refused. Activities may carry `next` (a later step or END) so a side branch can finish.
- The change log is derived from the activity log (the change description is the activity note), not a separate table.
- Folder defaults are Expert and members only; approvers stay on the single approval chain.
- The Expert can mark a map reviewed and resolve feedback, but has no edit rights beyond section allocation.

## Open questions for the product owner (from MVP_SPEC section 16)

1. Gate 2 rejection returns to the owner, who reopens sections. Confirmed as built?
2. Anonymous public maps: now out of scope. Confirm.
3. Owner may approve their own section (Gate 2 is the independent check). Confirmed as built?
4. A user may hold several roles. Confirmed as built.
5. Expert is a field plus default approver only, with no extra edit rights. Confirm.
6. Decisions are forward-only (no loops) in the MVP. Confirm, or allow loops.
7. No separate publisher step after Gate 2. Confirm the Council does not need one.
8. Review interval: per map only, or also a site-wide default?

Also needed before real backend work: location of the SMICEE Django repo, its database and file storage, and the onshore email service for invitations.

## Next steps

1. Click through the "not yet tested" list above, or extend `tests/e2e/browser-test.mjs` to cover it.
2. Build step 4 and 5 polish from `CLAUDE.md` (approval flow and viewer details are working in the mock; remaining work is the gaps found in testing).
3. Write `API_DOCUMENTATION.md` from `src/mock/server.js` (it doubles as the backend contract).
4. Clean up `.env.example`.
5. Backend: port to Django once the repo is available.

## Change log

- 2026-10-11 (later): Fixed "My work is empty for contributors". The mock data is per browser profile, so a contributor opened in another profile or a private window saw an empty database. The signed-in user is now per tab (sessionStorage) while the data stays shared, and the mock re-reads the shared data on every call so two tabs never overwrite each other. Two tabs as owner and contributor verified in a headless browser. Also: My work button now says Open editor, and signing out no longer throws a console error.

- 2026-10-11 (later): Connector routing. New `src/layout/route.js`; edges are drawn by a custom Vue Flow edge. No connector crosses a step box on the sample processes (`throughNodes` metric). Map opens at a readable zoom and pans to a step selected in the outline. Browser test 37 of 37.
- 2026-10-11: Headless browser test added (`tests/e2e/browser-test.mjs`, 37 checks). Found and fixed: a section the owner filled in stayed ASSIGNED so its assignee could not submit; editor warns when Yes and No lead to the same step; the map opened too small.
- 2026-10-11: Build steps 1 to 3 (see section above): layout, new data model and mock API, outline editor and viewer. Old canvas files and the spike page removed. `npm test` rewritten, 86 checks.
- 2026-10-11: Added before the rewrite and kept: owner may edit any section of their map; Summary, Tags, To-do and Change log tabs on the map overview; To-do list page (`/todos`). Shape resize and rename was built for the old canvas and went with it.
- 2026-10-11: Docs: `MVP_SPEC.md`, `CLAUDE.md` and `BACKLOG.md` rewritten around the Nintex-style outline model (analysis in `public/`).
- 2026-10-10: Report created. Mock backend, shell, admin, map overview, canvas, published viewer built. Acceptance test (54 checks) and canvas browser test (23 checks) pass.
