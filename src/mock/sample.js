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
const ct = (name, email, officialEmail, deskName) => ({ name, email, officialEmail, deskName })
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
  call('role/edit/1', { contactName: 'Priya Nair', contactEmail: 'priya.nair@gmail.com', contactOfficialEmail: 'priya.nair@council.example.gov.au', contactDeskName: 'HR Desk 4, Level 3' })
  call('role/edit/2', { contactName: 'Marcus Lee', contactEmail: 'marcus.lee@gmail.com', contactOfficialEmail: 'it.servicedesk@council.example.gov.au', contactDeskName: 'IT Service Desk, Level 1' })
  call('role/edit/3', { contactName: 'Sam Rivera', contactEmail: 'sam.rivera@gmail.com', contactOfficialEmail: 'sam.rivera@council.example.gov.au', contactDeskName: 'Manager Desk 12, Level 5' })
  call('role/edit/4', { contactName: 'Dana Whitfield', contactEmail: 'dana.whitfield@gmail.com', contactOfficialEmail: 'payroll@council.example.gov.au', contactDeskName: 'Payroll Desk 2, Level 2' })
  call(`folder/edit/${folder('HR')}`, { defaultExpertId: hugo, defaultMemberIds: [ivy] })

  // 1. Published map: New Employee Onboarding
  as('owner@demo.test')
  const m1 = call('map/create', { title: 'New Employee Onboarding', description: 'From signed offer to the 30-day review.', objective: 'Get new starters productive within their first month.', folderId: folder('HR'), reviewIntervalDays: 365, tags: ['onboarding', 'people'] })
  const v1 = m1.openVersion.id
  const s1 = call('section/create', { versionId: v1, title: 'HR administration', assigneeId: hugo })
  const s2 = call('section/create', { versionId: v1, title: 'IT setup', assigneeId: ivy })
  const s3 = call('section/create', { versionId: v1, title: 'Line manager tasks', assigneeId: owner })
  call(`version/kickoff/${v1}`)
  const hrA = act('Create employee record', 1, ['Enter personal details', 'Set start date and position'], { system_id: 1, contact: ct('Priya Nair', 'priya.nair@gmail.com', 'priya.nair@council.example.gov.au', 'HR Desk 4, Level 3') })
  const hrB = act('Issue employment contract', 1, ['Send contract for e-signature', 'File the signed copy'], { contact: ct('Hannah Brooks', 'hannah.brooks@gmail.com', 'contracts@council.example.gov.au', 'HR Desk 6, Level 3') })
  const itA = act('Provision laptop', 2, ['Image the laptop', 'Assign asset tag'], { system_id: 2, contact: ct('Marcus Lee', 'marcus.lee@gmail.com', 'it.servicedesk@council.example.gov.au', 'IT Service Desk, Level 1') })
  const itC = act('Ship laptop to home address', 2, ['Book courier'], { contact: ct('Jo Tran', 'jo.tran@gmail.com', 'logistics@council.example.gov.au', 'Logistics Desk 3, Basement') })
  const itD = act('Hand over laptop at the desk', 2, ['Walk through first login'], { contact: ct('Aisha Khan', 'aisha.khan@gmail.com', 'desk.support@council.example.gov.au', 'IT Desk 2, Level 1') })
  const itB = dec('Remote worker?', 2, itC.id, itD.id)
  itB.contact = ct('Marcus Lee', 'marcus.lee@gmail.com', 'it.servicedesk@council.example.gov.au', 'IT Service Desk, Level 1')
  const itE = act('Enrol MFA and create mailbox', 2, ['Create account', 'Enrol authenticator app'], { system_id: 3, contact: ct('Tomas Reyes', 'tomas.reyes@gmail.com', 'identity@council.example.gov.au', 'Identity Desk 1, Level 2') })
  hrB.next = itA.id
  const lm1 = act('Schedule 1:1 catch-ups', 3, ['Weekly for the first month'], { contact: ct('Sam Rivera', 'sam.rivera@gmail.com', 'sam.rivera@council.example.gov.au', 'Manager Desk 12, Level 5') })
  const lm2 = act('Run 30-day review', 3, ['Agree goals for the next quarter'], { next: 'END', contact: ct('Sam Rivera', 'sam.rivera@gmail.com', 'sam.rivera@council.example.gov.au', 'Manager Desk 12, Level 5') })
  as('it.contrib@demo.test'); save(s2, 1, [itA, itB, itC, itD, itE]); call(`section/submit/${s2.id}`, { changeDescription: 'Laptop provisioning and accounts' })
  as('hr.contrib@demo.test'); save(s1, 1, [hrA, hrB]); call(`section/submit/${s1.id}`, { changeDescription: 'Wrote the HR administration steps' })
  as('owner@demo.test'); save(s3, 1, [lm1, lm2]); call(`section/submit/${s3.id}`, { changeDescription: 'Manager follow-up tasks' })
  for (const s of [s1, s2, s3]) call(`section/approve/${s.id}`)
  call(`version/submit/${v1}`, { changeDescription: 'First full version of the onboarding process' })
  as('approver@demo.test'); call(`version/approve/${v1}`, { note: 'Approved by the Process Council' })
  as('viewer@demo.test')
  for (let i = 0; i < 6; i++) call(`published/map/detail/${m1.id}`)
  call('published/feedback/create', { mapId: m1.id, activityId: itB.id, body: 'Which laptop model do remote staff receive? Our current spec sheet is attached.', responseRequired: true, file: { name: 'laptop-spec.txt', size: 41, dataUrl: 'data:text/plain;base64,TGFwdG9wIHNwZWM6IDE0IGluY2gsIDE2IEdCIFJBTSwgNTEyIEdCIFNTRA==' } })

  // 1b. Second published map: Staff Leave Request (contacts on every step)
  as('owner@demo.test')
  const m4 = call('map/create', { title: 'Staff Leave Request', description: 'How annual and personal leave is requested, approved and paid.', objective: 'Give every staff member a clear, fast leave decision.', folderId: folder('HR'), reviewIntervalDays: 365, tags: ['leave', 'people'] })
  const v4 = m4.openVersion.id
  const l1 = call('section/create', { versionId: v4, title: 'Request', assigneeId: hugo })
  const l2 = call('section/create', { versionId: v4, title: 'Approval', assigneeId: owner })
  const l3 = call('section/create', { versionId: v4, title: 'Payroll', assigneeId: ivy })
  call(`version/kickoff/${v4}`)
  const payA = act('Update leave balance in payroll', 4, ['Deduct approved days', 'Confirm the pay period'], { next: 'END', system_id: 1, contact: ct('Dana Whitfield', 'dana.whitfield@gmail.com', 'payroll@council.example.gov.au', 'Payroll Desk 2, Level 2') })
  const declA = act('Tell the employee the request was declined', 1, ['Give the reason', 'Suggest alternative dates'], { next: 'END', contact: ct('Priya Nair', 'priya.nair@gmail.com', 'priya.nair@council.example.gov.au', 'HR Desk 4, Level 3') })
  const apprD = dec('Leave approved?', 3, payA.id, declA.id)
  apprD.contact = ct('Sam Rivera', 'sam.rivera@gmail.com', 'sam.rivera@council.example.gov.au', 'Manager Desk 12, Level 5')
  const reqA = act('Log the leave request', 1, ['Check the leave balance', 'Record dates and type'], { system_id: 1, contact: ct('Hannah Brooks', 'hannah.brooks@gmail.com', 'leave@council.example.gov.au', 'HR Desk 6, Level 3') })
  as('hr.contrib@demo.test'); save(l1, 1, [reqA]); call(`section/submit/${l1.id}`, { changeDescription: 'Request logging step' })
  as('it.contrib@demo.test'); save(l3, 1, [payA]); call(`section/submit/${l3.id}`, { changeDescription: 'Payroll update step' })
  as('owner@demo.test'); save(l2, 1, [apprD, declA]); call(`section/submit/${l2.id}`, { changeDescription: 'Approval decision and decline path' })
  as('owner@demo.test')
  for (const x of [l1, l2, l3]) call(`section/approve/${x.id}`)
  call(`version/submit/${v4}`, { changeDescription: 'First version of the leave request process' })
  as('approver@demo.test'); call(`version/approve/${v4}`, { note: 'Approved by the Process Council' })
  as('viewer@demo.test')
  for (let i = 0; i < 3; i++) call(`published/map/detail/${m4.id}`)

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
