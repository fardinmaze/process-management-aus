// In-browser stand-in for the Django `process/` API (no backend exists in this repo yet).
// It implements the MVP_SPEC rules (state machines, permission matrix, approval chain,
// snapshot, self-approval guard, 409 revision conflicts) and persists to localStorage.
// Every handler takes (payload, ctx) and returns data or throws ApiError(code, message).
// Swap src/api/index.js to axios when the real backend is available.

const DB_KEY = 'pm_db_v1'
const SESSION_KEY = 'pm_session_v1'

export class ApiError extends Error {
  constructor(code, message, data = null) { super(message); this.code = code; this.data = data }
}
const fail = (code, msg, data) => { throw new ApiError(code, msg, data) }
const now = () => new Date().toISOString()
const uid = (p) => `${p}_${crypto.randomUUID()}`
const clone = (x) => (x === undefined ? x : JSON.parse(JSON.stringify(x)))

// ───────────────────────── persistence ─────────────────────────
function seed() {
  const users = [
    { id: 1, name: 'Avery Admin',     email: 'admin@demo.test',       roles: ['ADMIN'],       password: 'demo' },
    { id: 2, name: 'Olivia Owner',    email: 'owner@demo.test',       roles: ['OWNER'],       password: 'demo', dept: 'HR' },
    { id: 3, name: 'Hugo Hall',       email: 'hr.contrib@demo.test',  roles: ['CONTRIBUTOR'], password: 'demo', dept: 'HR' },
    { id: 4, name: 'Ivy Intel',       email: 'it.contrib@demo.test',  roles: ['CONTRIBUTOR'], password: 'demo', dept: 'IT' },
    { id: 5, name: 'Aaron Approver',  email: 'approver@demo.test',    roles: ['APPROVER'],    password: 'demo' },
    { id: 6, name: 'Vera Viewer',     email: 'viewer@demo.test',      roles: ['VIEWER'],      password: 'demo' },
  ]
  return {
    seq: { user: 6, invitation: 0, folder: 3, map: 0, version: 0, section: 0, comment: 0, attachment: 0, decision: 0, notification: 0, activity: 0, instance: 0 },
    users,
    invitations: [],
    folders: [{ id: 1, name: 'HR', parent: null }, { id: 2, name: 'IT', parent: null }, { id: 3, name: 'Finance', parent: null }],
    maps: [], teams: [], versions: [], sections: [], decisions: [], comments: [], attachments: [],
    chain: { enabled: true, stages: [{ id: 1, name: 'Process Council', rule: 'ANY_ONE', approvers: [5] }] },
    instances: [], activity: [], notifications: [], presence: {},
  }
}
let db = null
function load() {
  if (db) return db
  try { db = JSON.parse(localStorage.getItem(DB_KEY)) } catch { db = null }
  if (!db) { db = seed(); save() }
  return db
}
function save() { try { localStorage.setItem(DB_KEY, JSON.stringify(db)) } catch { fail(507, 'Browser storage is full. Use Reset demo data.') } }
export function resetDemo() { db = seed(); save(); localStorage.removeItem(SESSION_KEY) }
const nextId = (k) => ++load().seq[k]

// ───────────────────────── helpers ─────────────────────────
const sessionUserId = () => Number(localStorage.getItem(SESSION_KEY)) || null
const byId = (arr, id) => arr.find((x) => x.id === Number(id))
const publicUser = (u) => u && ({ id: u.id, name: u.name, email: u.email, roles: u.roles, dept: u.dept || null })
const userName = (id) => byId(load().users, id)?.name || '—'

function me(required = true) {
  const u = byId(load().users, sessionUserId())
  if (!u && required) fail(401, 'Please sign in.')
  return u || null
}
const hasRole = (u, ...roles) => !!u && u.roles.some((r) => roles.includes(r))

function log(user, action, object, objectId, from, to, note) {
  const d = load()
  d.activity.push({ id: nextId('activity'), userId: user?.id ?? null, action, object, objectId, from: from ?? null, to: to ?? null, note: note || '', at: now() })
}
function notify(userIds, text, link) {
  const d = load()
  for (const id of new Set(userIds.filter(Boolean))) d.notifications.push({ id: nextId('notification'), userId: id, text, link: link || null, read: false, at: now() })
}

function mapOf(id) { const m = byId(load().maps, id); if (!m) fail(404, 'Map not found.'); return m }
function versionOf(id) { const v = byId(load().versions, id); if (!v) fail(404, 'Version not found.'); return v }
function sectionOf(id) { const s = byId(load().sections, id); if (!s) fail(404, 'Section not found.'); return s }
const sectionsOfVersion = (vid) => load().sections.filter((s) => s.versionId === vid).sort((a, b) => a.order - b.order)
const isOwnerOf = (u, map) => hasRole(u, 'ADMIN') || (hasRole(u, 'OWNER') && map.ownerId === u.id)
const inTeam = (u, map) => load().teams.some((t) => t.mapId === map.id && t.userId === u.id)
const inReview = (map) => load().versions.some((v) => v.mapId === map.id && v.status === 'IN_REVIEW')

function canViewUnpublished(u, map) {
  if (!u) return false
  return isOwnerOf(u, map) || inTeam(u, map) || (hasRole(u, 'APPROVER') && inReview(map))
}
function requireOwner(u, map) { if (!isOwnerOf(u, map)) fail(403, 'Only the map owner (or an admin) can do this.') }
function addToTeam(mapId, userId, isOwner = false) {
  const d = load()
  if (!d.teams.some((t) => t.mapId === mapId && t.userId === userId)) d.teams.push({ mapId, userId, isOwner })
}
function mapView(map) {
  const d = load()
  const folder = byId(d.folders, map.folderId)
  const open = map.openVersionId ? byId(d.versions, map.openVersionId) : null
  const pub = map.publishedVersionId ? byId(d.versions, map.publishedVersionId) : null
  return {
    ...clone(map), folderName: folder?.name || '', ownerName: userName(map.ownerId),
    openVersion: open && { id: open.id, versionNo: open.versionNo, status: open.status },
    publishedVersion: pub && { id: pub.id, versionNo: pub.versionNo, publishedAt: pub.publishedAt },
    status: open ? open.status : pub ? 'PUBLISHED' : 'PLANNING',
    overdue: !!(pub && map.nextReviewDue && map.nextReviewDue < now()),
  }
}
function sectionView(s) {
  const pres = load().presence[s.id]
  const recent = pres && Date.now() - pres.at < 60000
  return { ...clone(s), assigneeName: s.assigneeId ? userName(s.assigneeId) : null, openedBy: recent ? { id: pres.userId, name: userName(pres.userId) } : null }
}
function versionView(v) { return { ...clone(v), submittedByName: v.submittedBy ? userName(v.submittedBy) : null, createdByName: userName(v.createdBy) } }

// ───────────────────────── approval chain internals ─────────────────────────
// Mirrors the ERP pattern: business module calls these helpers, the chain never exposes approve/reject itself.
function create_instance(version, submitter) {
  const d = load()
  const stages = clone(d.chain.stages)
  const inst = { id: nextId('instance'), versionId: version.id, status: 'PENDING', stageIdx: 0, stages, actions: [], submitterId: submitter.id, createdAt: now() }
  d.instances.push(inst)
  return inst
}
function eligibleApprovers(inst, stage) {
  const d = load()
  return stage.approvers.filter((id) => id !== inst.submitterId && hasRole(byId(d.users, id), 'APPROVER'))
}
function get_pending_approvers(inst) {
  if (!inst || inst.status !== 'PENDING') return []
  const stage = inst.stages[inst.stageIdx]
  const acted = inst.actions.filter((a) => a.stageIdx === inst.stageIdx).map((a) => a.userId)
  return eligibleApprovers(inst, stage).filter((id) => !acted.includes(id))
}
function record_action(inst, user, action, note) {
  if (!get_pending_approvers(inst).includes(user.id)) fail(403, 'You are not a pending approver for this version (submitters can never approve their own submission).')
  inst.actions.push({ stageIdx: inst.stageIdx, userId: user.id, action, note: note || '', at: now() })
  if (action === 'REJECT') { inst.status = 'REJECTED'; return 'REJECTED' }
  const stage = inst.stages[inst.stageIdx]
  const approvedBy = inst.actions.filter((a) => a.stageIdx === inst.stageIdx && a.action === 'APPROVE').map((a) => a.userId)
  const done = stage.rule === 'ALL' ? eligibleApprovers(inst, stage).every((id) => approvedBy.includes(id)) : approvedBy.length >= 1
  if (!done) return 'PENDING'
  if (inst.stageIdx + 1 < inst.stages.length) { inst.stageIdx += 1; return 'STAGE_ADVANCED' }
  inst.status = 'APPROVED'
  return 'APPROVED'
}
const instanceOf = (versionId) => [...load().instances].reverse().find((i) => i.versionId === Number(versionId)) || null

// ───────────────────────── lint & snapshot ─────────────────────────
function lintVersion(version) {
  const d = load()
  const secs = sectionsOfVersion(version.id)
  const nodes = secs.flatMap((s) => s.graph.nodes.map((n) => ({ ...n, sectionId: s.id })))
  const edges = secs.flatMap((s) => s.graph.edges.map((e) => ({ ...e, sectionId: s.id })))
  const ids = new Set(nodes.map((n) => n.id))
  const blocking = [], warnings = []
  if (!nodes.some((n) => n.type === 'start')) blocking.push({ code: 'NO_START', message: 'The map needs at least one Start node.' })
  if (!nodes.some((n) => n.type === 'end')) blocking.push({ code: 'NO_END', message: 'The map needs at least one End node.' })
  for (const e of edges) if (!ids.has(e.target) || !ids.has(e.source)) blocking.push({ code: 'DANGLING_EDGE', message: `A connection in "${byId(d.sections, e.sectionId).title}" points to a step that no longer exists.`, edgeId: e.id })
  const openRev = d.comments.filter((c) => c.versionId === version.id && c.kind === 'REVISION' && c.status === 'OPEN')
  if (openRev.length) blocking.push({ code: 'OPEN_REVISIONS', message: `${openRev.length} open revision comment(s) must be resolved.` })
  const touched = new Set(edges.flatMap((e) => [e.source, e.target]))
  for (const n of nodes) {
    const sec = byId(d.sections, n.sectionId).title
    if (n.type !== 'note' && !touched.has(n.id)) warnings.push({ code: 'ORPHAN', message: `"${n.data.label || n.type}" in ${sec} is not connected to anything.`, nodeId: n.id })
    if (n.type === 'decision' && edges.filter((e) => e.source === n.id).length < 2) warnings.push({ code: 'DECISION_BRANCHES', message: `Decision "${n.data.label || '(no label)'}" in ${sec} has fewer than two outgoing paths.`, nodeId: n.id })
    if (!['note', 'start', 'end'].includes(n.type) && !(n.data.label || '').trim()) warnings.push({ code: 'NO_LABEL', message: `A ${n.type} step in ${sec} has no label.`, nodeId: n.id })
  }
  return { blocking, warnings }
}
function buildSnapshot(version) {
  const secs = sectionsOfVersion(version.id)
  return {
    schema_version: 1,
    sections: secs.map((s) => ({ id: s.id, title: s.title, description: s.description, order: s.order, frame: clone(s.frame), assigneeName: s.assigneeId ? userName(s.assigneeId) : null })),
    nodes: secs.flatMap((s) => s.graph.nodes.map((n) => ({ ...clone(n), sectionId: s.id }))),
    edges: secs.flatMap((s) => s.graph.edges.map((e) => ({ ...clone(e), sectionId: s.id }))),
  }
}
function buildSearchText(map, snapshot) {
  const parts = [map.title, map.description, (map.tags || []).join(' ')]
  for (const s of snapshot.sections) parts.push(s.title, s.description)
  for (const n of snapshot.nodes) parts.push(n.data.label, n.data.description, n.data.role, n.data.system)
  return parts.filter(Boolean).join(' ').toLowerCase()
}

function publish(version, actor) {
  const d = load()
  const map = mapOf(version.mapId)
  const prev = map.publishedVersionId ? byId(d.versions, map.publishedVersionId) : null
  if (prev) { prev.status = 'SUPERSEDED'; log(actor, 'version.superseded', 'version', prev.id, 'PUBLISHED', 'SUPERSEDED') }
  version.status = 'PUBLISHED'; version.publishedAt = now()
  map.publishedVersionId = version.id; map.openVersionId = null
  map.nextReviewDue = new Date(Date.now() + (map.reviewIntervalDays || 365) * 86400000).toISOString()
  map.searchText = buildSearchText(map, version.graphSnapshot)
  log(actor, 'version.published', 'version', version.id, 'IN_REVIEW', 'PUBLISHED')
  const team = d.teams.filter((t) => t.mapId === map.id).map((t) => t.userId)
  notify([...team, map.ownerId], `"${map.title}" v${version.versionNo} has been published.`, `/maps/${map.id}`)
}

// ───────────────────────── handlers ─────────────────────────
const H = {}
const route = (pattern, fn) => { H[pattern] = fn }

// ── auth ──
route('auth/login', ({ email, password }) => {
  const u = load().users.find((x) => x.email.toLowerCase() === String(email || '').trim().toLowerCase() && x.password === password)
  if (!u) fail(400, 'Email or password is incorrect.')
  localStorage.setItem(SESSION_KEY, String(u.id)); log(u, 'auth.login', 'user', u.id); save()
  return publicUser(u)
})
route('auth/logout', () => { localStorage.removeItem(SESSION_KEY); return {} })
route('auth/me', () => publicUser(me(false)))
route('user/list', () => { const u = me(); if (!hasRole(u, 'ADMIN', 'OWNER')) fail(403, 'Not allowed.'); return load().users.map(publicUser) })
route('user/set-roles/:pk', ({ roles }, { pk }) => {
  const u = me(); if (!hasRole(u, 'ADMIN')) fail(403, 'Only an admin can change roles.')
  const t = byId(load().users, pk); if (!t) fail(404, 'User not found.')
  const valid = ['ADMIN', 'OWNER', 'CONTRIBUTOR', 'APPROVER', 'VIEWER']
  if (!Array.isArray(roles) || !roles.length || roles.some((r) => !valid.includes(r))) fail(400, 'Choose at least one valid role.')
  const before = t.roles.join(','); t.roles = roles; log(u, 'user.roles', 'user', t.id, before, roles.join(',')); save(); return publicUser(t)
})

// ── invitations ──
route('invitation/create', ({ email, role, mapId }) => {
  const u = me(); const d = load()
  if (!hasRole(u, 'ADMIN', 'OWNER')) fail(403, 'Not allowed to invite users.')
  if (!/^\S+@\S+\.\S+$/.test(email || '')) fail(400, 'Enter a valid email address.')
  if (!['ADMIN', 'OWNER', 'CONTRIBUTOR', 'APPROVER', 'VIEWER'].includes(role)) fail(400, 'Choose a role.')
  if (!hasRole(u, 'ADMIN') && !['CONTRIBUTOR', 'VIEWER'].includes(role)) fail(403, 'Owners can invite contributors and viewers only.')
  if (d.users.some((x) => x.email.toLowerCase() === email.toLowerCase())) fail(400, 'A user with this email already exists.')
  if (mapId) { const m = mapOf(mapId); requireOwner(u, m) }
  const inv = { id: nextId('invitation'), email, role, invitedBy: u.id, token: crypto.randomUUID(), status: 'PENDING', expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(), mapId: mapId || null, acceptedUserId: null, createdAt: now() }
  d.invitations.push(inv); log(u, 'invitation.sent', 'invitation', inv.id, null, 'PENDING', email); save(); return clone(inv)
})
route('invitation/list', () => {
  const u = me(); if (!hasRole(u, 'ADMIN', 'OWNER')) fail(403, 'Not allowed.')
  const d = load(); const t = now()
  d.invitations.forEach((i) => { if (i.status === 'PENDING' && i.expiresAt < t) i.status = 'EXPIRED' })
  return clone(d.invitations.filter((i) => hasRole(u, 'ADMIN') || i.invitedBy === u.id).reverse())
})
route('invitation/revoke/:pk', (_, { pk }) => {
  const u = me(); const i = byId(load().invitations, pk); if (!i) fail(404, 'Invitation not found.')
  if (!hasRole(u, 'ADMIN') && i.invitedBy !== u.id) fail(403, 'Not allowed.')
  if (i.status !== 'PENDING') fail(400, 'Only pending invitations can be revoked.')
  i.status = 'REVOKED'; log(u, 'invitation.revoked', 'invitation', i.id, 'PENDING', 'REVOKED'); save(); return clone(i)
})
route('invitation/resend/:pk', (_, { pk }) => {
  const u = me(); const i = byId(load().invitations, pk); if (!i) fail(404, 'Invitation not found.')
  if (!hasRole(u, 'ADMIN') && i.invitedBy !== u.id) fail(403, 'Not allowed.')
  if (!['PENDING', 'EXPIRED'].includes(i.status)) fail(400, 'This invitation cannot be resent.')
  i.status = 'PENDING'; i.token = crypto.randomUUID(); i.expiresAt = new Date(Date.now() + 7 * 86400000).toISOString()
  log(u, 'invitation.resent', 'invitation', i.id); save(); return clone(i)
})
route('invitation/lookup', ({ token }) => {
  const i = load().invitations.find((x) => x.token === token); if (!i) fail(404, 'This invitation link is not valid.')
  if (i.status === 'PENDING' && i.expiresAt < now()) i.status = 'EXPIRED'
  if (i.status !== 'PENDING') fail(400, `This invitation is ${i.status.toLowerCase()}.`)
  return { email: i.email, role: i.role, mapTitle: i.mapId ? mapOf(i.mapId).title : null }
})
route('invitation/accept', ({ token, name, password }) => { // public, by token
  const d = load(); const i = d.invitations.find((x) => x.token === token); if (!i) fail(404, 'This invitation link is not valid.')
  if (i.status === 'PENDING' && i.expiresAt < now()) { i.status = 'EXPIRED'; save() }
  if (i.status !== 'PENDING') fail(400, `This invitation is ${i.status.toLowerCase()}.`)
  if (!String(name || '').trim()) fail(400, 'Enter your name.')
  if (String(password || '').length < 4) fail(400, 'Password must be at least 4 characters (demo).')
  const u = { id: nextId('user'), name: name.trim(), email: i.email, roles: [i.role], password }
  d.users.push(u); i.status = 'ACCEPTED'; i.acceptedUserId = u.id
  if (i.mapId) addToTeam(i.mapId, u.id)
  localStorage.setItem(SESSION_KEY, String(u.id))
  log(u, 'invitation.accepted', 'invitation', i.id, 'PENDING', 'ACCEPTED'); notify([i.invitedBy], `${u.name} accepted your invitation.`, null); save(); return publicUser(u)
})

// ── folders ──
route('folder/list', () => { me(); return clone(load().folders) })
route('folder/create', ({ name, parent }) => {
  const u = me(); if (!hasRole(u, 'ADMIN')) fail(403, 'Only an admin can manage folders.')
  if (!String(name || '').trim()) fail(400, 'Folder name is required.')
  const f = { id: nextId('folder'), name: name.trim(), parent: parent || null }; load().folders.push(f); log(u, 'folder.created', 'folder', f.id); save(); return clone(f)
})
route('folder/edit/:pk', ({ name }, { pk }) => {
  const u = me(); if (!hasRole(u, 'ADMIN')) fail(403, 'Only an admin can manage folders.')
  const f = byId(load().folders, pk); if (!f) fail(404, 'Folder not found.'); if (!String(name || '').trim()) fail(400, 'Folder name is required.')
  f.name = name.trim(); log(u, 'folder.updated', 'folder', f.id); save(); return clone(f)
})
route('folder/delete/:pk', (_, { pk }) => {
  const u = me(); if (!hasRole(u, 'ADMIN')) fail(403, 'Only an admin can manage folders.')
  const d = load(); if (d.maps.some((m) => m.folderId === Number(pk))) fail(400, 'This folder still contains maps.')
  if (d.folders.some((f) => f.parent === Number(pk))) fail(400, 'This folder has sub-folders.')
  d.folders = d.folders.filter((f) => f.id !== Number(pk)); log(u, 'folder.deleted', 'folder', Number(pk)); save(); return {}
})

// ── maps ──
route('map/create', ({ title, description, folderId, visibility, reviewIntervalDays, tags }) => {
  const u = me(); const d = load()
  if (!hasRole(u, 'ADMIN', 'OWNER')) fail(403, 'Only owners and admins can initiate a map.')
  if (!String(title || '').trim()) fail(400, 'Title is required.')
  const folder = byId(d.folders, folderId); if (!folder) fail(400, 'Choose a folder.')
  const id = nextId('map'); const abbr = folder.name.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'GEN'
  const map = { id, code: `PM-${abbr}-${id}`, title: title.trim(), description: description || '', folderId: folder.id, ownerId: u.id,
    visibility: visibility === 'PUBLIC' ? 'PUBLIC' : 'INTERNAL', tags: tags || [], publishedVersionId: null, openVersionId: null,
    reviewIntervalDays: Number(reviewIntervalDays) || 365, nextReviewDue: null, viewsCount: 0, isArchived: false, searchText: '', createdAt: now() }
  d.maps.push(map); addToTeam(id, u.id, true)
  const v = { id: nextId('version'), mapId: id, versionNo: 1, status: 'PLANNING', changeNote: '', graphSnapshot: null, schemaVersion: 1, basedOn: null, createdBy: u.id, kickedOffAt: null, submittedAt: null, submittedBy: null, publishedAt: null }
  d.versions.push(v); map.openVersionId = v.id
  log(u, 'map.created', 'map', id, null, 'PLANNING'); save(); return mapView(map)
})
route('map/list', () => {
  const u = me(); const d = load()
  return d.maps.filter((m) => !m.isArchived && (hasRole(u, 'ADMIN') || canViewUnpublished(u, m))).map(mapView).reverse()
})
route('map/detail/:pk', (_, { pk }) => {
  const u = me(); const m = mapOf(pk); const d = load()
  if (!canViewUnpublished(u, m)) fail(403, 'You do not have access to this map.')
  const team = d.teams.filter((t) => t.mapId === m.id).map((t) => ({ ...publicUser(byId(d.users, t.userId)), isOwner: t.isOwner }))
  return { ...mapView(m), team, versions: d.versions.filter((v) => v.mapId === m.id).map(versionView).sort((a, b) => b.versionNo - a.versionNo) }
})
route('map/edit/:pk', (p, { pk }) => {
  const u = me(); const m = mapOf(pk); requireOwner(u, m)
  if (p.title !== undefined && !String(p.title).trim()) fail(400, 'Title is required.')
  for (const k of ['title', 'description', 'tags', 'visibility', 'folderId', 'reviewIntervalDays']) if (p[k] !== undefined) m[k] = p[k]
  log(u, 'map.updated', 'map', m.id); save(); return mapView(m)
})
route('map/archive/:pk', (_, { pk }) => {
  const u = me(); const m = mapOf(pk); requireOwner(u, m)
  if (m.openVersionId && byId(load().versions, m.openVersionId).status === 'IN_REVIEW') fail(400, 'Cannot archive a map that is in review.')
  m.isArchived = true; log(u, 'map.archived', 'map', m.id); save(); return {}
})

// ── versions ──
route('version/list/:pk', (_, { pk }) => {
  const u = me(); const m = mapOf(pk); if (!canViewUnpublished(u, m)) fail(403, 'No access.')
  return load().versions.filter((v) => v.mapId === m.id).map(versionView).sort((a, b) => b.versionNo - a.versionNo)
})
route('version/detail/:pk', (_, { pk }) => {
  const u = me(); const v = versionOf(pk); const m = mapOf(v.mapId)
  if (!canViewUnpublished(u, m)) fail(403, 'You do not have access to this version.')
  const inst = instanceOf(v.id)
  const pend = inst ? get_pending_approvers(inst) : []
  return {
    ...versionView(v), map: mapView(m),
    sections: sectionsOfVersion(v.id).map(sectionView),
    decisions: clone(load().decisions.filter((x) => load().sections.find((s) => s.id === x.sectionId)?.versionId === v.id)).map((x) => ({ ...x, reviewerName: userName(x.reviewerId) })),
    approval: inst && { ...clone(inst), pendingApprovers: pend.map((id) => ({ id, name: userName(id) })), canAct: pend.includes(u.id), actions: inst.actions.map((a) => ({ ...a, userName: userName(a.userId) })) },
    lint: ['PLANNING', 'IN_PROGRESS', 'CHANGES_REQUESTED'].includes(v.status) ? lintVersion(v) : null,
  }
})
route('version/lint/:pk', (_, { pk }) => { const u = me(); const v = versionOf(pk); requireOwner(u, mapOf(v.mapId)); return lintVersion(v) })
route('version/create-draft/:pk', ({ changeNote }, { pk }) => {
  const u = me(); const m = mapOf(pk); requireOwner(u, m); const d = load()
  if (!m.publishedVersionId) fail(400, 'Only a published map can be revised.')
  if (m.openVersionId) fail(400, 'This map already has a version in progress.')
  if (!String(changeNote || '').trim()) fail(400, 'A change note is required.')
  const prev = byId(d.versions, m.publishedVersionId)
  const v = { id: nextId('version'), mapId: m.id, versionNo: Math.max(...d.versions.filter((x) => x.mapId === m.id).map((x) => x.versionNo)) + 1, status: 'PLANNING', changeNote: changeNote.trim(), graphSnapshot: null, schemaVersion: 1, basedOn: prev.id, createdBy: u.id, kickedOffAt: null, submittedAt: null, submittedBy: null, publishedAt: null }
  d.versions.push(v); m.openVersionId = v.id
  for (const s of sectionsOfVersion(prev.id)) d.sections.push({ ...clone(s), id: nextId('section'), versionId: v.id, status: 'APPROVED', revision: 1, submittedAt: null })
  log(u, 'version.created', 'version', v.id, null, 'PLANNING', changeNote); notify(d.teams.filter((t) => t.mapId === m.id).map((t) => t.userId), `New version v${v.versionNo} of "${m.title}" was created.`, `/maps/${m.id}`)
  save(); return versionView(v)
})
route('version/kickoff/:pk', (_, { pk }) => {
  const u = me(); const v = versionOf(pk); const m = mapOf(v.mapId); requireOwner(u, m)
  if (v.status !== 'PLANNING') fail(400, 'Only a planning version can be kicked off.')
  const secs = sectionsOfVersion(v.id)
  if (!secs.length) fail(400, 'Add at least one section first.')
  const un = secs.filter((s) => !s.assigneeId); if (un.length) fail(400, `Every section needs an assignee. Missing: ${un.map((s) => s.title).join(', ')}.`)
  if (!secs.some((s) => s.status !== 'APPROVED')) fail(400, 'Reopen at least one section before kicking off.')
  v.status = 'IN_PROGRESS'; v.kickedOffAt = now()
  log(u, 'version.kickoff', 'version', v.id, 'PLANNING', 'IN_PROGRESS')
  notify(secs.filter((s) => s.status !== 'APPROVED').map((s) => s.assigneeId), `"${m.title}" has kicked off. Your section is ready.`, `/maps/${m.id}/canvas`)
  save(); return versionView(v)
})
route('version/submit/:pk', (_, { pk }) => { // submit for publication
  const u = me(); const v = versionOf(pk); const m = mapOf(v.mapId); requireOwner(u, m); const d = load()
  if (v.status !== 'IN_PROGRESS') fail(400, 'Only a version in progress can be submitted.')
  const secs = sectionsOfVersion(v.id)
  if (!secs.length || secs.some((s) => s.status !== 'APPROVED')) fail(400, 'Every section must be approved before submitting.')
  const lint = lintVersion(v); if (lint.blocking.length) fail(422, 'Map lint found blocking problems.', lint)
  if (d.chain.enabled) {
    const probe = { submitterId: u.id }
    const ok = d.chain.stages.length && d.chain.stages.every((st) => eligibleApprovers(probe, st).length > 0)
    if (!ok) fail(400, 'The approval chain has no eligible approver (you cannot approve your own submission). Ask an admin to review the chain.')
  }
  v.graphSnapshot = buildSnapshot(v); v.submittedAt = now(); v.submittedBy = u.id
  if (!d.chain.enabled) { v.status = 'IN_REVIEW'; publish(v, u); save(); return versionView(v) }
  v.status = 'IN_REVIEW'; const inst = create_instance(v, u)
  log(u, 'version.submitted', 'version', v.id, 'IN_PROGRESS', 'IN_REVIEW')
  notify(get_pending_approvers(inst), `"${m.title}" v${v.versionNo} is waiting for your approval.`, '/reviews')
  save(); return versionView(v)
})
function versionDecision(kind) {
  return ({ note }, { pk }) => {
    const u = me(); const v = versionOf(pk); const m = mapOf(v.mapId)
    if (v.status !== 'IN_REVIEW') fail(400, 'This version is not in review.')
    const inst = instanceOf(v.id); if (!inst || inst.status !== 'PENDING') fail(400, 'No open approval for this version.')
    if (kind === 'REJECT' && !String(note || '').trim()) fail(400, 'A note is required when rejecting.')
    const result = record_action(inst, u, kind, note)
    if (result === 'REJECTED') {
      v.status = 'CHANGES_REQUESTED'
      load().comments.push({ id: nextId('comment'), mapId: m.id, versionId: v.id, sectionId: null, nodeId: null, parentId: null, kind: 'REVISION', body: note.trim(), authorId: u.id, status: 'OPEN', resolvedBy: null, resolvedAt: null, createdAt: now() })
      log(u, 'version.rejected', 'version', v.id, 'IN_REVIEW', 'CHANGES_REQUESTED', note)
      notify([m.ownerId, v.submittedBy], `"${m.title}" v${v.versionNo} was rejected: ${note.trim()}`, `/maps/${m.id}`)
    } else if (result === 'APPROVED') { log(u, 'approval.stage', 'version', v.id, null, 'APPROVED', note); publish(v, u) }
    else { log(u, 'approval.stage', 'version', v.id, null, result, note); if (result === 'STAGE_ADVANCED') notify(get_pending_approvers(inst), `"${m.title}" v${v.versionNo} reached your approval stage.`, '/reviews') }
    save(); return versionView(v)
  }
}
route('version/approve/:pk', versionDecision('APPROVE'))
route('version/reject/:pk', versionDecision('REJECT'))
route('version/reopen/:pk', ({ sectionIds, assignees }, { pk }) => {
  const u = me(); const v = versionOf(pk); const m = mapOf(v.mapId); requireOwner(u, m); const d = load()
  if (!['CHANGES_REQUESTED', 'PLANNING'].includes(v.status)) fail(400, 'Sections can be reopened after a rejection or while planning a new version.')
  if (!Array.isArray(sectionIds) || !sectionIds.length) fail(400, 'Choose at least one section to reopen.')
  const targets = sectionIds.map(sectionOf)
  if (targets.some((s) => s.versionId !== v.id)) fail(400, 'Section does not belong to this version.')
  for (const s of targets) {
    const nu = assignees?.[s.id]; if (nu) { s.assigneeId = Number(nu); addToTeam(m.id, Number(nu)) }
    if (!s.assigneeId) fail(400, `"${s.title}" needs an assignee.`)
    log(u, 'section.reopened', 'section', s.id, s.status, 'ASSIGNED'); s.status = 'ASSIGNED'; s.approvedAt = null; s.approvedBy = null; s.submittedAt = null
  }
  if (v.status === 'CHANGES_REQUESTED') {
    d.comments.filter((c) => c.versionId === v.id && c.kind === 'REVISION' && c.sectionId === null && c.status === 'OPEN').forEach((c) => { c.status = 'RESOLVED'; c.resolvedBy = u.id; c.resolvedAt = now() })
    v.status = 'IN_PROGRESS'; log(u, 'version.reopened', 'version', v.id, 'CHANGES_REQUESTED', 'IN_PROGRESS')
    notify(targets.map((s) => s.assigneeId), `A section of "${m.title}" was reopened for you.`, `/maps/${m.id}/canvas`)
  }
  save(); return sectionsOfVersion(v.id).map(sectionView)
})

// ── sections ──
const EDITABLE_VERSION = ['PLANNING', 'IN_PROGRESS', 'CHANGES_REQUESTED']
route('section/create', ({ versionId, title, description, dueDate, assigneeId }) => {
  const u = me(); const v = versionOf(versionId); const m = mapOf(v.mapId); requireOwner(u, m); const d = load()
  if (!EDITABLE_VERSION.includes(v.status)) fail(400, 'Sections can only be added while planning, in progress or after changes were requested.')
  if (!String(title || '').trim()) fail(400, 'Section title is required.')
  const order = sectionsOfVersion(v.id).length
  const s = { id: nextId('section'), versionId: v.id, title: title.trim(), description: description || '', order, frame: { x: 40, y: 40 + order * 440, width: 960, height: 400 }, assigneeId: null, status: 'UNASSIGNED',
    graph: { schema_version: 1, nodes: [], edges: [] }, revision: 1, dueDate: dueDate || null, submittedAt: null, approvedBy: null, approvedAt: null }
  d.sections.push(s)
  if (assigneeId) { s.assigneeId = Number(assigneeId); s.status = 'ASSIGNED'; addToTeam(m.id, s.assigneeId) }
  log(u, 'section.created', 'section', s.id, null, s.status); save(); return sectionView(s)
})
route('section/edit/:pk', (p, { pk }) => {
  const u = me(); const s = sectionOf(pk); const v = versionOf(s.versionId); requireOwner(u, mapOf(v.mapId))
  if (!EDITABLE_VERSION.includes(v.status)) fail(400, 'This version can no longer be changed.')
  if (p.title !== undefined && !String(p.title).trim()) fail(400, 'Section title is required.')
  for (const k of ['title', 'description', 'dueDate', 'order']) if (p[k] !== undefined) s[k] = p[k]
  if (p.frame) s.frame = { ...s.frame, ...p.frame }
  log(u, 'section.updated', 'section', s.id); save(); return sectionView(s)
})
route('section/assign/:pk', ({ assigneeId }, { pk }) => {
  const u = me(); const s = sectionOf(pk); const v = versionOf(s.versionId); const m = mapOf(v.mapId); requireOwner(u, m)
  if (!EDITABLE_VERSION.includes(v.status)) fail(400, 'This version can no longer be changed.')
  if (s.status === 'APPROVED') fail(400, 'Reopen an approved section before reassigning it.')
  const target = byId(load().users, assigneeId); if (!target || !hasRole(target, 'CONTRIBUTOR', 'OWNER', 'ADMIN')) fail(400, 'Choose a contributor (or an owner).')
  if (target.roles.includes('ADMIN') && !target.roles.some((r) => ['CONTRIBUTOR', 'OWNER'].includes(r))) fail(400, 'Admins cannot be assigned sections; choose a contributor or owner.')
  const from = s.status; s.assigneeId = target.id; if (s.status === 'UNASSIGNED') s.status = 'ASSIGNED'
  addToTeam(m.id, target.id); log(u, 'section.assigned', 'section', s.id, from, s.status, target.name)
  notify([target.id], `You were assigned "${s.title}" in "${m.title}".`, `/maps/${m.id}`); save(); return sectionView(s)
})
route('section/delete/:pk', (_, { pk }) => {
  const u = me(); const s = sectionOf(pk); const v = versionOf(s.versionId); requireOwner(u, mapOf(v.mapId))
  if (!EDITABLE_VERSION.includes(v.status)) fail(400, 'This version can no longer be changed.')
  if (s.graph.nodes.length) fail(400, 'Only empty sections can be deleted.')
  const d = load(); d.sections = d.sections.filter((x) => x.id !== s.id); log(u, 'section.deleted', 'section', s.id); save(); return {}
})
route('section/open/:pk', (_, { pk }) => { const u = me(); const s = sectionOf(pk); load().presence[s.id] = { userId: u.id, at: Date.now() }; save(); return {} })
route('section/save/:pk', ({ graph, revision, frame }, { pk }) => {
  const u = me(); const s = sectionOf(pk); const v = versionOf(s.versionId); const m = mapOf(v.mapId); const d = load()
  // Server-side authorization: role, assignment and status are all re-checked on every write.
  if (!hasRole(u, 'CONTRIBUTOR', 'OWNER') || s.assigneeId !== u.id) fail(403, 'You are not assigned to this section.')
  if (v.status !== 'IN_PROGRESS') fail(409, 'This version is not open for editing.')
  if (['APPROVED', 'SUBMITTED'].includes(s.status)) fail(409, `This section is ${s.status.toLowerCase()} and cannot be edited.`)
  if (Number(revision) !== s.revision) fail(409, 'This section was changed elsewhere. Reload to get the latest version.', { currentRevision: s.revision })
  if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) fail(400, 'Invalid graph.')
  const TYPES = ['start', 'end', 'task', 'decision', 'subprocess', 'document', 'note']
  const others = d.sections.filter((x) => x.versionId === v.id && x.id !== s.id)
  const otherIds = new Set(others.flatMap((x) => x.graph.nodes.map((n) => n.id)))
  const mine = new Set()
  for (const n of graph.nodes) {
    if (!TYPES.includes(n.type)) fail(400, `Unknown shape "${n.type}".`)
    if (!/^n_/.test(n.id || '') || mine.has(n.id) || otherIds.has(n.id)) fail(400, 'Node ids must be unique across the whole map.')
    mine.add(n.id)
  }
  for (const e of graph.edges) if (!mine.has(e.source)) fail(400, 'A connection must start from a step in your own section.')
  const removed = s.graph.nodes.map((n) => n.id).filter((id) => !mine.has(id))
  const refs = others.filter((x) => x.graph.edges.some((e) => removed.includes(e.target)))
  if (refs.length) fail(409, `Cannot delete steps that other sections connect to. Referenced by: ${refs.map((x) => x.title).join(', ')}.`, { sections: refs.map((x) => x.title) })
  s.graph = { schema_version: 1, nodes: clone(graph.nodes), edges: clone(graph.edges) }
  if (frame && hasRole(u, 'ADMIN')) s.frame = frame
  s.revision += 1
  if (['ASSIGNED', 'CHANGES_REQUESTED'].includes(s.status)) { log(u, 'section.started', 'section', s.id, s.status, 'IN_PROGRESS'); s.status = 'IN_PROGRESS' }
  save(); return { revision: s.revision, status: s.status, savedAt: now() }
})
route('section/submit/:pk', (_, { pk }) => {
  const u = me(); const s = sectionOf(pk); const v = versionOf(s.versionId); const m = mapOf(v.mapId); const d = load()
  if (s.assigneeId !== u.id) fail(403, 'You are not assigned to this section.')
  if (v.status !== 'IN_PROGRESS') fail(409, 'This version is not open for editing.')
  if (s.status !== 'IN_PROGRESS') fail(400, s.status === 'CHANGES_REQUESTED' ? 'Make a change before resubmitting.' : `A ${s.status.toLowerCase()} section cannot be submitted.`)
  const open = d.comments.filter((c) => c.versionId === v.id && c.sectionId === s.id && c.kind === 'REVISION' && c.status === 'OPEN')
  if (open.length) fail(400, `Resolve ${open.length} open revision comment(s) before submitting.`)
  s.status = 'SUBMITTED'; s.submittedAt = now(); log(u, 'section.submitted', 'section', s.id, 'IN_PROGRESS', 'SUBMITTED')
  notify([m.ownerId], `${u.name} submitted "${s.title}" for review.`, `/maps/${m.id}`); save(); return sectionView(s)
})
route('section/approve/:pk', ({ note }, { pk }) => { // Gate 1
  const u = me(); const s = sectionOf(pk); const v = versionOf(s.versionId); const m = mapOf(v.mapId); requireOwner(u, m)
  if (s.status !== 'SUBMITTED') fail(400, 'Only a submitted section can be approved.')
  s.status = 'APPROVED'; s.approvedBy = u.id; s.approvedAt = now()
  load().decisions.push({ id: nextId('decision'), sectionId: s.id, reviewerId: u.id, decision: 'APPROVED', note: note || '', createdAt: now() })
  log(u, 'section.approved', 'section', s.id, 'SUBMITTED', 'APPROVED', note); notify([s.assigneeId], `"${s.title}" was approved.`, `/maps/${m.id}`); save(); return sectionView(s)
})
route('section/request-changes/:pk', ({ note }, { pk }) => {
  const u = me(); const s = sectionOf(pk); const v = versionOf(s.versionId); const m = mapOf(v.mapId); requireOwner(u, m)
  if (s.status !== 'SUBMITTED') fail(400, 'Only a submitted section can have changes requested.')
  if (!String(note || '').trim()) fail(400, 'A note is required when requesting changes.')
  const d = load(); s.status = 'CHANGES_REQUESTED'
  d.decisions.push({ id: nextId('decision'), sectionId: s.id, reviewerId: u.id, decision: 'CHANGES_REQUESTED', note: note.trim(), createdAt: now() })
  d.comments.push({ id: nextId('comment'), mapId: m.id, versionId: v.id, sectionId: s.id, nodeId: null, parentId: null, kind: 'REVISION', body: note.trim(), authorId: u.id, status: 'OPEN', resolvedBy: null, resolvedAt: null, createdAt: now() })
  log(u, 'section.changes_requested', 'section', s.id, 'SUBMITTED', 'CHANGES_REQUESTED', note)
  notify([s.assigneeId], `Changes requested on "${s.title}": ${note.trim()}`, `/maps/${m.id}/canvas`); save(); return sectionView(s)
})
route('section/my-assignments', () => {
  const u = me(); const d = load()
  return d.sections.filter((s) => s.assigneeId === u.id).map((s) => {
    const v = byId(d.versions, s.versionId); const m = byId(d.maps, v.mapId)
    return { ...sectionView(s), mapId: m.id, mapTitle: m.title, mapCode: m.code, versionNo: v.versionNo, versionStatus: v.status,
      openRevisions: d.comments.filter((c) => c.sectionId === s.id && c.kind === 'REVISION' && c.status === 'OPEN').length }
  }).filter((s) => ['IN_PROGRESS', 'PLANNING', 'CHANGES_REQUESTED'].includes(s.versionStatus)).reverse()
})

// ── comments ──
route('comment/create', ({ mapId, versionId, sectionId, nodeId, parentId, kind = 'COMMENT', body }) => {
  const u = me(); const m = mapOf(mapId); const d = load(); const v = versionId ? versionOf(versionId) : byId(d.versions, m.openVersionId)
  if (!v || v.mapId !== m.id) fail(400, 'Invalid version.')
  if (!String(body || '').trim()) fail(400, 'Write a comment first.')
  if (!['COMMENT', 'REVISION'].includes(kind)) fail(400, 'Feedback is sent from the portal.')
  const approverInReview = hasRole(u, 'APPROVER') && v.status === 'IN_REVIEW'
  if (kind === 'COMMENT' && !(isOwnerOf(u, m) || inTeam(u, m) || approverInReview)) fail(403, 'You cannot comment on this map.')
  if (kind === 'REVISION' && !(isOwnerOf(u, m) || approverInReview)) fail(403, 'Only owners and approvers can add revision comments.')
  const c = { id: nextId('comment'), mapId: m.id, versionId: v.id, sectionId: sectionId || null, nodeId: nodeId || null, parentId: parentId || null, kind, body: body.trim(), authorId: u.id, status: 'OPEN', resolvedBy: null, resolvedAt: null, createdAt: now() }
  d.comments.push(c); log(u, 'comment.created', 'comment', c.id, null, kind)
  if (kind === 'REVISION') notify([m.ownerId, ...(sectionId ? [sectionOf(sectionId).assigneeId] : [])].filter((x) => x !== u.id), `Revision comment on "${m.title}": ${c.body}`, `/maps/${m.id}`)
  save(); return { ...clone(c), authorName: u.name }
})
route('comment/list/:pk', (_, { pk }) => {
  const u = me(); const m = mapOf(pk); if (!canViewUnpublished(u, m)) fail(403, 'No access.')
  return clone(load().comments.filter((c) => c.mapId === m.id)).map((c) => ({ ...c, authorName: userName(c.authorId) })).reverse()
})
route('comment/resolve/:pk', (_, { pk }) => {
  const u = me(); const c = byId(load().comments, pk); if (!c) fail(404, 'Comment not found.'); const m = mapOf(c.mapId)
  const sec = c.sectionId ? byId(load().sections, c.sectionId) : null
  const may = isOwnerOf(u, m) || (sec && sec.assigneeId === u.id && c.kind !== 'FEEDBACK')
  if (!may) fail(403, 'You cannot resolve this comment.')
  if (c.status === 'RESOLVED') fail(400, 'Already resolved.')
  c.status = 'RESOLVED'; c.resolvedBy = u.id; c.resolvedAt = now(); log(u, 'comment.resolved', 'comment', c.id, 'OPEN', 'RESOLVED'); save(); return clone(c)
})

// ── attachments ──
route('attachment/upload', ({ mapId, versionId, sectionId, nodeId, ogTitle, attachTitle, category, dataUrl, size }) => {
  const u = me(); const m = mapOf(mapId); const d = load(); const v = versionId ? versionOf(versionId) : byId(d.versions, m.openVersionId || m.publishedVersionId)
  if (!(isOwnerOf(u, m) || inTeam(u, m))) fail(403, 'You cannot attach documents to this map.')
  if (!dataUrl) fail(400, 'Choose a file.'); if (size > 600 * 1024) fail(413, 'Demo storage limit is 600 KB per file.')
  const a = { id: nextId('attachment'), mapId: m.id, versionId: v.id, sectionId: sectionId || null, nodeId: nodeId || null, ogTitle, attachTitle: attachTitle || ogTitle, category: category || 'General', visibility: 'INTERNAL', uploadedBy: u.id, dataUrl, size, createdAt: now() }
  d.attachments.push(a); log(u, 'attachment.uploaded', 'attachment', a.id, null, null, a.attachTitle); save(); const { dataUrl: _x, ...rest } = a; return rest
})
route('attachment/list/:pk', (_, { pk }) => {
  const u = me(); const m = mapOf(pk); if (!canViewUnpublished(u, m)) fail(403, 'No access.')
  return load().attachments.filter((a) => a.mapId === m.id).map(({ dataUrl, ...r }) => ({ ...r, uploaderName: userName(r.uploadedBy) })).reverse()
})
route('attachment/download/:pk', (_, { pk }) => {
  const a = byId(load().attachments, pk); if (!a) fail(404, 'Not found.'); const m = mapOf(a.mapId); const u = me(false)
  const portalOk = a.visibility === 'PORTAL' && m.publishedVersionId && u
  if (!(canViewUnpublished(u, m) || portalOk)) fail(403, 'No access.')
  return { name: a.ogTitle, dataUrl: a.dataUrl }
})
route('attachment/delete/:pk', (_, { pk }) => {
  const u = me(); const d = load(); const a = byId(d.attachments, pk); if (!a) fail(404, 'Not found.'); const m = mapOf(a.mapId)
  if (!(isOwnerOf(u, m) || a.uploadedBy === u.id)) fail(403, 'You cannot delete this attachment.')
  const v = byId(d.versions, a.versionId); if (v && ['IN_REVIEW', 'PUBLISHED', 'SUPERSEDED'].includes(v.status)) fail(409, 'Attachments on a submitted or published version cannot be deleted.')
  d.attachments = d.attachments.filter((x) => x.id !== a.id); log(u, 'attachment.deleted', 'attachment', a.id); save(); return {}
})
route('attachment/toggle-portal/:pk', (_, { pk }) => {
  const u = me(); const a = byId(load().attachments, pk); if (!a) fail(404, 'Not found.'); requireOwner(u, mapOf(a.mapId))
  a.visibility = a.visibility === 'PORTAL' ? 'INTERNAL' : 'PORTAL'; log(u, 'attachment.visibility', 'attachment', a.id, null, a.visibility); save(); return { id: a.id, visibility: a.visibility }
})

// ── published maps: read-only, login required, only PUBLISHED versions, served from graph_snapshot ──
function portalMaps() { return load().maps.filter((m) => !m.isArchived && m.publishedVersionId) }
function portalItem(m) { const v = byId(load().versions, m.publishedVersionId); return { id: m.id, code: m.code, title: m.title, description: m.description, folderName: byId(load().folders, m.folderId)?.name, tags: m.tags, versionNo: v.versionNo, publishedAt: v.publishedAt, viewsCount: m.viewsCount, visibility: m.visibility } }
route('published/map/list', () => { me(); return portalMaps().map(portalItem) })
route('published/map/detail/:pk', (_, { pk }) => {
  me(); const m = mapOf(pk); const d = load()
  if (!m.publishedVersionId || m.isArchived) fail(404, 'This map is not published.')
  const v = byId(d.versions, m.publishedVersionId); m.viewsCount += 1; save()
  return { ...portalItem(m), ownerName: userName(m.ownerId), changeNote: v.changeNote, snapshot: clone(v.graphSnapshot),
    attachments: d.attachments.filter((a) => a.mapId === m.id && a.visibility === 'PORTAL' && a.versionId <= v.id).map(({ dataUrl, ...r }) => r) }
})
route('published/search', ({ q }) => {
  const terms = String(q || '').toLowerCase().split(/\s+/).filter(Boolean); if (!terms.length) return []
  me(); return portalMaps().map((m) => ({ m, score: terms.reduce((n, t) => n + (m.searchText.includes(t) ? 1 + (m.title.toLowerCase().includes(t) ? 2 : 0) : -100), 0) }))
    .filter((x) => x.score > 0).sort((a, b) => b.score - a.score).map((x) => portalItem(x.m))
})
route('published/feedback/create', ({ mapId, nodeId, body }) => {
  const u = me(); const m = mapOf(mapId); const d = load()
  if (!m.publishedVersionId) fail(404, 'This map is not published.'); if (!String(body || '').trim()) fail(400, 'Write your feedback first.')
  const c = { id: nextId('comment'), mapId: m.id, versionId: m.publishedVersionId, sectionId: null, nodeId: nodeId || null, parentId: null, kind: 'FEEDBACK', body: body.trim(), authorId: u.id, status: 'OPEN', resolvedBy: null, resolvedAt: null, createdAt: now() }
  d.comments.push(c); log(u, 'feedback.received', 'comment', c.id); notify([m.ownerId], `New feedback on "${m.title}" from ${u.name}.`, `/maps/${m.id}`); save(); return clone(c)
})

// ── approval chain config & state ──
route('approval-chain/preset-list/PROCESS_MAP', () => { me(); return clone(load().chain) })
route('approval-chain/save/PROCESS_MAP', ({ enabled, stages }) => {
  const u = me(); if (!hasRole(u, 'ADMIN')) fail(403, 'Only an admin can configure the approval chain.'); const d = load()
  if (enabled && (!Array.isArray(stages) || !stages.length)) fail(400, 'Add at least one stage, or disable the chain.')
  for (const s of stages || []) {
    if (!String(s.name || '').trim()) fail(400, 'Every stage needs a name.')
    if (!['ANY_ONE', 'ALL'].includes(s.rule)) fail(400, 'Choose a rule for each stage.')
    if (!s.approvers?.length) fail(400, `Stage "${s.name}" needs at least one approver.`)
    if (s.approvers.some((id) => !hasRole(byId(d.users, id), 'APPROVER'))) fail(400, 'Stage approvers must hold the APPROVER role.')
  }
  d.chain = { enabled: !!enabled, stages: (stages || []).map((s, i) => ({ id: i + 1, name: s.name.trim(), rule: s.rule, approvers: s.approvers.map(Number) })) }
  log(u, 'approval-chain.updated', 'chain', 1, null, enabled ? 'ENABLED' : 'DISABLED'); save(); return clone(d.chain)
})
route('approval-chain/instance/state/PROCESS_MAP/:pk', (_, { pk }) => {
  const u = me(); const v = versionOf(pk); if (!canViewUnpublished(u, mapOf(v.mapId))) fail(403, 'No access.'); const inst = instanceOf(pk); if (!inst) return null
  return { ...clone(inst), pendingApprovers: get_pending_approvers(inst).map((id) => ({ id, name: userName(id) })), actions: inst.actions.map((a) => ({ ...a, userName: userName(a.userId) })) }
})
route('review/inbox', () => { // approver inbox
  const u = me(); const d = load()
  return d.instances.filter((i) => i.status === 'PENDING' && get_pending_approvers(i).includes(u.id)).map((i) => {
    const v = byId(d.versions, i.versionId); const m = byId(d.maps, v.mapId)
    return { versionId: v.id, versionNo: v.versionNo, mapId: m.id, mapTitle: m.title, mapCode: m.code, submittedBy: userName(i.submitterId), submittedAt: v.submittedAt, stage: i.stages[i.stageIdx].name }
  })
})

// ── notifications / activity / dashboard ──
route('notification/list', () => { const u = me(); return clone(load().notifications.filter((n) => n.userId === u.id).reverse().slice(0, 50)) })
route('notification/read-all', () => { const u = me(); load().notifications.forEach((n) => { if (n.userId === u.id) n.read = true }); save(); return {} })
route('activity/list', ({ mapId } = {}) => {
  const u = me(); const d = load()
  if (mapId) {
    const m = mapOf(mapId); if (!canViewUnpublished(u, m)) fail(403, 'No access.')
    const vids = d.versions.filter((v) => v.mapId === m.id).map((v) => v.id); const sids = d.sections.filter((s) => vids.includes(s.versionId)).map((s) => s.id)
    return clone(d.activity.filter((a) => (a.object === 'map' && a.objectId === m.id) || (a.object === 'version' && vids.includes(a.objectId)) || (a.object === 'section' && sids.includes(a.objectId)) || (a.object === 'comment' && d.comments.find((c) => c.id === a.objectId)?.mapId === m.id) || (a.object === 'attachment' && d.attachments.find((x) => x.id === a.objectId)?.mapId === m.id)).reverse().slice(0, 100)).map((a) => ({ ...a, userName: a.userId ? userName(a.userId) : 'System' }))
  }
  if (!hasRole(u, 'ADMIN')) fail(403, 'Only an admin can view the full activity log.')
  return clone(d.activity.slice().reverse().slice(0, 200)).map((a) => ({ ...a, userName: a.userId ? userName(a.userId) : 'System' }))
})
route('dashboard/summary', () => {
  const u = me(); const d = load(); const out = { roles: u.roles }
  const myMaps = d.maps.filter((m) => !m.isArchived && (hasRole(u, 'ADMIN') || (hasRole(u, 'OWNER') && m.ownerId === u.id)))
  if (hasRole(u, 'ADMIN', 'OWNER')) {
    const views = myMaps.map(mapView); const by = {}
    views.forEach((m) => { by[m.status] = (by[m.status] || 0) + 1 })
    out.mapsByStatus = by; out.totalMaps = views.length
    out.sectionsAwaitingApproval = d.sections.filter((s) => s.status === 'SUBMITTED' && myMaps.some((m) => byId(d.versions, s.versionId).mapId === m.id)).map((s) => ({ id: s.id, title: s.title, mapId: byId(d.versions, s.versionId).mapId, mapTitle: byId(d.maps, byId(d.versions, s.versionId).mapId).title }))
  }
  if (hasRole(u, 'APPROVER')) out.pendingReviews = d.instances.filter((i) => i.status === 'PENDING' && get_pending_approvers(i).includes(u.id)).length
  if (hasRole(u, 'CONTRIBUTOR', 'OWNER')) out.mySections = d.sections.filter((s) => s.assigneeId === u.id && ['ASSIGNED', 'IN_PROGRESS', 'CHANGES_REQUESTED'].includes(s.status)).length
  if (hasRole(u, 'ADMIN')) {
    out.reviewsOverdue = d.maps.filter((m) => !m.isArchived && m.publishedVersionId && m.nextReviewDue && m.nextReviewDue < now()).map((m) => ({ id: m.id, title: m.title, due: m.nextReviewDue }))
    out.openFeedback = d.comments.filter((c) => c.kind === 'FEEDBACK' && c.status === 'OPEN').length
    out.mostViewed = d.maps.filter((m) => m.publishedVersionId).sort((a, b) => b.viewsCount - a.viewsCount).slice(0, 5).map((m) => ({ id: m.id, title: m.title, views: m.viewsCount }))
    out.userCount = d.users.length
  }
  return out
})

// ───────────────────────── dispatcher ─────────────────────────
const compiled = Object.keys(H).map((p) => {
  const names = []; const rx = new RegExp('^' + p.replace(/:([a-z]+)/g, (_, n) => { names.push(n); return '([^/]+)' }) + '$')
  return { rx, names, fn: H[p] }
})
export function dispatch(path, payload = {}) {
  load()
  for (const r of compiled) {
    const m = r.rx.exec(path); if (!m) continue
    const params = {}; r.names.forEach((n, i) => { params[n] = decodeURIComponent(m[i + 1]) })
    try { return { code: 200, response: 'ok', data: clone(r.fn(payload || {}, params)) } }
    catch (e) {
      if (e instanceof ApiError) { if (e.code >= 400) save(); throw e }
      throw e
    }
  }
  throw new ApiError(404, `Unknown endpoint: ${path}`)
}
