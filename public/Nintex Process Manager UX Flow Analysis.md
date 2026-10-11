# Nintex Process Manager: UX Flow Analysis

Oct 11, 2026 · @Catch Bitflex 2

## Key finding

Nintex Process Manager (formerly Promapp) is outline-first: authors write a process as structured text, and the system draws a read-only swimlane map from it. Nobody drags boxes or arrows.

- **Procedure tab:** authors add Activities, put Tasks under them, assign Roles, add Notes, and link documents or other processes.
- **Map tab:** shows the generated swimlane diagram. The docs describe no editing on the map itself. To change the process, you go back to the Edit tab.
- **Roles are the swimlanes.** Each role assigned to an activity becomes a lane, with icons showing whether a person or a business system does the work.

This is how Nintex meets "no BPMN experience needed", because nobody can draw a bad diagram. It differs from our MVP spec, which builds a free-form Vue Flow canvas.

Basis: Nintex help documentation, not a hands-on trial, so screen layouts are inferred.

## End-to-end UX flow

A process moves through nine stages, from a permissioned group to a recurring review.

1. **Structure: process groups.** Processes live in groups, such as departments. Stakeholders, editors, approvers and publishers are assigned at group level, so permissions scale without being set process by process.
2. **Create.** Processes > New Process, then pick a group. A short dialog asks for:
   - Title (the docs suggest starting with a verb)
   - Process Owner, who is accountable
   - Process Expert, who does the day-to-day editing
   - Objective, and optional Background
   - Then **Start writing**, or **Generate draft**, where AI builds activities, tasks and roles from the dialog (still marked beta).
3. **Author in the Edit tab.**
   - **Summary sub-tab:** groups, display type (Map and procedure, Procedure only, Policy), search keywords, triggers and inputs, outputs and targets, RACI, timeframes and costs, dependencies, and a review-due override.
   - **Procedure sub-tab:** Add Activity, then tasks, notes, to-dos and linked documents. **Add Decision** gives Yes and No branches, each leading to an activity or another process. **Link to a Process** is how sub-processes work.
   - **Guard rules:** a decision can't be the first step, and an unconfigured branch shows "Continue". To-dos must be completed before approval.
4. **Read the map.** Clicking an activity opens a pop-up with its tasks, FAQ-style notes and documents. Controls are zoom, a map-settings overlay for timeframe or system tags, a Process attributes menu (Summary, Change Log, Documents, Costs, Systems), and an SVG download.
5. **Save and version.**
   - Every save creates an *in progress* version, +0.1, with a change-log entry.
   - Publishing moves it to the next whole number (1.0, 2.0).
   - Editing a published process requires a change description by default.
   - Unpublished changes are visible only to admins, business analysts and stakeholders. Everyone else sees the last published version.
6. **Approval (optional add-on).** Submit for Approval, review by approvers, then a separate publish step. The diagram below shows the states.
7. **Consume.**
   - Readers find processes by search (processes, roles and systems), by browsing groups, and through My Processes, Favourites and Recently viewed.
   - **Minimode links** are permalinks that let anonymous people view a process and leave feedback with no login. They never expire and can't be disabled individually, and Nintex itself advises caution.
   - Sharing also covers email, a copied link and an iFrame embed.
8. **Feedback.**
   - A **Feedback** button sits in the top-right toolbar.
   - Feedback attaches to a specific activity or task, or is general, and it records the process version.
   - Options are free text, @mention and "Response required?".
   - Threads can be replied to, resolved, unresolved, or converted into an improvement ticket. Only an admin can delete a thread.
9. **Review cycle.**
   - Each process has a review period, set site-wide and overridable per process.
   - Owners see reviews on My Dashboard > Reviews, red when due or overdue and yellow when close.
   - Two actions: **View** (edit and publish a change) or **Mark as reviewed** with a note, which clears the item without a new version.

&#91;embedded content: approval states · 4 stages, 1 decline loop\]

A declined change returns to the submitter with a comment. An admin can bypass approval with Publish Now, which is off by default.

## Roles

Nintex has eight user types, plus Approver and Publisher once approval is on, and only one privilege type can be assigned per user. The eight are User, Business Analyst, Promaster, Process Owner, Process Expert, Group Champion, Group Editor and System Owner. Here is how the main ones map to our MVP roles.

| Nintex role | What it does | Our MVP role |
| --- | --- | --- |
| Promaster | Full admin: users, groups, approval setup, delete and restore | ADMIN |
| Process Owner + Process Expert | Owner is accountable; Expert edits day to day. Both are default approvers | OWNER (we have no separate Expert) |
| Group Editor | Edits any process in the group | CONTRIBUTOR, but group-wide, not per section |
| Process Approver | Signs off changes, assigned per group or per process | APPROVER |
| Process Publisher | Releases approved changes, assigned per group | None, because we publish automatically after approval |
| User | Views published processes and gives feedback | VIEWER |

## What the docs did not tell us

The public documentation leaves five questions open that matter for our design.

- Whether approvers act in sequence or in parallel.
- Whether a submitter can approve their own change. We handle this with a guard in our spec.
- Whether a process is locked while it awaits approval.
- Whether there is a version-compare screen.
- Anything about assigning parts of one process to different authors. I found no section or parallel-contributor concept, and it looks like one expert edits at a time. Our section allocation appears to be something Nintex does not have.

## What to replicate, and where to differ

Ten things are worth copying, and three places call for a deliberate difference.

**Replicate**

1. Procedure-first authoring with an auto-generated, read-only map. It removes the hardest UI work and meets "no BPMN experience" by design.
2. Process groups with group-level stakeholders, instead of per-process permissions.
3. Owner and Expert as separate fields.
4. A required change description on every save and submission, with a change log showing who approved and who is pending.
5. Version numbers: 0.x for in-progress saves, whole numbers when published.
6. Feedback anchored to a step, with response-required, resolve and unresolve.
7. Dashboard views: My Changes, Reviews, My Feedback.
8. The review-due loop, including "Mark as reviewed" without a new version.
9. Process attributes beyond the map: RACI, triggers, inputs, outputs, systems, timeframes.
10. A separate publish step, if the Council wants a governance team to control release.

**Differ deliberately**

- **Keep section allocation and parallel contributors.** It is our differentiator, and it fits the outline model, where a section becomes a group of activities.
- **Don't copy anonymous permalinks.** Links that never expire and can't be revoked conflict with a public-sector buyer's data controls. Use the INTERNAL / PUBLIC per-map setting we already planned, with revocable links.
- **Leave out of the MVP:** AI draft generation, process capture, BPMN conversion and the mobile app.

## The decision this raises

Our spec says the editor is a Vue Flow canvas, while Nintex uses an outline editor that generates the map, so we need to pick one before building.

The generated swimlane map still needs a renderer, and Vue Flow can do that read-only. The editing screen becomes a structured form instead of a canvas.

**Recommendation:** outline editor first, an auto-generated read-only map, and a drag-and-drop canvas later only if customers ask. It carries less risk, and it matches how the Council's brief is phrased.

**If agreed:** rewrite sections 3, 5 and 6 of `MVP_SPEC.md` (flow, canvas, data model) and the build order in `CLAUDE.md` around this model.

## Sources

All pages below were opened and read on 11 Oct 2026.

- [Nintex Process Manager product page](https://www.nintex.com/platforms/cloud-automation/process-management/)
- [Quick start guide](https://help.nintex.com/en-US/Promapp/Navigation/QuickStartGuide.htm)
- [Create a process](https://help.nintex.com/en-US/promapp/Processes/CreateProcess.htm)
- [Edit a process](https://help.nintex.com/en-US/Promapp/Processes/EditTab.htm)
- [Map tab](https://help.nintex.com/en-US/Promapp/Processes/MapTab.htm)
- [Save and publish](https://help.nintex.com/en-US/Promapp/Processes/Publish.htm)
- [Submit a process for approval](https://help.nintex.com/en-us/promapp/PAW/Submit.htm)
- [Configure Process Approvals](https://help.nintex.com/en-US/promapp/PAW/Admin.htm)
- [Process and Document Approval FAQs](https://help.nintex.com/en-us/promapp/PAW/FAQs.htm)
- [Review a process](https://help.nintex.com/en-US/Promapp/Processes/ReviewProcess.htm)
- [Process feedback](https://help.nintex.com/en-US/promapp/Processes/Feedback.htm)
- [Share a process](https://help.nintex.com/en-US/Promapp/Processes/ShareProcess.htm)
- [Identify user rights](https://help.nintex.com/en-US/Promapp/Processes/Rights.htm)
- [Identify user rights with Process Approval enabled](https://help.nintex.com/en-US/Promapp/Processes/Rights_withPAW.htm)
