// Sample data for the browser demo. Built by driving the real API, so every state is one the server allows.
// Not used by the tests (they import server.js directly and start from the bare seed).
import { dispatch, needsSample, markSampleDone } from './server.js'

const id = () => `a_${crypto.randomUUID()}`
const as = (email) => dispatch('auth/login', { email, password: 'demo' }).data
const call = (path, payload) => dispatch(path, payload).data
const days = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10)

// Role ids: 1 HR Officer, 2 IT Support, 3 Line Manager, 4 Payroll. System ids: 1 HRIS, 2 Service Desk, 3 Email.
const act = (label, role_id, tasks = [], extra = {}) => ({ id: id(), kind: 'activity', label, role_id, system_id: null, tasks: tasks.map((text) => ({ id: `t_${crypto.randomUUID()}`, text })), notes: '', attachment_ids: [], linked_map_id: null, ...extra })
const dec = (label, role_id, yes, no) => ({ id: id(), kind: 'decision', label, role_id, system_id: null, tasks: [], notes: '', attachment_ids: [], linked_map_id: null, yes, no })
const save = (sec, revision, activities) => call(`section/save/${sec.id}`, { revision, activities })

export function ensureSample() {
  if (!needsSample()) return
  try { build() } catch (e) { console.warn('Sample data not fully built:', e.message) } finally { try { dispatch('auth/logout') } catch { /* ignore */ } markSampleDone() }
}

function build() {
  as('admin@demo.test')
  const uid = (email) => call('user/list').find((u) => u.email === email).id
  const folder = (n) => call('folder/list').find((f) => f.name === n).id
  const hugo = uid('hr.contrib@demo.test')
  const ivy = uid('it.contrib@demo.test')
  const owner = uid('owner@demo.test')
  call(`folder/edit/${folder('HR')}`, { defaultExpertId: hugo, defaultMemberIds: [ivy] })

  // 1. Published map: New Employee Onboarding
  as('owner@demo.test')
  const m1 = call('map/create', { title: 'New Employee Onboarding', description: 'From signed offer to the 30-day review.', objective: 'Get new starters productive within their first month.', folderId: folder('HR'), reviewIntervalDays: 365, tags: ['onboarding', 'people'] })
  const v1 = m1.openVersion.id
  const s1 = call('section/create', { versionId: v1, title: 'HR administration', assigneeId: hugo })
  const s2 = call('section/create', { versionId: v1, title: 'IT setup', assigneeId: ivy })
  const s3 = call('section/create', { versionId: v1, title: 'Line manager tasks', assigneeId: owner })
  call(`version/kickoff/${v1}`)
  const hrA = act('Create employee record', 1, ['Enter personal details', 'Set start date and position'], { system_id: 1 })
  const hrB = act('Issue employment contract', 1, ['Send contract for e-signature', 'File the signed copy'])
  const itA = act('Provision laptop', 2, ['Image the laptop', 'Assign asset tag'], { system_id: 2 })
  const itC = act('Ship laptop to home address', 2, ['Book courier'])
  const itD = act('Hand over laptop at the desk', 2, ['Walk through first login'])
  const itB = dec('Remote worker?', 2, itC.id, itD.id)
  const itE = act('Enrol MFA and create mailbox', 2, ['Create account', 'Enrol authenticator app'], { system_id: 3 })
  hrB.next = itA.id
  const lm1 = act('Schedule 1:1 catch-ups', 3, ['Weekly for the first month'])
  const lm2 = act('Run 30-day review', 3, ['Agree goals for the next quarter'], { next: 'END' })
  as('it.contrib@demo.test'); save(s2, 1, [itA, itB, itC, itD, itE]); call(`section/submit/${s2.id}`, { changeDescription: 'Laptop provisioning and accounts' })
  as('hr.contrib@demo.test'); save(s1, 1, [hrA, hrB]); call(`section/submit/${s1.id}`, { changeDescription: 'Wrote the HR administration steps' })
  as('owner@demo.test'); save(s3, 1, [lm1, lm2]); call(`section/submit/${s3.id}`, { changeDescription: 'Manager follow-up tasks' })
  for (const s of [s1, s2, s3]) call(`section/approve/${s.id}`)
  call(`version/submit/${v1}`, { changeDescription: 'First full version of the onboarding process' })
  as('approver@demo.test'); call(`version/approve/${v1}`, { note: 'Approved by the Process Council' })
  as('viewer@demo.test')
  for (let i = 0; i < 6; i++) call(`published/map/detail/${m1.id}`)
  call('published/feedback/create', { mapId: m1.id, activityId: itB.id, body: 'Which laptop model do remote staff receive?', responseRequired: true })

  // 2. In progress: IT Access Request (one section submitted, one being written, one untouched)
  as('owner@demo.test')
  const m2 = call('map/create', { title: 'IT Access Request', description: 'How staff request and receive system access.', objective: 'Give people the right access, quickly and audited.', folderId: folder('IT'), reviewIntervalDays: 180, tags: ['access', 'security'] })
  const v2 = m2.openVersion.id
  const a1 = call('section/create', { versionId: v2, title: 'Raise the request', assigneeId: ivy })
  const a2 = call('section/create', { versionId: v2, title: 'Approve and grant', assigneeId: hugo })
  call('section/create', { versionId: v2, title: 'Review access yearly', assigneeId: owner })
  call(`version/kickoff/${v2}`)
  as('it.contrib@demo.test')
  save(a1, 1, [act('Submit access request', 3, ['Pick the system', 'State the business reason'], { system_id: 2 }), act('Check request is complete', 2, ['Confirm manager approval attached'])])
  call(`section/submit/${a1.id}`, { changeDescription: 'Request steps drafted' })
  as('hr.contrib@demo.test')
  save(a2, 1, [act('Approve access', 3, ['Review the business reason']), act('Grant access', 2, ['Create the account', 'Notify the requester'], { system_id: 2 })])

  // 3. Just kicked off: Expense Reimbursement
  as('owner@demo.test')
  const m3 = call('map/create', { title: 'Expense Reimbursement', description: 'Claiming and paying back work expenses.', objective: 'Pay valid claims within five working days.', folderId: folder('Finance'), reviewIntervalDays: 365, tags: ['finance'] })
  call('section/create', { versionId: m3.openVersion.id, title: 'Submit a claim', assigneeId: hugo })
  call('section/create', { versionId: m3.openVersion.id, title: 'Approve and pay', assigneeId: owner })
  call(`version/kickoff/${m3.openVersion.id}`)

  // To-dos
  call('todo/create', { mapId: m1.id, title: 'Add the contractor path to onboarding', note: 'Contractors skip the HRIS record.', assigneeId: owner, dueDate: days(14) })
  call('todo/create', { mapId: m2.id, title: 'Finish the approval steps', note: 'The approved or declined decision is still missing.', assigneeId: hugo, dueDate: days(3) })
  call('todo/create', { mapId: m2.id, title: 'Confirm MFA wording with Security', assigneeId: ivy, dueDate: days(-2) })
  call('todo/create', { mapId: m3.id, title: 'Collect the current claim form from Finance', assigneeId: hugo, dueDate: days(7) })
}
