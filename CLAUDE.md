# CLAUDE.md

## What this project is

A collaborative **process-mapping platform** (working title: Process Maps). Owners initiate a map, split it into sections, allocate sections to contributors, and take it through two approval gates before it is published to a read-only viewer. Contributors write sections as outlines (activities, tasks, roles) and the system generates the swimlane map (Nintex-style; see `MVP_SPEC.md` section 5).

**Read `MVP_SPEC.md` first.** It defines the flow, roles, state machines, data model, API surface, scope and acceptance scenario. Do not build anything that is not in it. If something is ambiguous, check the open questions in section 16 and ask me before building the affected part.

This codebase is **seeded from modules extracted from the Smicee ERP**: approval chain, project management, activity log, supporting documents, role-based access. We are customising and blending them, not preserving them. Strip what the MVP does not need.

## Stack

- Backend: Django + Django REST Framework, new app `process/`
- Frontend: Vue 3 + Tailwind. Vue Flow (`@vue-flow/core`) renders the generated map **read-only**. Layout library (dagre first, elkjs only if needed) is a new dependency: confirm after the layout spike.
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

1. **Authorization is server-side, always.** Every section action (save, submit, approve) re-checks role, assignment and current status. The UI lock on other sections is a convenience. A test must prove a contributor cannot edit another's section by calling the API directly.
2. **Versions are immutable** once `IN_REVIEW`. `section/save` must reject writes unless the version is `IN_PROGRESS` and the section is not `APPROVED`.
3. **The portal serves only `PUBLISHED` versions, from `snapshot`.** It must never read draft section activities.
4. **Attachments default to `INTERNAL`.** An attachment is portal-visible only when the owner flips it.
5. **No customer data leaves Australia.** No third-party analytics, hosted AI APIs, or external CDNs in the portal. File storage location comes from environment config, never hard-coded.
6. **Self-approval guard:** the user who submitted a version can never be a pending approver for it.
7. **Activity ids are globally unique across a map** (UUID-based) so decisions can target activities in other sections. Never reuse an id. Deleting an activity referenced by a decision is blocked.
8. **Change description is required** on section submit and on map submit, and feeds the change log.

## Scope discipline

- Build the MVP list only. Anything else goes into `BACKLOG.md` as a one-line entry, and you carry on.
- Prefer fewer, simpler moving parts. No new dependency without asking, and say why it is needed.
- When extracting, **grep for references before deleting** a model, view or URL. Remove clients, deliverables, time tracking and tasks from the extracted project module, but only after confirming nothing the MVP uses depends on them.
- Don't rewrite working extracted code for style. Change it only when the MVP needs it.

## Build order (stop for review after each step)

The earlier canvas-first order is superseded (2026-10-11, Nintex-style outline model).

1. **Layout spike.** (Done 2026-10-11.) Generate a read-only swimlane map from a hard-coded activity list: lanes by role, columns by sequence, decision branches, section labels, click-for-details. Try dagre first. Test forward and backward branches. If loops draw badly, keep decisions forward-only and report back before continuing.
2. **Data model and mock API.** (Done in the mock 2026-10-11, together with step 3.) Activity lists per section, role library, systems list, `ChangeLogEntry`, `ProcessReview`, Expert and folder defaults, change descriptions, new lint rules. Rewrite the acceptance tests. Then extraction and skeleton for the Django `process/` app once the repo is available.
3. **Outline editor.** (Done 2026-10-11, not yet browser-tested.) One editor per section with live map preview; other sections locked and read-only; autosave; 409 conflicts.
4. **Approval flow.** `PROCESS_MAP` feature, map lint, `version/submit`, snapshot, approve and reject, reopen, new-version cloning.
5. **Viewer, feedback and review loop.** Map and Procedure tabs, step-anchored feedback with response-required and resolve, search, PDF/PNG export, change log, review due dates and "Mark as reviewed", dashboard views.
6. **Seed data and the acceptance scenario** from `MVP_SPEC.md` section 15, then fix gaps.

## Working agreement

- For anything touching more than one app or model, **propose a short plan first** and wait for a go-ahead.
- Keep commits small, one logical change each, and mention which build-order step they belong to.
- When you finish a step, say what you changed, what you tested, and what you decided without asking.
- Never invent requirements. If `MVP_SPEC.md` is silent, ask.
