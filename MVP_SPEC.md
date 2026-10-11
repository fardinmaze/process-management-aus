# MVP_SPEC.md: Process Maps (working title)

Source of truth for the MVP. `CLAUDE.md` holds the working rules; this file holds the product definition. If the two disagree, this file wins for product behaviour and `CLAUDE.md` wins for how to work.

---

## 1. Purpose and context

A collaborative process-mapping platform with two surfaces:

- **Authoring app**: owners initiate a process map, split it into sections, allocate sections to contributors, and take the result through two approval gates.
- **Portal**: a read-only place where published maps are browsed, searched, exported and commented on.

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
OWNER creates a map: title, description, folder, visibility (`INTERNAL` by default, or `PUBLIC`), review interval. The system creates **version 1** in status `PLANNING`. The creator becomes the map's owner.

### 3.2 Plan and allocate
In `PLANNING` the owner:
- defines **sections** (title, description, order, optional due date). Each is a named frame on the canvas.
- assigns each section to a CONTRIBUTOR (the owner may assign themselves).
- optionally uploads briefing documents.

**Kick off** moves the version to `IN_PROGRESS` and notifies assignees. Every section must have an assignee to kick off.

### 3.3 Contribute in parallel
Each contributor opens the canvas and sees the whole map, but only their own section frames are editable. Others are visibly locked and read-only. Inside their section they use the shape library, attach supporting documents to the section or a step, and comment. Changes autosave. The canvas polls every 30 seconds to refresh other sections read-only. There is no real-time co-editing.

### 3.4 Submit a section
The contributor submits their section. It becomes `SUBMITTED` and the owner is notified. Submission is blocked while the section has open `REVISION` comments.

### 3.5 Gate 1: owner reviews each section
For each submitted section the owner either:
- **approves** it, which locks it as `APPROVED`, or
- **requests changes** with a required note. The section returns to the contributor and a `REVISION` comment is created.

Gate 1 is lightweight and is **not** the approval chain.

### 3.6 Assemble and submit for publication
When every section is `APPROVED`, the owner runs the **map lint** and clicks *Submit for publication*.

- **Blocking:** at least one `start` node, at least one `end` node, no dangling cross-section edges, no open `REVISION` comments.
- **Warnings:** orphan nodes, decision nodes with fewer than two outgoing edges, steps with no label.

On submit the system stores an immutable `graph_snapshot` of the assembled map. The version becomes `IN_REVIEW` and an approval instance is created through the **approval chain** (feature code `PROCESS_MAP`). If the chain is disabled for this feature, the version publishes directly.

### 3.7 Gate 2: approver review
Approvers named in the chain review the assembled, read-only map and can comment on any section or step. Each stage resolves per its rule (`ANY_ONE` or `ALL`).

- **Approved:** the version becomes `PUBLISHED`. The previous published version becomes `SUPERSEDED`. The map appears in the portal according to its visibility, the search text is rebuilt, and the team is notified.
- **Rejected:** a note is required. The version becomes `CHANGES_REQUESTED` and **goes back to the owner**. The owner reopens one or more sections (reassigning if needed), and those sections return to `ASSIGNED` and loop through 3.3 to 3.7. Sections not reopened stay `APPROVED`.

### 3.8 Portal
Viewers browse by folder, search, open published maps read-only, expand section frames, open step details, view documents marked portal-visible, export PDF or PNG, and send **feedback**. Feedback creates a `FEEDBACK` comment and notifies the owner. Maps with visibility `INTERNAL` need a login. Maps with `PUBLIC` do not. Feedback always needs a login.

### 3.9 Revising a published map
The owner creates a new version with a required change note. It starts in `PLANNING`, with all sections cloned as `APPROVED` and assignees retained. The owner chooses which sections to reopen, then kicks off. The old version stays live in the portal until the new one is approved. A map has at most one non-terminal version at a time.

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
- Sections can be added in `PLANNING`, `IN_PROGRESS` and `CHANGES_REQUESTED`. They can be deleted only when they contain no nodes.

---

## 5. Canvas

Built with **Vue 3 + Vue Flow** (`@vue-flow/core`).

### Layout
- Left: shape library. Top: undo, redo, zoom, fit view, save status, *Submit section*. Right: tabs for **Details**, **Comments**, **Documents**.
- Each section is a Vue Flow **parent (group) node**: a labelled frame showing assignee and status chip. Step nodes use `parentNode` = the section frame and `extent: 'parent'`.
- Frames the user may not edit are greyed out, with nodes non-draggable, non-connectable and non-deletable. **This is also enforced server-side. Never rely on the client.**

### Shape library (closed set for the MVP)
| Type | Purpose |
|---|---|
| `start` / `end` | Entry and exit |
| `task` | A process step |
| `decision` | Branching, with edge labels |
| `subprocess` | Reference to another published map (`data.linked_map_id`). A link only, no drill-down. |
| `document` | Reference to an attachment |
| `note` | Free text |

Swimlanes are **not** in the MVP. Sections provide the structure, and each step carries a responsible-role field.

### Graph JSON (stored per section)
```json
{
  "schema_version": 1,
  "nodes": [
    {
      "id": "n_<uuid>",
      "type": "task",
      "position": { "x": 40, "y": 60 },
      "data": {
        "label": "",
        "description": "",
        "role": "",
        "system": "",
        "duration_minutes": null,
        "attachment_ids": [],
        "linked_map_id": null
      }
    }
  ],
  "edges": [
    { "id": "e_<uuid>", "source": "n_...", "target": "n_...", "label": "" }
  ]
}
```
- Node ids are unique across the whole map (UUIDs), so edges can cross sections.
- An edge is **stored in its source node's section**. The target may be a node in another section. A contributor may therefore connect their step to another section's step.
- Deleting a node that other sections' edges reference is blocked, and the error lists the referencing sections.
- Section frame geometry (`x`, `y`, `width`, `height`) lives on `MapSection.frame`. Step positions are relative to the frame.
- `ProcessMapVersion.graph_snapshot` is the merged, assembled graph taken at submit. The portal and the Gate 2 review render from the snapshot.

### Conflicts
Each section has an integer `revision`. `section/save` sends the revision it loaded and receives `409` on mismatch. There is a soft "opened by X" indicator, not a hard lock.

---

## 6. Data model

All tables are new unless marked *(reuse)*.

- **User** *(reuse)* plus `roles` (multi-role). Use whatever the extracted RBAC supports. A user must be able to hold more than one role.
- **Invitation**: email, role, invited_by, token, status (`PENDING`, `ACCEPTED`, `EXPIRED`, `REVOKED`), expires_at, optional map FK, accepted_user.
- **Folder**: name, parent (self FK). Repository categories, for example HR or Finance. There are no workspaces in the MVP.
- **ProcessMap**: code (`PM-{abbr}-{id}`, same pattern as the source ERP's project id), title, description, folder, owner FK, visibility (`INTERNAL`, `PUBLIC`), tags (JSON), current_published_version FK null, open_version FK null, review_interval_days, next_review_due, views_count, is_archived, search_text.
- **MapTeamMember** *(adapted from the project team-member model)*: map, user, is_owner. Contributors are added automatically when assigned a section.
- **ProcessMapVersion**: map, version_no, status, change_note, graph_snapshot (JSON, null until submit), schema_version, based_on_version FK null, created_by, kicked_off_at, submitted_at, published_at.
- **MapSection**: version, title, description, order, frame (JSON), assignee FK null, status, graph (JSON), revision (int), due_date, submitted_at, approved_by, approved_at.
- **SectionDecision**: section, reviewer, decision (`APPROVED`, `CHANGES_REQUESTED`), note, created_at.
- **MapComment**: map, version, section FK null, node_id null, parent null, kind (`COMMENT`, `REVISION`, `FEEDBACK`), body, author, status (`OPEN`, `RESOLVED`), resolved_by, resolved_at.
- **MapAttachment** *(adapted from the project attachments model)*: map, version, section FK null, node_id null, file, og_title, attach_title, category, visibility (`INTERNAL`, `PORTAL`, default `INTERNAL`), uploaded_by.
- **Approval chain tables** *(reuse)*: `ApprovalFeature` code `PROCESS_MAP`, `ApprovalChain`, `ApprovalStage`, `StageApprover`, `ApprovalInstance` (GFK to **ProcessMapVersion**), `StageAction`.
- **ActivityLog** *(reuse)* and **Notification** *(reuse)*.

**Dropped from the extracted project module:** clients, deliverables, task clock-in/out and time tracking, tasks and subtasks. Sections replace tasks.

---

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
| Edit section content | | if assigned | if assigned | | |
| Submit a section | | if assigned | if assigned | | |
| Approve or request changes on a section (Gate 1) | ✓ | own maps | | | |
| Approve or reject a version (Gate 2) | | | | ✓ if a pending approver, and not the submitter | |
| Comment inside authoring (`COMMENT`) | ✓ | own maps | map team | during `IN_REVIEW` | |
| Add `REVISION` comments | ✓ | own maps | | ✓ | |
| View unpublished map | ✓ | own maps | map team | during `IN_REVIEW` | |
| View published map in portal | ✓ | ✓ | ✓ | ✓ | ✓ (and anonymous for `PUBLIC`) |
| Send portal `FEEDBACK` | ✓ | ✓ | ✓ | ✓ | ✓ (login required) |

---

## 9. API surface

Conventions follow the source ERP: function-based DRF views (`@api_view`, `@permission_classes`), `{code, response, data}` responses, `log_activity` on every state change, `APPEND_SLASH=False`, **no trailing slashes**. App name: `process`.

```
invitation/create | list | revoke/<pk> | resend/<pk> | accept        (accept: public, by token)
folder/create | list | edit/<pk> | delete/<pk>
map/create | list | detail/<pk> | edit/<pk> | archive/<pk>
version/create-draft/<map_id> | kickoff/<pk> | submit/<pk> | approve/<pk> | reject/<pk>
        | reopen/<pk> | list/<map_id> | detail/<pk>
section/create | edit/<pk> | assign/<pk> | delete/<pk> | save/<pk> | submit/<pk>
        | approve/<pk> | request-changes/<pk> | my-assignments
comment/create | list/<map_id> | resolve/<pk>
attachment/upload | list/<map_id> | delete/<pk> | toggle-portal/<pk>
portal/map/list | map/detail/<pk> | search | feedback/create
dashboard/summary
```
Reused from the approval app: `approval-chain/preset-list/PROCESS_MAP` and `approval-chain/instance/state/PROCESS_MAP/<version_id>`.

`portal/*` is `AllowAny` only for `PUBLIC` maps. Otherwise it requires authentication. It serves **only** `PUBLISHED` versions from `graph_snapshot`.

---

## 10. Frontend structure

Authoring app: `/login`, `/invite/accept/:token`, `/dashboard`, `/maps` (repository), `/maps/new`, `/maps/:id` (overview: sections board, team, documents, comments, activity), `/maps/:id/canvas`, `/my-work` (assigned sections), `/reviews` (approver inbox), `/admin/users`, `/admin/invitations`, `/admin/folders`, `/admin/approval-chain`.

Portal (separate layout, no authoring chrome): `/portal`, `/portal/maps/:id`.

Dashboards: OWNER sees own maps by status and sections awaiting their approval. APPROVER sees pending reviews. ADMIN sees totals by status, reviews overdue (computed at query time), open feedback, most viewed.

---

## 11. Notifications and activity log

Both fire on: invitation sent or accepted, section assigned, kickoff, section submitted, section approved, changes requested (section), map submitted for publication, approval stage reached or approved, rejected (with note), published, `FEEDBACK` received, `REVISION` comment added, new version created. Activity-log actions record user, object, old and new status.

---

## 12. Search

Full-text over `ProcessMap.search_text`, built at publish from title, description, tags, step labels, descriptions, roles and systems. Use database full-text. No external search service.

---

## 13. Export

Single map, **client-side**: PDF and PNG from the portal view (`html-to-image` + `jspdf`). Bulk, BPMN, XML and XPS are post-MVP.

---

## 14. Out of scope for the MVP

Swimlanes, SSO and Active Directory sync, BPMN / XML / XPS export, bulk export, AI features, import from other tools, version compare, scheduled reminder emails and scheduled reports, mobile viewer, real-time co-editing, sub-process drill-down, templates, workspace-level permissions, multi-tenancy, role-based stage approvers.

Hard rule while building: **do not add third-party services that send customer data outside Australia** (analytics, hosted AI APIs, external CDNs in the portal).

---

## 15. Acceptance scenario (the demo)

Seed data: one ADMIN, one OWNER (HR), two CONTRIBUTORS (HR, IT), one APPROVER, one VIEWER.

1. ADMIN invites the OWNER. The OWNER accepts and logs in.
2. OWNER invites two CONTRIBUTORS, creates **New Employee Onboarding** in the HR folder, defines sections *HR admin*, *IT setup*, *Line manager tasks*, assigns them, and kicks off.
3. The two CONTRIBUTORS edit different sections at the same time. Each sees the others' frames locked. One attaches a checklist document and leaves a step comment.
4. Both submit. The OWNER requests changes on *IT setup* with a note, the contributor fixes it and resubmits, and the OWNER approves all three.
5. OWNER runs map lint (one warning is shown), then submits for publication.
6. APPROVER rejects once with a note. The version returns to the OWNER, who reopens *Line manager tasks*. It is fixed, re-approved and resubmitted. The APPROVER approves and the map is `PUBLISHED`.
7. VIEWER opens the portal, finds the map by search, opens it read-only, exports a PDF and sends feedback. The OWNER is notified.
8. OWNER creates version 2 with a change note, reopens one section, and the portal keeps showing version 1 until version 2 is approved.

Done when every step above works through the UI with the permission checks enforced server-side (verify each denied action returns an error from the API, not only a hidden button).

---

## 16. Open questions (confirm before building the affected part)

1. **Gate 2 rejection returns to the owner**, who reopens sections. Confirm that this is the intended meaning of "goes back to the owner".
2. **Public portal**: confirm whether the Council's portal is login-only (default `INTERNAL`) or also needs anonymous `PUBLIC` maps.
3. **Owner approving their own section** is allowed (Gate 2 is the independent check). Confirm.
4. **Roles per user**: confirm a user can hold several global roles, for example OWNER and APPROVER.
