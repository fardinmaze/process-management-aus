# Process Maps: Project Documentation

Working title: **Process Maps**. A collaborative process-mapping platform for councils and other public-sector organisations. Teams write how work gets done as simple outlines. The system draws the swimlane map, takes it through two approval gates, and publishes it to a searchable viewer.

Status as of 2026-10-11: working end-to-end demo against an in-browser mock backend. 86 API-level checks and 37 headless-browser checks pass. The Django backend is not started. See [`PROGRESS.md`](PROGRESS.md) for the live status and [`MVP_SPEC.md`](MVP_SPEC.md) for the product definition.

---

## 1. Overview

### 1.1 The problem
Process documentation usually has one author drawing boxes and arrows in a diagramming tool, with no real review trail. Maps end up inconsistent, go stale, and are hard for non-specialists to produce. Public-sector buyers also need governance and approvals, and they need customer data to stay in Australia.

### 1.2 The idea
- **Write, don't draw.** Contributors write a process as an outline: activities, each with tasks, a role (the swimlane), a system, notes and documents. Decisions have Yes and No branches. Nobody drags boxes or arrows, so nobody can draw a bad diagram. This matches the "no BPMN experience needed" wording of the tender.
- **Parallel authoring.** A map is split into sections. Each section is allocated to a contributor, and several contributors work at the same time on different sections.
- **Two approval gates.** The owner approves each section (Gate 1). A configurable approval chain approves the assembled map (Gate 2).
- **Publish and maintain.** Approved maps are frozen as an immutable snapshot, published to a read-only viewer, and reviewed on a schedule.

### 1.3 Origin
Built as a demo for Ipswich City Council's REOI 260908-000054 (Process Mapping Solution; closes 13 Oct 2026, with a possible tender around January 2027). The model is informed by an analysis of Nintex Process Manager (`public/Nintex Process Manager UX Flow Analysis.md`). We copy its outline-first authoring, Owner and Expert fields, change descriptions, step-anchored feedback and review loop. We keep our own section allocation with parallel contributors, which Nintex does not have, and two-gate governance.

### 1.4 Highlights
| Highlight | What it means |
|---|---|
| Outline-first authoring | Plain-language activities and decisions. The swimlane map is generated. |
| Parallel contributors | Section allocation. Others' sections are read-only. |
| Two approval gates | Owner approves sections, then an approval chain approves the whole map. |
| Governance built in | Required change descriptions, immutable versions once in review, self-approval guard, server-side permission checks. |
| Generated swimlane map | Lanes by role, columns by sequence, routed connectors that never cross a step box. |
| Step-anchored feedback | Readers comment on a specific step, mark it "response required", and see the owner's reply. |
| Review loop | Each map has a review date. The owner or Expert marks it reviewed, or creates a new version. |
| Australian data residency | No third-party analytics, hosted AI or external CDNs. |
| Versioning | A published version stays live while a new version is drafted and approved. |

---

## 2. Users and roles

A user can hold more than one global role. Per-map involvement (map owner, Expert, section assignee) is assigned on top of the role.

| Role | Purpose | Main actions |
|---|---|---|
| **ADMIN** | Runs the system | Manage users and roles, invitations, folders, role library and systems, approval chain. Acts as owner on any map. Cannot be assigned sections. |
| **OWNER** | Accountable for a map | Initiate maps, define and allocate sections, kick off, approve or reject sections, edit any section of their own maps, submit for publication, create new versions, assign to-dos, mark reviewed. Invites contributors and viewers. |
| **CONTRIBUTOR** | Writes a section | Edit only the sections allocated to them, comment, attach documents, submit sections. |
| **APPROVER** | Final approval | Approve or reject an assembled map (Gate 2), through the approval chain. Cannot approve a map they submitted. |
| **VIEWER** | Reads | Browse, search and read published maps, export, send feedback. Needs no paid seat. |

Per-map roles:
- **Map owner**: the user who initiated the map. May edit any section while the version is in progress.
- **Expert**: optional person who looks after the map day to day. Can mark it reviewed and resolve or reopen feedback. No extra edit rights; editing comes only from section allocation.

Licence idea: ADMIN, OWNER, CONTRIBUTOR and APPROVER are paid seats. VIEWER is free and unlimited.

---

## 3. Core concepts

| Concept | Description |
|---|---|
| **Folder** | Repository category, such as HR or Finance. Can carry a default Expert and default members that new maps inherit. |
| **Map** | One process, for example "New Employee Onboarding". Has an owner, Expert, objective, summary, tags and a review interval. |
| **Version** | A map always has versions. Version 1 starts in planning. At most one version is open at a time. |
| **Section** | A named part of a version (for example "HR admin"), allocated to one assignee. Holds an ordered list of activities. |
| **Activity** | One step: label, role (the lane), optional system, tasks, notes, attached documents, optional `next`. |
| **Decision** | A question with a Yes target and a No target. A null target means "continue to the next step". |
| **Role library** | Admin-managed list of roles. Each role becomes a swimlane. |
| **Systems list** | Admin-managed list of software systems, tagged on activities done in software. |
| **Snapshot** | The immutable, ordered activity list stored when a version is submitted. The viewer reads only this. |
| **Approval chain** | Configurable stages of approvers (`ANY_ONE` or `ALL`) for the `PROCESS_MAP` feature. |
| **Change description** | Required text on section submit and on map submit. It feeds the change log. |

### 3.1 How the outline becomes a map
- **Flow follows list order.** There are no stored coordinates and no free-form arrows.
- **Decisions** name their Yes and No targets. A target may be any later step in the map, including one in another section. Targets that point backwards (loops) are refused in this version.
- **`next` on an activity** lets a side branch finish or jump: a later step id or `END`. Without it, a step flows into the one below.
- **Start and end are implicit**: the first step starts the process, and a step with nothing after it ends it.
- **Rules**: ids are unique across the version; a decision cannot be the very first step; deleting a step that another step points to is blocked.
- **Layout**: lanes are the roles in order of first appearance; columns follow sequence (dagre ranks plus a collision fix). Connectors are routed on the grid so they run in the gaps between columns or in the free strip at the top or bottom of a lane, and never through a step box.

---

## 4. End-to-end flow

```
Invite  ->  Initiate  ->  Plan & allocate  ->  Kick off  ->  Write in parallel
   ->  Submit section (with change description)  ->  Gate 1: owner approves / requests changes
   ->  Lint  ->  Submit for publication (with change description)  ->  Gate 2: approval chain
   ->  Published  ->  Read / search / feedback  ->  Review date  ->  Mark reviewed  OR  New version
```

### 4.1 Invitation and login
1. An ADMIN (any role) or OWNER (CONTRIBUTOR and VIEWER only) invites a user by email with a role, optionally into a map's team.
2. The invitee opens the link (token, valid 7 days), sets a name and password, and lands on a role-appropriate home. In the demo the link is shown on screen for copying, because no email is sent.

### 4.2 Initiate
The owner creates a map: title, objective, description, folder, optional Expert, review interval, tags. The folder's default Expert and members are applied. Version 1 starts in `PLANNING`.

### 4.3 Plan and allocate
The owner adds sections (title, description, due date) and assigns each to a contributor (the owner may assign themselves). Briefing documents and to-dos can be added. **Kick off** needs every section to have an assignee, moves the version to `IN_PROGRESS` and notifies assignees.

### 4.4 Write in parallel
Each contributor opens the outline editor.
- Their own section is editable: add activities and decisions, set role and system, add tasks and notes, reorder, delete.
- Other sections appear read-only with assignee, status and "opened by" hint.
- A live map on the right shows the whole process, updating as they type. Clicking a step on the map selects its card, and the other way round.
- Changes autosave. A stale save returns a conflict and shows a banner. The page refreshes every 30 seconds. There is no real-time co-editing.
- Comments and documents attach to the selected step.

### 4.5 Submit a section
The contributor submits with a required change description. The section becomes `SUBMITTED` and the owner is notified. Submission is blocked while the section has open revision comments.

### 4.6 Gate 1: owner reviews each section
The owner **approves** (the section locks as `APPROVED`) or **requests changes** with a required note (a revision comment is created and the section returns to the contributor). Gate 1 is lightweight and is not the approval chain.

### 4.7 Lint and submit for publication
When every section is approved the owner runs map lint and submits with a change description.

| Blocking | Warning |
|---|---|
| Activity without a role | Step without a label |
| Decision whose Yes and No lead to the same place | Activity without tasks |
| Target that no longer exists | Step that can never be reached |
| Map with no activities | |
| Open revision comments | |

On submit the system stores the snapshot, the version becomes `IN_REVIEW` (immutable), and an approval instance is created. If the chain is disabled, the version publishes directly.

### 4.8 Gate 2: approver review
Approvers named in the chain review the read-only map. Each stage resolves by its rule (`ANY_ONE` or `ALL`).
- **Approved**: the version becomes `PUBLISHED`. The previous published version becomes `SUPERSEDED`. Search text is rebuilt and the team is notified.
- **Rejected** (note required): the version becomes `CHANGES_REQUESTED` and returns to the owner, who reopens one or more sections (reassigning if needed). Only reopened sections loop back through writing and review. Others stay approved.

### 4.9 Published viewer
Readers (login required) browse by folder, search by map, activity, role or system, and open a map read-only.
- **Map tab**: the generated swimlane map, with export to PNG or PDF.
- **Procedure tab**: the same process as a numbered list by section, with tasks, notes and where each decision leads. Printable.
- Clicking a step shows its role, system, tasks, notes and documents marked visible to readers.
- **Feedback**: on a step or on the whole map, optionally "I need a response". The owner is notified, can reply and resolve or reopen. The reader sees their feedback and replies under "My feedback".

### 4.10 Revising a published map
The owner creates a new version with a required change note. All sections are cloned as `APPROVED` with assignees kept. The owner reopens the sections to change, then kicks off. The old version stays live until the new one is approved.

### 4.11 Review cycle
Each map has a review interval. The next review date is computed from the last publish or review. Owners and Experts see maps due within 30 days, or overdue, on the dashboard. They either create a new version, or choose **Mark as reviewed** with a note. A review writes a log entry, moves the date forward, and creates no new version.

---

## 5. State machines

**Version**
```
PLANNING --kickoff--> IN_PROGRESS --submit (all sections APPROVED)--> IN_REVIEW
IN_REVIEW --chain approved--> PUBLISHED   (previous PUBLISHED -> SUPERSEDED)
IN_REVIEW --chain rejected--> CHANGES_REQUESTED --reopen sections--> IN_PROGRESS
```
Content is editable only while `IN_PROGRESS`. `IN_REVIEW`, `PUBLISHED` and `SUPERSEDED` are immutable.

**Section**
```
UNASSIGNED --assign--> ASSIGNED --first save--> IN_PROGRESS --submit--> SUBMITTED
SUBMITTED --owner approves--> APPROVED
SUBMITTED --owner requests changes--> CHANGES_REQUESTED --next save--> IN_PROGRESS
APPROVED --owner reopens--> ASSIGNED
```
An owner's own edits to another user's section do not change a submitted or approved status. A save by anyone moves an assigned or changes-requested section to in progress.

---

## 6. Applications (screens)

### 6.1 Authoring app
| Screen | Route | Who | Purpose |
|---|---|---|---|
| Login | `/login` | everyone | Sign in |
| Accept invitation | `/invite/accept/:token` | invitee | Set name and password |
| Dashboard | `/dashboard` | all | Role-based cards: my sections, pending approvals, maps by status, sections awaiting my approval, reviews due, open feedback, most viewed |
| Maps in progress | `/maps` | admin, owner, contributor, approver | List of maps by status |
| New map | `/maps/new` | admin, owner | Title, objective, folder, Expert, review interval, tags |
| Map overview | `/maps/:id` | map team | Header (owner, Expert, review dates), workflow banner, owner actions, tabs |
| Outline editor | `/maps/:id/edit` | map team | Write sections, live map, comments, documents |
| My work | `/my-work` | owner, contributor | Sections assigned to me |
| To-do list | `/todos` | owner, contributor | To-dos assigned to me and by me |
| Approval inbox | `/reviews` | approver | Maps waiting for my approval |

**Map overview tabs:** Sections (assign, Gate 1, delete), Summary (objective, background, triggers, inputs, outputs, tags), To-do (owner assigns, assignee ticks off), Team (members and invitations), Documents (upload, category, scope, internal or reader-visible), Comments, Change log (readable history with change descriptions), Activity (raw audit trail).

### 6.2 Published viewer
| Screen | Route | Purpose |
|---|---|---|
| Published maps | `/published` | Search and browse published maps |
| Published map | `/published/:id` | Map and Procedure tabs, step details, feedback, export |

### 6.3 Admin
| Screen | Route | Who | Purpose |
|---|---|---|---|
| Invitations | `/admin/invitations` | admin, owner | Create, resend, revoke; copyable link |
| Users and roles | `/admin/users` | admin | Assign roles |
| Folders | `/admin/folders` | admin | Create, rename, delete; default Expert |
| Roles and systems | `/admin/roles-systems` | admin | Manage swimlane roles and systems; deactivate once used |
| Approval chain | `/admin/approval-chain` | admin | Enable and configure stages and approvers |
| Activity log | `/admin/activity` | admin | Full audit trail |

Shell features: role-based sidebar, notifications with unread count (refreshed every 15 seconds), "Reset demo data".

---

## 7. Actions reference

| Action | Who | Conditions |
|---|---|---|
| Invite a user | admin (any role); owner (contributor, viewer) | Role limits enforced |
| Initiate a map | admin, owner | Folder required |
| Add, assign, delete sections; kick off; reopen; submit for publication; create new version | admin; map owner | Version state rules |
| Edit section content | map owner (any section); assignee (own section) | Version `IN_PROGRESS`; assignee blocked when `SUBMITTED` or `APPROVED` |
| Submit a section | assignee | In progress; no open revision comments; change description |
| Approve or request changes on a section | admin; map owner | Section `SUBMITTED`; note required for changes |
| Approve or reject a version | pending approver | Not the submitter; note required to reject |
| Comment | map team; approver while `IN_REVIEW` | |
| Add a revision comment | admin; map owner; approver while `IN_REVIEW` | Blocks submit until resolved |
| Assign a to-do | map owner | Assignee is added to the map team |
| Mark as reviewed | admin; map owner; Expert | Map published; note required |
| Send feedback | any signed-in user | Map published |
| Reply to, resolve, reopen feedback | admin; map owner; Expert | |
| Upload, delete documents; make reader-visible | team; owner flips visibility | Default is internal; 600 KB demo cap |
| Manage folders, roles, systems, approval chain | admin | |

Every check is enforced in the API layer, not just hidden in the UI.

---

## 8. Technical architecture

### 8.1 Stack
| Layer | Technology |
|---|---|
| Frontend | Vue 3, Vue Router, Tailwind CSS 3, Vite 5 |
| Map rendering | Vue Flow (read-only), dagre for layout, custom edge routing |
| Export | `html-to-image` + `jsPDF`, client side |
| Backend (demo) | In-browser mock API (`src/mock/server.js`), data in `localStorage` |
| Backend (planned) | Django + Django REST Framework, new app `process/`; approval chain, activity log and RBAC modules extracted from the SMICEE ERP |

### 8.2 Repository layout
```
src/
  api/index.js          single place to swap the mock for real HTTP calls
  mock/server.js        mock backend: state machines, permissions, approval chain, lint, snapshot, search
  layout/
    layout.js           dagre ranks, lanes, collision fix, quality metrics
    route.js            orthogonal connector routing on the lane/column grid
    adapt.js            stored activities (draft or snapshot) -> layout items
    samples.js          hard-coded sample processes
  components/           ProcessMap, Shell, StatusChip, LintPanel
  views/                Editor, MapOverview, PublishedMap, Dashboard, Todos, ... and admin/
  router.js  session.js  util.js  styles/
tests/
  acceptance.mjs        86 API-level checks (demo scenario + denied actions)
  layout-spike.mjs      layout quality metrics on three samples
  e2e/browser-test.mjs  37 headless-browser checks
legacy/src-smicee-extract/   extracted SMICEE frontend, kept for reference, not built
public/                      Nintex UX analysis, assets
MVP_SPEC.md  CLAUDE.md  PROGRESS.md  BACKLOG.md  DOCUMENTATION.md
```

### 8.3 API contract
Mirrors the planned Django app: `{code, response, data}` responses, function-based views, no trailing slashes. The mock implements these routes through `dispatch(path, payload)`:

| Area | Routes |
|---|---|
| Auth and users | `auth/login`, `auth/logout`, `auth/me`, `user/list`, `user/set-roles/:pk` |
| Invitations | `invitation/create`, `list`, `revoke/:pk`, `resend/:pk`, `lookup`, `accept` |
| Folders, roles, systems | `folder/*`, `role/*`, `system/*` (list, create, edit, delete) |
| Maps | `map/create`, `list`, `detail/:pk`, `edit/:pk`, `archive/:pk`, `mark-reviewed/:pk`, `review-list` |
| Versions | `version/list/:pk`, `detail/:pk`, `lint/:pk`, `create-draft/:pk`, `kickoff/:pk`, `submit/:pk`, `approve/:pk`, `reject/:pk`, `reopen/:pk` |
| Sections | `section/create`, `edit/:pk`, `assign/:pk`, `delete/:pk`, `open/:pk`, `save/:pk`, `submit/:pk`, `approve/:pk`, `request-changes/:pk`, `my-assignments` |
| Comments | `comment/create`, `list/:pk`, `resolve/:pk`, `reopen/:pk` |
| Documents | `attachment/upload`, `list/:pk`, `download/:pk`, `delete/:pk`, `toggle-portal/:pk` |
| Viewer | `published/map/list`, `map/detail/:pk`, `search`, `feedback/create`, `feedback/mine/:pk` |
| Approval | `approval-chain/preset-list/PROCESS_MAP`, `save/PROCESS_MAP`, `instance/state/PROCESS_MAP/:pk`, `review/inbox` |
| Collaboration | `todo/create`, `list/:pk`, `my`, `toggle/:pk`, `delete/:pk`; `changelog/list/:pk`; `activity/list`; `notification/list`, `read-all`; `dashboard/summary` |

`section/save` takes `{activities, revision, changeDescription?}` and returns `409` when the revision is stale.

### 8.4 Data model (mock)
User, Invitation, Folder (default Expert, members), ProcessRole, ProcessSystem, Map (owner, Expert, objective, summary, tags, review dates), Team membership, Version (status, snapshot, change note, submit description), Section (assignee, status, activities, revision), Section decision, Comment (kinds `COMMENT`, `REVISION`, `FEEDBACK`, anchored to an activity, response required, status), Attachment (internal or reader-visible), To-do, Review log, Approval chain and instances, Activity log, Notification. Full field list in `MVP_SPEC.md` section 6.

---

## 9. Rules that must not be broken

1. Authorization is enforced server-side on every action.
2. Versions are immutable once `IN_REVIEW`.
3. The viewer serves only `PUBLISHED` versions, from the snapshot.
4. Attachments default to internal; the owner makes one visible to readers.
5. No customer data leaves Australia: no third-party analytics, hosted AI or external CDNs; storage location comes from configuration.
6. The user who submitted a version can never be a pending approver for it.
7. Activity ids are unique across a version; deleting a referenced step is blocked.
8. A change description is required on section submit and map submit.

---

## 10. Running, testing, demo

```
npm install
npm run dev        # http://localhost:3000
npm run build
npm test           # 86 API-level checks
node tests/layout-spike.mjs
```
Browser test: start the dev server, install `playwright-core`, then run `node tests/e2e/browser-test.mjs`. Screenshots are saved next to the script.

**Demo accounts** (password `demo`): `admin@demo.test`, `owner@demo.test`, `hr.contrib@demo.test`, `it.contrib@demo.test`, `approver@demo.test`, `viewer@demo.test`. Use "Reset demo data" in the sidebar for a clean start. Data lives in one browser's `localStorage`, so use separate profiles to act as different users at the same time.

**Demo script (the acceptance scenario):**
1. Admin invites the owner. Owner signs in.
2. Owner creates "New Employee Onboarding" in HR (Expert named), adds sections *HR admin*, *IT setup*, *Line manager tasks*, assigns them, kicks off.
3. Two contributors write different sections at once; each sees the other locked; one attaches a checklist and comments on a step.
4. Both submit with change descriptions. Owner requests changes on *IT setup*, it is fixed and resubmitted, owner approves all.
5. Owner runs lint (a warning shows), submits for publication.
6. Approver rejects once with a note; owner reopens *Line manager tasks*; fixed, approved, resubmitted; approver approves; the map is published.
7. Viewer searches, opens the map, checks Map and Procedure tabs, exports a PDF, sends feedback on a step; owner replies and resolves.
8. Owner creates version 2 with a change note; viewers keep seeing version 1 until version 2 is approved.
9. Review date arrives; owner marks it reviewed with no new version.

---

## 11. Scope

**In the MVP:** everything above.

**Out of scope for now** (tracked in [`BACKLOG.md`](BACKLOG.md)): free-form drawing canvas, loops (backward decisions), a separate publisher role, RACI and cost fields, process capture, AI draft generation, BPMN/XML export, import from other tools, version compare, scheduled reminder emails, mobile app, real-time co-editing, sub-process drill-down, templates, SSO, multi-tenancy, anonymous or permalink access, role-based stage approvers.

## 12. Known limitations and open items

- **Backend:** only the mock exists. Data is per browser. Django port waits on access to the SMICEE repo, its database and file storage, and an onshore email service.
- **Product decisions needed** (`MVP_SPEC.md` section 16): Gate 2 rejection returns to the owner; owner may approve own section; Expert has no extra rights; decisions are forward-only; no separate publisher step; per-map or site-wide review interval.
- **Map layout:** wide maps need panning; many connectors into one step can run side by side for a short stretch.
- **Untested in a browser:** conflict banner, 30-second refresh, Gate 1 request-changes loop, Gate 2 reject and reopen, version 2 flow, document upload, invitations, print, narrow layouts (most are covered at API level).
- **Housekeeping:** `.env.example` is stale; `API_DOCUMENTATION.md` not yet written.

## 13. Roadmap

1. Close the browser-test gaps above.
2. Write `API_DOCUMENTATION.md` from the mock server (it doubles as the backend contract).
3. Port to Django: models, migrations, roles, invitations, then the section, approval and viewer endpoints, with the same acceptance tests pointed at HTTP.
4. After the MVP: items in `BACKLOG.md`, starting with the likely RFT asks (BPMN export, import, publisher step, AI draft generation hosted in an Australian region).
