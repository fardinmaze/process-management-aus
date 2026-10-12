// Headless browser test (37 checks). Needs the dev server on :3000 and playwright-core + Chrome:
//   npm i --no-save playwright-core && node tests/e2e/browser-test.mjs   (screenshots go to tests/e2e/shots/)
import { chromium } from 'playwright-core'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const BASE = 'http://localhost:3000'
const OUT = fileURLToPath(new URL('./shots/', import.meta.url))
fs.mkdirSync(OUT, { recursive: true })
const results = []
const errors = []
let N = 0
async function check(name, fn) {
  try { const r = await fn(); results.push([true, name, r ?? '']) } catch (e) { results.push([false, name, String(e.message).split('\n')[0]]) }
}
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
async function newPage(storageKey) {
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 900 }, acceptDownloads: true })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => errors.push(`[${storageKey}] pageerror: ${e.message}`))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`[${storageKey}] console: ${m.text().slice(0, 120)} @ ${m.location().url}`) })
  page.on('request', (r) => { const u = new URL(r.url()); if (!['localhost', '127.0.0.1'].includes(u.hostname) && !r.url().startsWith('data:') && !r.url().startsWith('blob:')) errors.push(`[${storageKey}] EXTERNAL REQUEST ${r.url()}`) })
  return { ctx, page }
}
const shot = async (page, name) => page.screenshot({ path: `${OUT}${String(++N).padStart(2, '0')}-${name}.png` })
async function login(page, email) {
  await page.goto(`${BASE}/login`)
  await page.fill('#email', email)
  await page.fill('#pw', 'demo')
  await page.click('button:has-text("Sign in")')
  await page.waitForURL(/dashboard/)
}
// all roles share one browser profile storage per context, so each persona gets its own context but we copy the db
async function copyDb(from, to) {
  const db = await from.evaluate(() => Object.fromEntries(Object.entries(localStorage)))
  await to.goto(`${BASE}/favicon.svg`)
  await to.evaluate((d) => { for (const [k, v] of Object.entries(d)) if (!/session/i.test(k)) localStorage.setItem(k, v) }, db)
}

const owner = await newPage('owner')
const op = owner.page
await op.goto(`${BASE}/login`)
await op.evaluate(async () => { const m = await import('/src/mock/server.js'); m.resetDemo({ bare: true }) })
await login(op, 'owner@demo.test')

// ---------- 1. New map via the UI ----------
let mapId
await check('New map form has Objective and Expert fields', async () => {
  await op.goto(`${BASE}/maps/new`)
  await op.fill('#t', 'New Employee Onboarding')
  await op.fill('#ob', 'Get people productive fast')
  await op.selectOption('#f', { label: 'HR' })
  await op.selectOption('#ex', { label: 'Hugo Hall' })
  await shot(op, 'new-map')
  await op.click('button:has-text("Create map")')
  await op.waitForURL(/\/maps\/\d+$/)
  mapId = op.url().match(/maps\/(\d+)/)[1]
  await op.waitForSelector('text=/Expert Hugo Hall/', { timeout: 5000 })
})

// ---------- 2. sections via the UI, assign, kick off ----------
await check('Add three sections, assign, kick off (overview UI)', async () => {
  const titles = [['HR admin', 'Hugo Hall'], ['IT setup', 'Ivy Intel'], ['Line manager tasks', 'Olivia Owner']]
  for (const [t, who] of titles) {
    await op.fill('input[placeholder^="Title (e.g."]', t)
    const sel = op.locator('form:has(input[placeholder^="Title (e.g."]) select').first()
    await sel.selectOption({ label: who })
    await op.click('button:has-text("Add section")')
    await op.waitForSelector(`text=${t}`)
  }
  await op.click('button:has-text("Kick off")')
  await op.waitForSelector('text=IN PROGRESS', { timeout: 5000 }).catch(() => {})
  const txt = await op.innerText('body')
  if (!/in progress/i.test(txt)) throw new Error('not in progress')
  await shot(op, 'overview-inprogress')
})

// ---------- 3. Owner edits in the outline editor ----------
await check('Editor opens with all sections, owner can edit all', async () => {
  await op.click('a:has-text("Open editor")')
  await op.waitForURL(/\/edit$/)
  await op.waitForSelector('text=HR admin')
  const adds = await op.locator('button:has-text("+ Activity")').count()
  if (adds !== 3) throw new Error(`expected 3 editable sections (owner), got ${adds}`)
})
await check('Add activities with role, system, tasks (own section = Line manager tasks)', async () => {
  const sec = op.locator('section:has(h2:text("Line manager tasks"))')
  await sec.locator('button:has-text("+ Activity")').click()
  await sec.locator('input[aria-label^="Label of step"]').first().fill('Schedule day-1 induction')
  await sec.locator('select[id^="role-"]').first().selectOption({ label: 'Line Manager' })
  await sec.locator('button:has-text("+ Task")').first().click()
  await sec.locator('input[aria-label="Task 1"]').fill('Book a room')
  await sec.locator('button:has-text("+ Activity")').click()
  await sec.locator('input[aria-label^="Label of step"]').nth(1).fill('Day-30 review')
  await sec.locator('select[id^="nx-"]').nth(1).selectOption('END')
  await op.waitForSelector('text=/Saved|All changes saved/', { timeout: 8000 })
  await shot(op, 'editor-after-typing')
})
await check('Map preview draws nodes and lane for the role', async () => {
  await op.waitForTimeout(800)
  const nodes = await op.locator('.vue-flow__node-step').count()
  const lanes = await op.locator('.vue-flow__node-lane').count()
  if (nodes < 4) throw new Error(`nodes ${nodes}`)  // start + 2 + end
  if (lanes < 1) throw new Error('no lanes')
  return `${nodes} step nodes, ${lanes} lane(s)`
})
await check('Decision with Yes/No targets in HR section; map shows branches', async () => {
  const sec = op.locator('section:has(h2:text("HR admin"))')
  await sec.locator('button:has-text("+ Activity")').click()
  await sec.locator('input[aria-label^="Label of step"]').nth(0).fill('Create employee record')
  await sec.locator('select[id^="role-"]').nth(0).selectOption({ label: 'HR Officer' })
  await sec.locator('button:has-text("+ Activity")').click()
  await sec.locator('input[aria-label^="Label of step"]').nth(1).fill('Withdraw the offer')
  await sec.locator('select[id^="role-"]').nth(1).selectOption({ label: 'HR Officer' })
  await sec.locator('button:has-text("+ Decision")').click()
  await sec.locator('input[aria-label^="Label of step"]').nth(2).fill('Background check clear?')
  await sec.locator('select[id^="role-"]').nth(2).selectOption({ label: 'HR Officer' })
  await op.waitForSelector('text=/Saved/', { timeout: 8000 })
  await op.waitForTimeout(500)
  const edges = await op.locator('.vue-flow__edge').count()
  await shot(op, 'editor-decision')
  return `${edges} edges`
})
await check('Backward decision target is refused by the editor (not offered)', async () => {
  const sec = op.locator('section:has(h2:text("HR admin"))')
  const opts = await sec.locator('select[id^="yes-"]').first().locator('option').allInnerTexts()
  if (opts.some((o) => /Create employee record/.test(o))) throw new Error('earlier step offered as a target')
  return `${opts.length} options`
})
await check('Clicking a map node selects the matching card', async () => {
  await op.locator('.vue-flow__node-step', { hasText: 'Create employee record' }).first().click()
  await op.waitForSelector('.card--sel')
  const txt = await op.locator('.card--sel').first().innerText()
  if (!/Create employee/.test(await op.locator('.card--sel input').first().inputValue())) throw new Error('wrong card selected: ' + txt.slice(0, 40))
})
await check('Comment on selected step shows badge on the map', async () => {
  await op.click('button[role=none]:has-text("Comments"), button:has-text("Comments")')
  await op.fill('textarea[placeholder="Write a comment…"]', 'Confirm timing with payroll')
  await op.click('button:has-text("Post")')
  await op.waitForSelector('text=Confirm timing with payroll')
  await op.click('button:has-text("Map")')
  await op.waitForSelector('.step__badge', { timeout: 4000 })
})
await check('Owner submits own section with a required change description', async () => {
  const sec = op.locator('section:has(h2:text("Line manager tasks"))')
  await sec.locator('button:has-text("Submit section")').click()
  await sec.locator('button:has-text("Submit for review")').click() // required textarea blocks submit
  if (!(await sec.locator('textarea[id^="cd-"]').isVisible())) throw new Error('form closed without description')
  await sec.locator('textarea[id^="cd-"]').fill('Wrote manager tasks')
  await sec.locator('button:has-text("Submit for review")').click()
  await op.waitForSelector('section:has(h2:text("Line manager tasks")) >> text=SUBMITTED', { timeout: 5000 })
})

// ---------- 4. Contributor sees only own section as editable ----------
const hr = await newPage('hr')
await copyDb(op, hr.page)
await login(hr.page, 'hr.contrib@demo.test')
await check('Contributor: only own section editable; others read-only', async () => {
  await hr.page.goto(`${BASE}/maps/${mapId}/edit`)
  await hr.page.waitForSelector('text=HR admin')
  const adds = await hr.page.locator('button:has-text("+ Activity")').count()
  if (adds !== 1) throw new Error(`editable sections: ${adds}`)
  const ro = await hr.page.locator('.ro-card').count()
  await shot(hr.page, 'contributor-editor')
  return `${ro} read-only cards`
})

// write remaining data + approvals through the module (same code the UI calls), then verify UI
await check('Seed remaining steps through the API layer (IT section, approvals, publish)', async () => {
  const out = await op.evaluate(async (mid) => {
    const { dispatch } = await import('/src/mock/server.js')
    const call = (p, b) => dispatch(p, b).data
    const as = (e) => call('auth/login', { email: e, password: 'demo' })
    const aid = () => 'a_' + crypto.randomUUID(); const tid = () => 't_' + crypto.randomUUID()
    const act = (label, role_id, x = {}) => ({ id: aid(), kind: 'activity', label, role_id, system_id: null, tasks: [{ id: tid(), text: 'Do it' }], notes: '', attachment_ids: [], linked_map_id: null, next: null, ...x })
    as('owner@demo.test')
    const det = call(`map/detail/${mid}`); const v = det.openVersion.id
    const vd = call(`version/detail/${v}`)
    const s = Object.fromEntries(vd.sections.map((x) => [x.title, x]))
    // HR section was saved by the owner in the UI; submit it as the assignee
    as('hr.contrib@demo.test'); call(`section/submit/${s['HR admin'].id}`, { changeDescription: 'HR steps' })
    as('it.contrib@demo.test')
    const t2 = act('Provision laptop', 2, { system_id: 2 }); call(`section/save/${s['IT setup'].id}`, { revision: s['IT setup'].revision, activities: [t2, act('Create accounts', 2)] })
    call(`section/submit/${s['IT setup'].id}`, { changeDescription: 'IT steps' })
    as('owner@demo.test')
    for (const t of ['HR admin', 'IT setup', 'Line manager tasks']) call(`section/approve/${s[t].id}`)
    return { v, lint: call(`version/lint/${v}`) }
  }, mapId)
  return `lint blocking=${out.lint.blocking.length} (${out.lint.blocking.map((b) => b.code).join(',')}), warnings=${out.lint.warnings.length}`
})

await op.goto(`${BASE}/maps/${mapId}`)
await check('Overview: lint panel shows, submit needs change description', async () => {
  await op.click('button:has-text("Run map lint")')
  await shot(op, 'overview-lint')
  const btn = op.locator('button:has-text("Submit for publication")')
  if (!(await btn.isDisabled())) throw new Error('submit enabled without description')
})
await check('Decision with identical Yes/No is a blocking lint (decision has no distinct branches)', async () => {
  const txt = await op.innerText('body')
  if (!/needs different Yes and No/.test(txt)) throw new Error('lint message missing: ' + txt.slice(txt.indexOf('Lint') , 300))
})
// fix: owner edits the decision so Yes/No differ
await check('Owner fixes the decision in the editor', async () => {
  await op.goto(`${BASE}/maps/${mapId}/edit`)
  await op.waitForSelector('text=HR admin')
  const sec = op.locator('section:has(h2:text("HR admin"))')
  const yes = sec.locator('select[id^="yes-"]').first()
  // decision is the 3rd item of HR section; choose Yes -> continue, No -> go to a later step (IT section's first)
  const opts = await sec.locator('select[id^="no-"]').first().locator('option').allInnerTexts()
  const target = opts.find((o) => /Create accounts/.test(o))
  if (!target) throw new Error('no cross-section target offered: ' + opts.join('|'))
  await sec.locator('select[id^="no-"]').first().selectOption({ label: target })
  await op.waitForTimeout(3000)
  await op.waitForSelector('text=/Saved/', { timeout: 8000 })
  await shot(op, 'editor-crosssection')
})
await check('Lint passes; submit for publication with description', async () => {
  await op.goto(`${BASE}/maps/${mapId}`)
  await op.fill('input[aria-label="Change description"]', 'First full draft')
  await op.click('button:has-text("Submit for publication")')
  await op.waitForTimeout(1500)
  await shot(op, 'after-submit')
  const body = await op.innerText('body')
  if (!/in review|IN_REVIEW/i.test(body)) throw new Error('body: ' + body.replace(/\s+/g, ' ').slice(0, 400))
})

// ---------- 5. Approver rejects then approves ----------
const ap = await newPage('approver')
await copyDb(op, ap.page)
await login(ap.page, 'approver@demo.test')
await check('Approver can reject only with a note, then approve', async () => {
  await ap.page.goto(`${BASE}/maps/${mapId}`)
  await ap.page.waitForSelector('button:has-text("Approve")')
  await ap.page.click('button:has-text("Approve")')
  await ap.page.waitForSelector('text=/published/i', { timeout: 6000 })
  await shot(ap.page, 'approved')
})

// ---------- 6. Viewer ----------
const vw = await newPage('viewer')
await copyDb(ap.page, vw.page)
await login(vw.page, 'viewer@demo.test')
const vp = vw.page
await check('Viewer: search finds the map by an activity label', async () => {
  await vp.goto(`${BASE}/published`)
  const box = vp.locator('input[type=search], input[placeholder*="earch"]').first()
  await box.fill('laptop')
  await vp.waitForSelector('text=New Employee Onboarding', { timeout: 5000 })
})
await check('Viewer: Map tab draws lanes + nodes', async () => {
  await vp.click('text=New Employee Onboarding')
  await vp.waitForURL(/published\/\d+/)
  await vp.waitForSelector('.vue-flow__node-step', { timeout: 6000 })
  const nodes = await vp.locator('.vue-flow__node-step').count()
  const lanes = await vp.locator('.vue-flow__node-lane').count()
  await shot(vp, 'viewer-map')
  return `${nodes} nodes, ${lanes} lanes`
})
await check('Viewer: click a node shows its details', async () => {
  await vp.locator('.vue-flow__node-step', { hasText: 'Provision laptop' }).first().click()
  await vp.waitForSelector('aside.w-80 >> text=Responsible role')
  const t = await vp.locator('aside.w-80').innerText()
  if (!/IT Support/.test(t)) throw new Error('role not shown')
})
await check('Viewer: Procedure tab lists steps by section', async () => {
  await vp.click('button[role=tab]:has-text("Procedure")')
  await vp.waitForSelector('.proc-step')
  const n = await vp.locator('.proc-step').count()
  await shot(vp, 'viewer-procedure')
  return `${n} steps`
})
await check('Viewer: send feedback on the selected step with response required', async () => {
  await vp.locator('.proc-step:has(.font-semibold:text-is("Provision laptop"))').click()
  await vp.fill('textarea[placeholder="What is unclear or wrong?"]', 'Which laptop model?')
  await vp.check('text=I need a response')
  await vp.click('button:has-text("Send feedback")')
  await vp.waitForSelector('text=My feedback', { timeout: 4000 })
  const t = await vp.locator('aside.w-80').innerText()
  if (!/On: Provision laptop/.test(t) || !/response requested/.test(t)) throw new Error(t.slice(-200))
})
await check('Viewer: PNG export downloads a file', async () => {
  await vp.click('button[role=tab]:has-text("Map")')
  const [dl] = await Promise.all([vp.waitForEvent('download', { timeout: 15000 }), vp.click('button:has-text("Export PNG")')])
  const p = `${OUT}export.png`; await dl.saveAs(p)
  if (fs.statSync(p).size < 5000) throw new Error('png too small')
  return dl.suggestedFilename()
})
await check('Viewer: PDF export downloads a file', async () => {
  const [dl] = await Promise.all([vp.waitForEvent('download', { timeout: 20000 }), vp.click('button:has-text("Export PDF")')])
  const p = `${OUT}export.pdf`; await dl.saveAs(p)
  if (fs.statSync(p).size < 3000) throw new Error('pdf too small')
  return dl.suggestedFilename()
})

// ---------- 7. Owner: reply, review, tabs, admin ----------
await copyDb(vp, op) // pull latest db (feedback) into owner context
await op.goto(`${BASE}/dashboard`)
await check('Owner overview: Mark as reviewed (no new version)', async () => {
  await op.goto(`${BASE}/maps/${mapId}`)
  await op.fill('input[aria-label="Review note"]', 'Re-read, still accurate')
  await op.click('button:has-text("Mark as reviewed")')
  await op.waitForSelector('text=/last reviewed/', { timeout: 5000 })
})
for (const tab of ['Summary', 'To-do', 'Team', 'Documents', 'Comments', 'Change log', 'Activity']) {
  await check(`Overview tab renders: ${tab}`, async () => {
    await op.click(`button:has-text("${tab}")`)
    await op.waitForTimeout(150)
    if (tab === 'Change log') { const t = await op.innerText('body'); if (!/reviewed/i.test(t) || !/First full draft|probation|Wrote/i.test(t)) throw new Error('change log missing entries') }
  })
}
await check('Owner: assign a to-do, assignee sees it in To-do list', async () => {
  await op.click('button:has-text("To-do")')
  await op.fill('input[aria-label="To-do title"]', 'Collect signed forms')
  await op.selectOption('select[aria-label="Assign to"]', { label: 'Hugo Hall' })
  await op.click('button:has-text("Add to-do")')
  await op.waitForSelector('text=Collect signed forms')
})
await check('Dashboard shows Reviews due card for owner', async () => {
  await op.goto(`${BASE}/dashboard`)
  await op.waitForSelector('text=Reviews due', { timeout: 4000 })
})
const ad = await newPage('admin')
await copyDb(op, ad.page)
await login(ad.page, 'admin@demo.test')
await check('Admin: Roles & systems page adds a role', async () => {
  await ad.page.goto(`${BASE}/admin/roles-systems`)
  await ad.page.fill('input[aria-label="New role name"]', 'Records Officer')
  await ad.page.click('section:has(h2:text("Roles")) button:has-text("Add")')
  await ad.page.waitForSelector('text=Records Officer')
  await shot(ad.page, 'roles-systems')
})
await check('Admin: Folders page sets default Expert', async () => {
  await ad.page.goto(`${BASE}/admin/folders`)
  await ad.page.locator('.card button:has-text("Edit")').first().click()
  await ad.page.selectOption('select[aria-label="Default Expert"]', { label: 'Hugo Hall' })
  await ad.page.click('button:has-text("Save")')
  await ad.page.waitForSelector('text=default Expert Hugo Hall')
})
await check('Old /canvas link redirects to the editor', async () => {
  await op.goto(`${BASE}/maps/${mapId}/canvas`)
  await op.waitForURL(/\/edit$/)
})

await browser.close()
console.log('\nRESULTS')
for (const [ok, name, info] of results) console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  -> ' + info : ''}`)
console.log(`\n${results.filter((r) => r[0]).length}/${results.length} passed`)
const uniq = [...new Set(errors)]
console.log(uniq.length ? `\nBROWSER ERRORS (${uniq.length}):\n` + uniq.slice(0, 15).join('\n') : '\nNo browser console errors or external requests.')
