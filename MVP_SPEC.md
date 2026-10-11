# MVP_SPEC.md: Process Maps (working title)

Source of truth for the MVP. `CLAUDE.md` holds the working rules; this file holds the product definition. If the two disagree, this file wins for product behaviour and `CLAUDE.md` wins for how to work.

---

## 1. Purpose and context

A collaborative process-mapping platform with two surfaces:

- **Authoring app**: owners initiate a process map, split it into sections, allocate sections to contributors, and take the result through two approval gates. Contributors write sections as **outlines** (activities, tasks, roles); the system draws the swimlane map.
- **Published viewer**: a read-only, login-only place where published maps are browsed, searched, exported and commented on, with a Map tab and a Procedure tab.

**Why now:** Ipswich City Council's REOI 260908-000054 (Process Mapping Solution). It is a market-sounding exercise. It closes 5pm 13 Oct 2026, and a Request for Tender may follow around January 2027. The MVP goal is a **working end-to-end demo** of the flow in section 3, not a production rollout.

**Not embedded in Smicee.** This is a standalone codebase seeded from modules extracted from the Smicee ERP (approval chain, project management, activity log, supporting documents, role-based access). Those modules are customised and blended, and anything the MVP does not need is stripped out.

**Deployment model:** single-tenant, one instance per customer. The Council instance must run in an Australian region with all customer data stored onshore. This is a mandatory requirement of the REOI.

---

## 2. Roles

A user holds one or more global roles. Per-map involvement (owner, contributor on a section) is assigned on top of the role.

| Role | Can do |
|---|---|
| **ADMIN** | Manage users, invitations, roles, folders, approval chain configuration. Can act as owner on any map. |
| **OWNER** | Initiate maps, define and allocate sections, approve or reject sections, submit maps for publication, create new versions. Invite contributors and viewers. |
| **CONTRIBUTOR** | Edit only the sections allocated to them. Comment, attach documents, submit sections. |
| **APPROVER** | Final approval of assembled maps, via the approval chain. Cannot approve a map they submitted. |
| **VIEWER** | Read-only access to published maps in the portal. Can send feedback. Consumes no paid seat. |

Licence tiers follow roles: ADMIN, OWNER, CONTRIBUTOR and APPROVER are paid seats. VIEWER is free and unlimited.

---

## 3. End-to-end flow

### 3.0 Invitation and login
1. ADMIN (any role) or OWNER (CONTRIBUTOR and VIEWER only) invites a user by email with a role, optionally into a specific map's team.
2. The invitee opens the emailed link (token, expires in 7 days), sets a password and profile, and lands on a role-appropriate home. ADMIN, OWNER, CONTRIBUTOR and APPROVER land in the authoring app. VIEWER lands in the portal.

### 3.1 Initiate
OWNER creates a map: title, objective, description, folder, **Expert** (optional; the person who looks after the map day to day), visibility (`INTERNAL` by default), review interval. The folder supplies default owner, approvers and members. The system creates **version 1** in status `PLANNING`. The creator becomes the map's owner. The Expert is a field and a default approver only. Editing rights come solely from section allocation.

### 3.2 Plan and allocate
In `PLANNING` the owner:
- defines **sections** (title, description, order, optional due date). Each holds a list of activities.
- assigns each section to a CONTRIBUTOR (the owner may assign themselves).
- optionally uploads briefing documents.

**Kick off** moves the version to `IN_PROGRESS` and notifies assignees. Every section must have an assignee to kick off.

### 3.3 Contribute in parallel
Each contributor opens the outline editor and writes their section: activities, each with tasks, a role (the lane), a system, notes and documents. Decisions have Yes and No branches. A live preview shows the generated map of the whole process. Other sections are visibly locked and read-only. Contributors can attach documents to the section or an activity, and comment. Changes autosave. The page polls every 30 seconds to refresh other sections. Several contributors edit different sections in parallel, which Nintex does not offer.

### 3.4 Submit a section
The contributor submits their section with a required **change description**. It becomes `SUBMITTED`, a change-log entry is written and the owner is notified. Submission is blocked while the section has open `REVISION` comments.

### 3.5 Gate 1: owner reviews each section
For each submitted section the owner either:
- **approves** it, which locks it as `APPROVED`, or
- **requests changes** with a required note. The section returns to the contributor and a `REVISION` comment is created.

Gate 1 is lightweight and is **not** the approval chain.

### 3.6 Assemble and submit for publication
When every section is `APPROVED`, the owner runs the **map lint** and clicks *Submit for publication*, entering a required change description.

- **Blocking:** every activity has a role, every decision has both branches, no dangling targets, no open `REVISION` comments.
- **Warnings:** activities with no tasks, activities with no label.

On submit the system stores an immutable `snapshot` of the assembled map and adds a change-log entry. The version becomes `IN_REVIEW` and an approval instance is created through the **approval chain** (feature code `PROCESS_MAP`). If the chain is disabled for this feature, the version publishes directly.

### 3.7 Gate 2: approver review
Approvers named in the chain review the assembled, read-only map and can comment on any section or step. Each stage resolves per its rule (`ANY_ONE` or `ALL`).

- **Approved:** the version becomes `PUBLISHED`. The previous published version becomes `SUPERSEDED`. The map appears in the portal according to its visibility, the search text is rebuilt, and the team is notified.
- **Rejected:** a note is required. The version becomes `CHANGES_REQUESTED` and **goes back to the owner**. The owner reopens one or more sections (reassigning if needed), and those sections return to `ASSIGNED` and loop through 3.3 to 3.7. Sections not reopened stay `APPROVED`.

### 3.8 Published viewer
Viewers browse by folder, search (maps, roles, systems), open published maps read-only, and switch between the **Map** tab and the **Procedure** tab. Clicking an activity shows its tasks, notes and portal-visible documents. They can export PDF or PNG of the map and send **feedback** anchored to an activity or to the map in general. Feedback records the version, creates a `FEEDBACK` comment, optionally marked *response required*, and notifies the owner. Threads can be replied to, resolved and unresolved by the owner or Expert. Feedback always needs a login. Anonymous and permalink access is not built.

### 3.9 Revising a published map
The owner creates a new version with a required change note. It starts in `PLANNING`, with all sections cloned as `APPROVED` and assignees retained. The owner chooses which sections to reopen, then kicks off. The old version stays live in the viewer until the new one is approved. A map has at most one non-terminal version at a time.

### 3.10 Review cycle
Each map has a review interval. `next_review_due` is computed from the last publish or review. Owners (and the Expert) see maps due or overdue on the dashboard (yellow when close, red when overdue), computed at query time. They either open the map and create a new version, or choose **Mark as reviewed** with a note. Marking as reviewed writes a `ProcessReview` row, moves the next review date forward and creates no new version.

---

## 4. State machines

### Version status
```
PLANNING --kickoff--> IN_PROGRESS --submit (all sections APPROVED)--> IN_REVIEW
IN_REVIEW --chain approved--> PUBLISHED (previous PUBLISHED -> SUPERSEDED)
IN_REVIEW --chain rejected--> CHANGES_REQUESTED --reopen sections--> IN_PROGRESS
```
- Section content is editable only while the version is `IN_PROGRESS`, and only in non-`APPROVED` sections.
- `IN_REVIEW`, `PUBLISHED` and `SUPERSEDED` versions are immutable.
- On a rejection, only the owner can reopen sections. Reopening requires at least one section.

### Section status
```
UNASSIGNED --assign--> ASSIGNED --first save--> IN_PROGRESS --submit--> SUBMITTED
SUBMITTED --owner approves--> APPROVED
SUBMITTED --owner requests changes--> CHANGES_REQUESTED --next save--> IN_PROGRESS
APPROVED --owner reopens (new draft or Gate 2 rejection)--> ASSIGNED
```
- An owner can approve a section they authored. Gate 2 provides the independent check, and the activity log records it.
- Sections can be added in `PLANNING`, `IN_PROGRESS` and `CHANGES_REQUESTED`. They can be deleted only when they contain no activities.

---

## 5. Outline editor and generated map

Replaces the earlier free-form Vue Flow canvas (decision recorded 2026-10-11, based on the Nintex Process Manager UX analysis in `public/`). Authors write a process as structured text. The system draws a read-only swimlane map. Nobody drags boxes or arrows, so nobody can draw a bad diagram.

### Outline editor (`/maps/:id/edit`)
- Left: the outline. The user's own section is editable. Other sections appear in order, collapsed, locked and read-only, with assignee and status chip.
- Right: tabs for **Map** (live preview of the whole generated map), **Comments**, **Documents**. Top: save status, *Submit section*.
- Changes autosave. The page polls every 30 seconds to refresh other sections. There is no real-time co-editing.
- Locked sections are enforced server-side. Never rely on the client.

### Section content (stored per section as `activities`)
```json
{
  "schema_version": 2,
  "activities": [
    {
      "id": "a_<uuid>",
      "kind": "activity",
      "label": "Create employee record",
      "role_id": 3,
      "system_id": 1,
      "tasks": [{ "id": "t_<uuid>", "text": "Enter start date and salary" }],
      "notes": "",
      "attachment_ids": [],
      "linked_map_id": null
    },
    {
      "id": "a_<uuid>",
      "kind": "decision",
      "label": "Is background check clear?",
      "yes": "a_<uuid>",
      "no": "a_<uuid>"
    }
  ]
}
```
- **Flow follows list order.** There are no stored coordinates and no free-form edges. Decisions name explicit targets (`yes`, `no`), which may be any later activity id in the map, including another section's. A null target means "continue to the next item". An activity may also carry an optional `next` (a later activity id, or `END`) so that a side branch can finish or jump instead of flowing into the item below it. Added after the layout spike, 2026-10-11.
- Start and end are implicit: the first item is the start, and an item with nothing after it is an end.
- Activity ids are unique across the whole map (UUIDs). Never reuse an id.
- Deleting an activity that any decision references is blocked, and the error lists the referencing sections.
- **Guard rules:** a decision cannot be the first item in the map. Every activity has a role. Decision targets must be **forward** of the decision in map order (no loops in the MVP; revisit after the layout spike).
- `linked_map_id` is a link to another published map. A link only, no drill-down.
- `ProcessMapVersion.snapshot` is the merged, ordered activity list taken at submit. The viewer and the Gate 2 review render from the snapshot.

### Generated map
- Lanes are the roles used in the map, in order of first appearance. Columns follow sequence. Each activity carries a small section label. A system icon shows when the step is done by a system.
- Rendered read-only with Vue Flow, with positions computed by a layout algorithm (dagre, via `@dagrejs/dagre`; built as the layout spike and now used by the editor preview and the published viewer). Clicking an activity opens a pop-up with tasks, notes and documents.
- **The layout spike is the first build step.** If loops or branches draw badly, decisions stay forward-only.

### Conflicts
Each section has an integer `revision`. `section/save` sends the revision it loaded and receives `409` on mismatch. There is a soft "opened by X" indicator, not a hard lock.

## 6. Data model

All tables are new unless marked *(reuse)*.

- **User** *(reuse)* plus `roles` (multi-role). A user must be able to hold more than one role.
- **Invitation**: email, role, invited_by, token, status (`PENDING`, `ACCEPTED`, `EXPIRED`, `REVOKED`), expires_at, optional map FK, accepted_user.
- **Folder** (the Nintex "process group"): name, parent (self FK), default_expert FK null, default_members (users). New maps inherit these. Approvers come from the single `PROCESS_MAP` approval chain, not per folder (decision taken while building the mock, 2026-10-11). There are no workspaces in the MVP.
- **ProcessRole** (the lane library): name, description, is_active. **ProcessSystem**: name, is_active. Activities reference these by id, not free text.
- **ProcessMap**: code (`PM-{abbr}-{id}`), title, description, objective, folder, owner FK, expert FK null, visibility (`INTERNAL`; the field is kept but `PUBLIC` is not served), tags (JSON), current_published_version FK null, open_version FK null, review_interval_days, last_reviewed_at, next_review_due, views_count, is_archived, search_text.
- **MapTeamMember** *(adapted from the project team-member model)*: map, user, is_owner. Contributors are added automatically when assigned a section.
- **ProcessMapVersion**: map, version_no (published whole numbers; in-progress work displays as a draft of the next number), status, change_note, snapshot (JSON, null until submit), schema_version, based_on_version FK null, created_by, kicked_off_at, submitted_at, published_at.
- **MapSection**: version, title, description, order, assignee FK null, status, activities (JSON, see section 5), revision (int), due_date, last_change_description, submitted_at, approved_by, approved_at.
- **SectionDecision**: section, reviewer, decision (`APPROVED`, `CHANGES_REQUESTED`), note, created_at.
- **Change log**: in the mock it is derived from the activity log (the change description is the activity note), not a separate table. A real `ChangeLogEntry` table (version, section FK null, kind, description, author, created_at) is still the plan for Django. Approver status on a map entry is read from the approval instance.
- **ProcessReview**: map, version, reviewed_by, note, reviewed_at. Written by "Mark as reviewed". It does not create a version.
- **MapComment**: map, version, section FK null, activity_id null, parent null, kind (`COMMENT`, `REVISION`, `FEEDBACK`), body, author, response_required (bool), status (`OPEN`, `RESOLVED`), resolved_by, resolved_at.
- **MapAttachment** *(adapted from the project attachments model)*: map, version, section FK null, activity_id null, file, og_title, attach_title, category, visibility (`INTERNAL`, `PORTAL`, default `INTERNAL`), uploaded_by.
- **Approval chain tables** *(reuse)*: `ApprovalFeature` code `PROCESS_MAP`, `ApprovalChain`, `ApprovalStage`, `StageApprover`, `ApprovalInstance` (GFK to **ProcessMapVersion**), `StageAction`.
- **ActivityLog** *(reuse)* and **Notification** *(reuse)*.

**Dropped from the extracted project module:** clients, deliverables, task clock-in/out and time tracking, tasks and subtasks. Sections replace tasks.

## 7. Approval chain: required changes

- Register `PROCESS_MAP` as an `ApprovalFeature`. The approval instance targets a **version**, never the map, so in-flight reviews cannot be affected by later edits.
- Business-module pattern as in the source ERP: this app's own `version/approve` and `version/reject` endpoints call the internal helpers `create_instance`, `record_action` and `get_pending_approvers`. The chain app never exposes approve or reject itself.
- **Self-approval guard (new):** `get_pending_approvers` must exclude the user who submitted the version.
- Stage approvers are static users in the MVP. Role-based stage approvers are post-MVP.
- Guard: while the chain is enabled, `version/submit` never publishes directly. Publication happens only when the instance completes.

---

## 8. Permissions

Every check is enforced **server-side**.

| Action | ADMIN | OWNER | CONTRIBUTOR | APPROVER | VIEWER |
|---|---|---|---|---|---|
| Invite users | any role | CONTRIBUTOR, VIEWER | | | |
| Manage folders, chain config | ✓ | | | | |
| Initiate a map | ✓ | ✓ | | | |
| Define, assign, delete sections; kick off; reopen; submit for publication; create new version | ✓ | own maps | | | |
| Edit section content | | any section of own maps (while IN_PROGRESS), or if assigned | if assigned | | |
| Submit a section | | if assigned | if assigned | | |
| Approve or request changes on a section (Gate 1) | ✓ | own maps | | | |
| Approve or reject a version (Gate 2) | | | | ✓ if a pending approver, and not the submitter | |
| Comment inside authoring (`COMMENT`) | ✓ | own maps | map team | during `IN_REVIEW` | |
| Add `REVISION` comments | ✓ | own maps | | ✓ | |
| View unpublished map | ✓ | own maps | map team | during `IN_REVIEW` | |
| Mark a published map as reviewed | ✓ | own maps (and Expert) | | | |
| View published map in portal | ✓ | ✓ | ✓ | ✓ | ✓ (and anonymous for `PUBLIC`) |
| Send portal `FEEDBACK` | ✓ | ✓ | ✓ | ✓ | ✓ (login required) |

---

## 9. API surface

Conventions follow the source ERP: function-based DRF views (`@api_view`, `@permission_classes`), `{code, response, data}` responses, `log_activity` on every state change, `APPEND_SLASH=False`, **no trailing slashes**. App name: `process`.

```
invitation/create | list | revoke/<pk> | resend/<pk> | accept        (accept: public, by token)
folder/create | list | edit/<pk> | delete/<pk>                       (folder carries default owner, approvers, members)
role/create | list | edit/<pk> | delete/<pk>                         (role library = lanes)
system/create | list | edit/<pk> | delete/<pk>
map/create | list | detail/<pk> | edit/<pk> | archive/<pk> | mark-reviewed/<pk> | review-list
version/create-draft/<map_id> | kickoff/<pk> | submit/<pk> | approve/<pk> | reject/<pk>
        | reopen/<pk> | list/<map_id> | detail/<pk> | change-log/<map_id>
section/create | edit/<pk> | assign/<pk> | delete/<pk> | save/<pk> | submit/<pk>
        | approve/<pk> | request-changes/<pk> | my-assignments
comment/create | list/<map_id> | resolve/<pk> | reopen/<pk>
attachment/upload | list/<map_id> | delete/<pk> | toggle-portal/<pk>
portal/map/list | map/detail/<pk> | search | feedback/create
dashboard/summary
```
`section/save` accepts an optional `change_description`; `section/submit` and `version/submit` require one. Reused from the approval app: `approval-chain/preset-list/PROCESS_MAP` and `approval-chain/instance/state/PROCESS_MAP/<version_id>`.

The portal requires authentication. It serves **only** `PUBLISHED` versions from `snapshot`.

## 10. Frontend structure

Authoring app: `/login`, `/invite/accept/:token`, `/dashboard`, `/maps` (repository), `/maps/new`, `/maps/:id` (overview: sections board, team, documents, comments, change log, activity), `/maps/:id/edit` (outline editor with live map preview), `/my-work` (assigned sections), `/reviews` (approver inbox), `/admin/users`, `/admin/invitations`, `/admin/folders`, `/admin/roles-systems`, `/admin/approval-chain`, `/admin/activity`.

Published viewer (login-only, inside the app shell): `/published`, `/published/:id` with **Map** and **Procedure** tabs.

Dashboards: OWNER sees **My Changes** (own maps by status, sections awaiting approval) and **Reviews** (maps due or overdue for review). CONTRIBUTOR sees assigned sections and **My Feedback** replies. APPROVER sees pending reviews. ADMIN sees totals by status, reviews overdue, open feedback, most viewed.

## 11. Notifications and activity log

Both fire on: invitation sent or accepted, section assigned, kickoff, section submitted, section approved, changes requested (section), map submitted for publication, approval stage reached or approved, rejected (with note), published, `FEEDBACK` received, feedback reply or resolution, `REVISION` comment added, new version created, map marked reviewed. Review due soon or overdue is shown on the dashboard and computed at query time. Activity-log actions record user, object, old and new status.

## 12. Search

Full-text over `ProcessMap.search_text`, built at publish from title, description, tags, activity labels, task text, notes, roles and systems. Results can be filtered or browsed by folder, role and system. Use database full-text. No external search service.

## 13. Export

Single map, **client-side**: PDF and PNG of the generated map from the published viewer (`html-to-image` + `jspdf`). The Procedure tab prints through the browser. Bulk, BPMN, XML and XPS are post-MVP.

## 14. Out of scope for the MVP

Free-form drawing canvas, manual swimlane layout, SSO and Active Directory sync, BPMN / XML / XPS export, bulk export, AI draft generation, import from other tools, process capture, version compare, scheduled reminder emails and scheduled reports, mobile app, real-time co-editing, sub-process drill-down, templates, workspace-level permissions, multi-tenancy, role-based stage approvers, a separate publisher role, RACI and cost fields, anonymous or permalink access (Nintex "Minimode" links are deliberately not copied).

Hard rule while building: **do not add third-party services that send customer data outside Australia** (analytics, hosted AI APIs, external CDNs in the portal).

See `BACKLOG.md` for what is planned after the MVP.

## 15. Acceptance scenario (the demo)

Seed data: one ADMIN, one OWNER (HR), two CONTRIBUTORS (HR, IT), one APPROVER, one VIEWER. A role library (HR Officer, IT Support, Line Manager, Payroll) and a systems list (HRIS, Service Desk).

1. ADMIN invites the OWNER. The OWNER accepts and logs in.
2. OWNER invites two CONTRIBUTORS, creates **New Employee Onboarding** in the HR folder (naming an Expert), defines sections *HR admin*, *IT setup*, *Line manager tasks*, assigns them, and kicks off.
3. The two CONTRIBUTORS write different sections at the same time as outlines (activities, tasks, role, system, notes, a decision with Yes and No). Each sees the generated map preview, with the other sections locked and read-only. One attaches a checklist and leaves a step comment.
4. Both submit, each with a change description. The OWNER requests changes on *IT setup* with a note, the contributor fixes it and resubmits, and the OWNER approves all three.
5. OWNER runs map lint (one warning is shown), then submits for publication with a change description.
6. APPROVER rejects once with a note. The version returns to the OWNER, who reopens *Line manager tasks*. It is fixed, re-approved and resubmitted. The APPROVER approves and the map is `PUBLISHED`.
7. VIEWER opens the published viewer, finds the map by search, sees the Map and Procedure tabs, opens an activity, exports a PDF and sends feedback on that activity (response required). The OWNER is notified and replies, and the VIEWER's thread is resolved.
8. OWNER creates version 2 with a change note, reopens one section, and the viewer keeps showing version 1 until version 2 is approved.
9. The review date arrives. OWNER sees it on the dashboard, opens the map and chooses **Mark as reviewed** with a note. No new version is created and the next review date moves forward.

Done when every step above works through the UI with the permission checks enforced server-side (verify each denied action returns an error from the API, not only a hidden button).

## 16. Open questions (confirm before building the affected part)

1. **Gate 2 rejection returns to the owner**, who reopens sections. Confirm that this is the intended meaning of "goes back to the owner".
2. **Public portal**: dropped from the MVP (login-only viewer). Confirm.
3. **Owner approving their own section** is allowed (Gate 2 is the independent check). Confirm.
4. **Roles per user**: a user can hold several global roles. Confirm.
5. **Expert**: the map's Expert is a field and a default approver only. Editing rights come solely from section allocation. Confirm.
6. **Decision branches**: forward-only in the MVP, pending the layout spike (see section 5). Confirm, or allow loops if the spike shows they draw cleanly.
7. **Separate publisher step** (Nintex style): not in the MVP, Gate 2 approval auto-publishes. Confirm the Council does not need a release-control step.
8. **Review cadence**: is the review interval set per map only, or does a site-wide default apply too (Nintex has both)?
