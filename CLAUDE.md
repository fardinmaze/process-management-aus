# CLAUDE.md

## What this project is

A collaborative **process-mapping platform** (working title: Process Maps). Owners initiate a map, split it into sections, allocate sections to contributors, and take it through two approval gates before it is published to a read-only portal.

**Read `MVP_SPEC.md` first.** It defines the flow, roles, state machines, data model, API surface, scope and acceptance scenario. Do not build anything that is not in it. If something is ambiguous, check the open questions in section 16 and ask me before building the affected part.

This codebase is **seeded from modules extracted from the Smicee ERP**: approval chain, project management, activity log, supporting documents, role-based access. We are customising and blending them, not preserving them. Strip what the MVP does not need.

## Stack

- Backend: Django + Django REST Framework, new app `process/`
- Frontend: Vue 3 + Vue Flow (`@vue-flow/core`)
- Database and file storage: whatever the extracted code already uses. Inspect the repo and confirm before changing anything.
- Run, test and lint commands: **discover them from the repo** (README, Makefile, package.json, CI config) and record them here once found. Do not guess.

## Backend conventions (carried over from the source ERP, verify against the extracted code)

- Function-based DRF views with `@api_view` and `@permission_classes([...])`.
- Responses are `{code, response, data}`.
- Call `log_activity` on every state change and on every create, update or delete of a map, version, section, comment or attachment.
- `APPEND_SLASH=False`, so **routes have no trailing slash**.
- Notifications go through the existing notification helper. Add the new events listed in `MVP_SPEC.md` section 11.
- Approval chain: business modules call the internal helpers `create_instance`, `record_action` and `get_pending_approvers`. The approval app never exposes approve or reject itself. Approval instances attach to a **ProcessMapVersion**, never to the map.
- Maintain `API_DOCUMENTATION.md`. Update it in the same change as any endpoint you add or alter, including a module-wiring tracker section.

## Rules that must not be broken

1. **Authorization is server-side, always.** Every section action (save, submit, approve) re-checks role, assignment and current status. The Vue Flow lock is a convenience. A test must prove a contributor cannot edit another's section by calling the API directly.
2. **Versions are immutable** once `IN_REVIEW`. `section/save` must reject writes unless the version is `IN_PROGRESS` and the section is not `APPROVED`.
3. **The portal serves only `PUBLISHED` versions, from `graph_snapshot`.** It must never read draft section graphs.
4. **Attachments default to `INTERNAL`.** An attachment is portal-visible only when the owner flips it.
5. **No customer data leaves Australia.** No third-party analytics, hosted AI APIs, or external CDNs in the portal. File storage location comes from environment config, never hard-coded.
6. **Self-approval guard:** the user who submitted a version can never be a pending approver for it.
7. **Node ids are globally unique across a map** (UUID-based) so edges can cross sections. Never reuse an id.

## Scope discipline

- Build the MVP list only. Anything else goes into `BACKLOG.md` as a one-line entry, and you carry on.
- Prefer fewer, simpler moving parts. No new dependency without asking, and say why it is needed.
- When extracting, **grep for references before deleting** a model, view or URL. Remove clients, deliverables, time tracking and tasks from the extracted project module, but only after confirming nothing the MVP uses depends on them.
- Don't rewrite working extracted code for style. Change it only when the MVP needs it.

## Build order (stop for review after each step)

1. **Canvas spike.** Prove in Vue Flow: section frames as parent nodes, step nodes constrained inside them (`extent: 'parent'`), locked frames read-only, edges crossing frames. This is the riskiest UI piece. If it fights us, report back before continuing.
2. **Extraction and skeleton.** Strip the extracted modules to what the MVP uses. Add the `process` app models, migrations, roles and invitations. App boots, tests pass.
3. **Maps, versions, sections.** CRUD, assignment, kickoff, the section status machine, `section/save` with revision conflict check, and the permission matrix with tests.
4. **Approval flow.** `PROCESS_MAP` feature, map lint, `version/submit`, snapshot, approve and reject, reopen, new-version cloning.
5. **Collaboration.** Comments (`COMMENT`, `REVISION`, `FEEDBACK`), attachments, notifications, activity log views.
6. **Portal.** Read-only viewer, search, PDF/PNG export, feedback.
7. **Dashboards, seed data and the acceptance scenario** from `MVP_SPEC.md` section 15, then fix gaps.

## Working agreement

- For anything touching more than one app or model, **propose a short plan first** and wait for a go-ahead.
- Keep commits small, one logical change each, and mention which build-order step they belong to.
- When you finish a step, say what you changed, what you tested, and what you decided without asking.
- Never invent requirements. If `MVP_SPEC.md` is silent, ask.
