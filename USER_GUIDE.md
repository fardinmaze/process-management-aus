# Process Maps: User and Presenter Guide

Process Maps is a collaborative process-mapping tool. An **owner** starts a map and splits it into **sections**. Each section is given to a **contributor**, who writes it as a simple outline. The system draws the swimlane map automatically. The map passes two approval gates, then is **published** to a read-only viewer where staff can read it and send feedback.

> This is a working prototype. All data is stored in the browser (a mock server), so it is single-machine only. It is safe to experiment and easy to reset.

---

## 1. Running the demo

1. Open a terminal in the project folder and run `npm run dev`.
2. Open **http://localhost:3000**.
3. Sign in with one of the accounts below.

### Demo accounts

Password for every account: **`demo`**

| Name | Role | Email | What they do in the demo |
|---|---|---|---|
| Avery Admin | ADMIN | `admin@demo.test` | Manages users, folders, roles, systems, approval chain, activity log |
| Olivia Owner (HR) | OWNER | `owner@demo.test` | Creates maps, assigns sections, approves sections, submits for publication |
| Hugo Hall (HR) | CONTRIBUTOR | `hr.contrib@demo.test` | Writes sections assigned to them |
| Ivy Intel (IT) | CONTRIBUTOR | `it.contrib@demo.test` | Writes sections assigned to them |
| Aaron Approver | APPROVER | `approver@demo.test` | Approves or rejects maps at the final gate |
| Vera Viewer | VIEWER | `viewer@demo.test` | Reads published maps and sends feedback (read-only) |

The demo-account list is hidden on the login page. To show it again, put `VITE_SHOW_DEMO_ACCOUNTS=true` in a `.env.local` file and restart.

### Playing several people at once

The signed-in user is kept **per browser tab**, but the data is **shared** between tabs of the same browser profile. So for a live demo, open one tab per person and sign each one in separately. Do not use a different browser profile or a private window for the same demo, because each profile has its own separate data.

### Pre-loaded sample data

The first time the app loads it creates three maps and four to-dos:

| Map | Folder | State | Purpose |
|---|---|---|---|
| **New Employee Onboarding** (PM-HR-1) | HR | **Published**, v1, with views and one open feedback item | Show the finished result and the viewer |
| **IT Access Request** (PM-IT-2) | IT | **In progress**: one section submitted, one being written, one not started | Show work mid-way and the owner's approval step |
| **Expense Reimbursement** (PM-FIN-3) | Finance | **Just kicked off**: every section assigned, nothing written | Show a contributor's "My work" and the editor from scratch |

**Reset demo data** (bottom of the left menu) throws away everything and restores exactly this starting set, then signs you out.

---

## 2. How the whole process works

```
Planning ──Kick off──▶ In progress ──Submit for publication──▶ In review ──Approve──▶ PUBLISHED
                            ▲                                      │
                            └──── Reopen sections ◀── Changes requested (if the approver rejects)
```

**Section** states: Assigned → In progress (on first save) → Submitted → Approved (or Changes requested).

There are **two approval gates**:

1. **Gate 1: the owner** approves each section (or requests changes with a note).
2. **Gate 2: the approver** (Process Council) approves the whole map. The person who submitted the map can never approve it.

A published map is frozen. To change it, the owner creates a **new version**; the old version stays live until the new one is approved.

---

## 3. Guide: create a map (owner)

Sign in as **Olivia Owner** (`owner@demo.test`).

### Step 1. Create the map
1. In the left menu click **New map**.
2. Fill in:
   - **Title** (e.g. "Customer Complaint Handling")
   - **Description** (optional)
   - **Objective**: what the process is for
   - **Folder** (HR, IT or Finance). The map code follows the folder, e.g. `PM-HR-4`.
   - **Review interval (days)**: how often the map must be reviewed after publishing
   - **Expert** (optional): the subject-matter person who can mark it reviewed later
   - **Tags**, comma separated
3. Click **Create map**. You land on the map overview.

### Step 2. Add sections
1. On the **Sections** tab, use the form at the bottom: **Title** (e.g. "Intake"), optional **Description**, an **assignee** (or "Assign later") and an optional **Due date**.
2. Click **Add section**. Repeat for every part of the process.
3. Every section needs an assignee before you can continue. Only Owners and Contributors can be assigned.

### Step 3. Kick off
Click **Kick off**. The version moves from *Planning* to *In progress*, and every assignee gets a notification and sees the section under **My work** on their dashboard.

### Step 4. Contributors write their sections
Switch to a contributor (e.g. **Hugo Hall**, `hr.contrib@demo.test`), then:

1. On the **Dashboard** open **My work** and click **Open editor** on the section.
2. In the editor the left side is the **outline**, the right side is the **live map**.
3. Click **+ Activity** and fill in:
   - **Label**: start with a verb ("Create employee record")
   - **Role (lane)**: who does it. Each role becomes a swimlane.
   - **System** (optional): the tool used
   - **Tasks**: the individual actions, one per line (press Enter for the next)
   - **Notes**: tips and rules for the person doing the step
   - **After this step**: continue to the next step, end the process, or jump to another step
4. Click **+ Decision** for a Yes/No question. Choose where **If Yes** and **If No** go. Decisions can only point **forward** (no loops).
5. Use the arrow buttons to reorder, the bin to delete.
6. It **autosaves** (see "All changes saved" in the top bar). You can click a step on the map to jump to it, and use **Comments** and **Documents** tabs on the right to discuss or attach files to a step.
7. When finished, click **Submit section**, write a short **change description** (required), then **Submit for review**.

You can only edit your own section. Other sections are visible but read-only, and this is enforced by the server, not just the screen.

### Step 5. Owner reviews each section (Gate 1)
Back as **Olivia**, open the map and on the **Sections** tab, for each submitted section:
- **Approve**, or
- **Request changes** with a note. The contributor is notified, fixes it, and resubmits.

You can also edit any section of your own map yourself.

### Step 6. Check the map
Click **Run map lint**. It lists blockers (for example, a step with no role, a decision whose Yes and No go to the same place) and warnings (for example, a step with no label or no tasks). Fix blockers before submitting.

---

## 4. Guide: publish a map

### Submit for publication (owner)
1. When **all sections are Approved**, type a **change description** in the box above the buttons (for example "First full version") and click **Submit for publication**.
2. The map becomes **In review**. It is now locked and a permanent snapshot is taken.

### Final approval (approver, Gate 2)
Switch to **Aaron Approver** (`approver@demo.test`):
1. Open **Approval inbox** in the left menu and open the map.
2. Read it. Then either:
   - Click **Approve**. The map is **Published**.
   - Write a note and click **Reject** (a note is required). The map returns to the owner as *Changes requested*.

### If it was rejected
As the owner: tick the sections that need work, click **Reopen N selected section(s)**, have the contributor fix and resubmit, approve them, and click **Submit for publication** again.

### After publishing
- Everyone signed in can find it under **Published maps** (search covers titles, tags, step names, roles and systems).
- The owner sees **Mark as reviewed** (before the review date) to record a periodic review without making a new version.
- To change a published map, click **Create new version**, give a change note, reopen the sections you want to change and kick off again. The current version stays live until the new one is approved.

---

## 5. Guide: read a published map and send feedback (everyone)

Sign in as **Vera Viewer** (`viewer@demo.test`) or anyone else, then open **Published maps**.

- **Map tab**: the swimlane diagram. Click any step to see its role, system, tasks, notes and documents in the side panel. Drag to pan, scroll to zoom.
- **Procedure tab**: the same process as a numbered step-by-step document. Use **Print** for a paper copy.
- **Export PNG / Export PDF**: download the diagram (done in the browser; nothing is uploaded).
- **Send feedback**: select a step (or leave nothing selected to comment on the whole map), type your feedback, tick **I need a response** if you want an answer, and click **Send feedback**. The owner is notified, and replies appear under **My feedback**.
- Owners can reply, **Resolve** and reopen feedback threads from the map's **Comments** tab.

---

## 6. Guide: dashboard and everyday pages

| Page | Who | What it is |
|---|---|---|
| **Dashboard** | Everyone | One page that merges the old Dashboard, My work and To-do list. Stat cards at the top, then **My work** (sections assigned to you), **To-do list** (tasks assigned to you and by you; tick a box to complete), then summary cards (maps by status, sections awaiting approval, reviews due, most viewed) |
| **Maps in progress** | Admin, Owner, Contributor, Approver | All maps with filter by title/code and folder |
| **New map** | Admin, Owner | Start a map |
| **Published maps** | Everyone | The read-only library |
| **Approval inbox** | Approver | Maps waiting for the final decision |
| **Notifications** (bell, top right) | Everyone | Kick-offs, requested changes, approvals, feedback |

Inside a map the tabs are: **Sections**, **Summary**, **To-do**, **Team**, **Documents**, **Comments**, **Change log**, **Activity**. Owners can add to-dos for the team there; the assignee sees them on their dashboard.

### Admin pages (Avery Admin; Invitations also for Owners)

| Page | Use |
|---|---|
| **Invitations** | Invite a person by email and role. The app shows a copyable link instead of sending email |
| **Users & roles** | See all users and their roles |
| **Folders** | Maps are filed in folders; each folder can default an Expert and team members |
| **Roles & systems** | The library of roles (these become swimlanes) and systems used in the editor dropdowns |
| **Approval chain** | The Gate 2 approvers (currently "Process Council", any one approver) |
| **Activity log** | A record of every create, change and approval |

---

## 7. Suggested presenter script (about 10 minutes)

1. **Show the finished product (1 min).** Sign in as Vera Viewer. Open **Published maps** > *New Employee Onboarding*. Click a step, switch to the **Procedure** tab, show **Export PDF**, and send one piece of feedback.
2. **Show contributor work (2 min).** In a second tab sign in as Hugo Hall. On the dashboard show **My work** and **To-do list**, open *Expense Reimbursement* > **Open editor**, add two activities and a decision, and point out the live map and autosave.
3. **Show the owner's control (2 min).** In a third tab sign in as Olivia Owner. Open *IT Access Request*, approve the submitted section, request changes on another with a note, and run **map lint**.
4. **Show the gates (3 min).** Fastest route to a live approval: create a small new map (Section 3), have a contributor write one step, approve it, **Submit for publication**, then as Aaron Approver open the **Approval inbox** and click **Approve**. Open **Published maps** to show it live.
5. **Wrap up (1 min).** As Avery Admin show **Activity log** and **Roles & systems**. Mention that every action is recorded and permissions are enforced by the server.

Tip: the sample *New Employee Onboarding* map is already published, so the **Approval inbox** is empty at the start. Create a new map to demonstrate approval live.

---

## 8. Rules worth knowing

- **Only the assignee edits a section.** The owner of the map can edit any section of their own map.
- **A change description is required** when submitting a section and when submitting a map.
- **Submitted and Approved sections are locked.** An approved map under review cannot be edited at all.
- **Decisions go forward only.** Loops are not supported in this version.
- **Self-approval is blocked.** The person who submitted a map cannot be one of its approvers.
- **Documents are internal by default.** Owners can make a document visible to readers of the published map.
- **Document size limit:** 600 KB per file in the demo (browser storage limit).
- **No external services.** Fonts, icons and exports all run locally.

## 9. Troubleshooting

| Problem | Fix |
|---|---|
| A person's dashboard is empty | You are probably in a different browser profile or private window. Use tabs of the same profile |
| "Browser storage is full" | Click **Reset demo data** |
| Cannot click **Submit for publication** | Every section must be Approved and the change description must be filled in |
| **Kick off** is disabled or fails | Every section needs an assignee |
| A contributor has no **Open editor** button | The map must be *In progress* (kicked off) and the section assigned to them |
| Want to start over | **Reset demo data** (bottom of the left menu) |

## 10. For developers

| Command | Does |
|---|---|
| `npm run dev` | Start the app on http://localhost:3000 |
| `npm run build` | Production build to `dist/` |
| `npm test` | 86 API-level acceptance checks (the full demo scenario plus permission denials) |

Stack: Vue 3, Vue Router, Tailwind, Vue Flow (read-only map), dagre (layout). Data and rules live in `src/mock/server.js`; sample data is in `src/mock/sample.js`. The Django backend is not built yet. Project rules and scope are in `CLAUDE.md` and `MVP_SPEC.md`; progress is in `PROGRESS.md`.
