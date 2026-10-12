<template>
  <div class="flex flex-col bg-white" style="height: calc(100vh - 3.5rem)">
    <!-- Top bar -->
    <div class="h-12 shrink-0 border-b border-slate-300 border-t-4 border-t-gold-500 flex items-center gap-2 px-3 text-sm">
      <router-link :to="`/maps/${id}`" class="btn btn-sm no-underline"><Icon name="back" :size="14" />Back</router-link>
      <div class="font-semibold truncate max-w-[22rem]">{{ ver?.map.title }} <span class="text-slate-500 font-normal">v{{ ver?.versionNo }}</span></div>
      <StatusChip v-if="ver" :status="ver.status" />
      <div class="flex-1" />
      <span class="text-xs" :class="saveClass" role="status">{{ saveLabel }}</span>
    </div>

    <div v-if="conflict" class="bg-red-50 border-b border-red-300 text-red-800 text-sm px-4 py-2 flex items-center gap-3"><Icon name="alert" :size="16" />
      {{ conflict }} <button class="btn btn-sm" @click="reload">Reload latest</button>
    </div>
    <div v-else-if="ver && !mySections.length" class="bg-brand-50 border-b border-brand-200 text-brand-900 text-sm px-4 py-2 flex items-center gap-2"><Icon name="lock" :size="14" />{{ readOnlyReason }}</div>

    <p v-if="loading" class="p-6 text-slate-500">Loading…</p>
    <div v-else class="flex flex-col lg:flex-row flex-1 min-h-0 overflow-y-auto lg:overflow-hidden">
      <!-- Outline -->
      <div ref="outlineEl" class="w-full lg:w-[44%] lg:min-w-[420px] shrink-0 border-b lg:border-b-0 lg:border-r border-slate-300 lg:overflow-y-auto p-4 bg-[#F4F6F8]">
        <p class="text-xs text-slate-500 mt-0 mb-3">Write each section as a list of activities. The map on the right is drawn for you. Other sections are read-only.</p>
        <section v-for="sec in ver.sections" :key="sec.id" class="mb-5">
          <header class="flex items-center gap-2 mb-2">
            <h2 class="text-sm font-bold m-0">{{ sec.title }}</h2>
            <StatusChip :status="sec.status" />
            <span class="text-xs text-slate-500">{{ sec.assigneeName || 'Unassigned' }}<span v-if="sec.openedBy && sec.openedBy.id !== me.id"> · {{ sec.openedBy.name }} has it open</span></span>
            <div class="flex-1" />
            <button v-if="canSubmit(sec)" class="btn btn-sm btn-primary" :disabled="submitting" @click="startSubmit(sec)"><Icon name="send" :size="13" />Submit section</button>
          </header>

          <div v-for="c in openRevisions(sec)" :key="c.id" class="text-xs bg-red-50 border border-red-200 text-red-700 rounded p-2 mb-2">
            <strong>Changes requested:</strong> {{ c.body }}
          </div>
          <form v-if="submitFor === sec.id" class="card mb-2" @submit.prevent="submitSection(sec)">
            <label class="label" :for="`cd-${sec.id}`">What did you write or change? (required)</label>
            <textarea :id="`cd-${sec.id}`" v-model="submitDesc" class="input mb-2" rows="2" required />
            <button class="btn btn-sm btn-primary" :disabled="submitting">Submit for review</button>
            <button type="button" class="btn btn-sm ml-2" @click="submitFor = null">Cancel</button>
          </form>

          <!-- read-only section -->
          <template v-if="!isEditable(sec.id)">
            <p v-if="!sec.activities.length" class="text-xs text-slate-500 mt-0">No activities yet.</p>
            <div v-for="(a, i) in sec.activities" :key="a.id" class="ro-card" :class="{ 'ro-card--sel': selectedId === a.id }" @click="select(a.id)">
              <span class="text-slate-500 mr-1">{{ i + 1 }}.</span><span v-if="a.kind === 'decision'" class="chip bg-gold-300 text-brand-900 mr-1">Decision</span>{{ a.label || '(no label)' }}
              <span class="text-xs text-slate-500"> · {{ roleName(a.role_id) }}</span>
            </div>
          </template>

          <!-- editable section -->
          <template v-else>
            <div v-for="(a, i) in drafts[sec.id]" :id="`card-${a.id}`" :key="a.id" class="card mb-2 p-3" :class="{ 'card--sel': selectedId === a.id }" @click="select(a.id)">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-xs font-bold text-slate-500 w-6">{{ globalIndex(a.id) + 1 }}.</span>
                <span v-if="a.kind === 'decision'" class="chip bg-gold-300 text-brand-900">Decision</span>
                <input v-model="a.label" class="input" :placeholder="a.kind === 'decision' ? 'Question, e.g. Is the check clear?' : 'Activity, start with a verb'" :aria-label="`Label of step ${globalIndex(a.id) + 1}`">
                <button class="btn btn-sm" :disabled="i === 0" title="Move up" aria-label="Move up" @click.stop="move(sec.id, i, -1)"><Icon name="up" :size="14" /></button>
                <button class="btn btn-sm" :disabled="i === drafts[sec.id].length - 1" title="Move down" aria-label="Move down" @click.stop="move(sec.id, i, 1)"><Icon name="down" :size="14" /></button>
                <button class="btn btn-sm btn-danger" title="Delete step" aria-label="Delete step" @click.stop="removeItem(sec.id, i)"><Icon name="trash" :size="14" /></button>
              </div>

              <div class="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label class="label" :for="`role-${a.id}`">Role (lane)</label>
                  <select :id="`role-${a.id}`" v-model="a.role_id" class="input" :class="{ 'input--warn': a.kind === 'activity' && !a.role_id }">
                    <option :value="null">Choose a role…</option>
                    <option v-for="r in roles.filter((x) => x.isActive || x.id === a.role_id)" :key="r.id" :value="r.id">{{ r.name }}</option>
                  </select>
                </div>
                <div>
                  <label class="label" :for="`sys-${a.id}`">System (optional)</label>
                  <select :id="`sys-${a.id}`" v-model="a.system_id" class="input">
                    <option :value="null">None (done by a person)</option>
                    <option v-for="s in systems.filter((x) => x.isActive || x.id === a.system_id)" :key="s.id" :value="s.id">{{ s.name }}</option>
                  </select>
                </div>
              </div>

              <template v-if="a.kind === 'activity'">
                <div class="label">Tasks</div>
                <div v-for="(t, ti) in a.tasks" :key="t.id" class="flex gap-2 mb-1">
                  <input v-model="t.text" class="input" placeholder="What is done" :aria-label="`Task ${ti + 1}`" @keydown.enter.prevent="addTask(a)">
                  <button class="btn btn-sm" aria-label="Remove task" @click.stop="a.tasks.splice(ti, 1)"><Icon name="x" :size="14" /></button>
                </div>
                <button class="btn btn-sm mb-2" @click.stop="addTask(a)"><Icon name="plus" :size="13" />Task</button>
                <label class="label" :for="`nt-${a.id}`">Notes</label>
                <textarea :id="`nt-${a.id}`" v-model="a.notes" class="input mb-2" rows="2" placeholder="Tips, rules, FAQs for the person doing this" />
                <label class="label" :for="`nx-${a.id}`">After this step</label>
                <select :id="`nx-${a.id}`" v-model="a.next" class="input">
                  <option :value="null">Continue to the next step</option>
                  <option value="END">The process ends here</option>
                  <option v-for="t in targetsAfter(a.id)" :key="t.id" :value="t.id">Go to {{ t.text }}</option>
                </select>
              </template>
              <template v-else>
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="label" :for="`yes-${a.id}`">If Yes</label>
                    <select :id="`yes-${a.id}`" v-model="a.yes" class="input">
                      <option :value="null">Continue to the next step</option>
                      <option v-for="t in targetsAfter(a.id)" :key="t.id" :value="t.id">Go to {{ t.text }}</option>
                    </select>
                  </div>
                  <div>
                    <label class="label" :for="`no-${a.id}`">If No</label>
                    <select :id="`no-${a.id}`" v-model="a.no" class="input">
                      <option :value="null">Continue to the next step</option>
                      <option v-for="t in targetsAfter(a.id)" :key="t.id" :value="t.id">Go to {{ t.text }}</option>
                    </select>
                  </div>
                </div>
                              </template>
              <div v-if="issues[a.id]" class="text-xs text-red-600 mt-2">{{ issues[a.id] }}</div>
            </div>
            <div class="flex gap-2">
              <button class="btn btn-sm" @click="addItem(sec.id, 'activity')"><Icon name="plus" :size="13" />Activity</button>
              <button class="btn btn-sm" @click="addItem(sec.id, 'decision')"><Icon name="plus" :size="13" />Decision</button>
            </div>
          </template>
        </section>
      </div>

      <!-- Right panel -->
      <div class="h-[75vh] lg:h-auto lg:flex-1 shrink-0 lg:shrink min-w-0 flex flex-col">
        <div class="flex gap-1 border-b border-slate-300 px-3 shrink-0 overflow-x-auto">
          <button v-for="t in PANEL_TABS" :key="t" class="px-3 py-2.5 text-sm bg-transparent border-0 border-b-4 cursor-pointer whitespace-nowrap" :class="panelTab === t ? 'border-brand-600 text-brand-700 font-semibold' : 'border-transparent text-slate-600 hover:text-brand-700'" @click="panelTab = t">{{ t }}</button>
          <div class="flex-1" />
          <span v-if="selectedItem" class="text-xs text-slate-500 self-center">Selected: {{ selectedItem.label || '(no label)' }} <button class="bg-transparent border-0 text-brand-700 cursor-pointer" @click="selectedId = null">clear</button></span>
        </div>

        <div v-show="panelTab === 'Map'" class="flex-1 min-h-0"><ProcessMap :items="mapItems" :selected-id="selectedId" :badges="commentCounts" vf-id="editor-map" @select="selectFromMap" /></div>

        <div v-if="panelTab === 'Comments'" class="flex-1 overflow-y-auto p-4">
          <form v-if="canComment" class="mb-3" @submit.prevent="postComment">
            <div class="text-xs text-slate-500 mb-1">On: {{ selectedItem ? `the selected step (${selectedItem.label || 'no label'})` : 'the whole map' }}</div>
            <textarea v-model="commentBody" class="input mb-2" rows="2" placeholder="Write a comment…" required />
            <select v-if="canRevision" v-model="commentKind" class="input mb-2"><option value="COMMENT">Comment</option><option value="REVISION">Revision (blocks submit)</option></select>
            <button class="btn btn-sm btn-primary"><Icon name="send" :size="13" />Post</button>
          </form>
          <label class="flex items-center gap-2 text-xs mb-2"><input v-model="onlySelected" type="checkbox" :disabled="!selectedItem"> Only the selected step</label>
          <p v-if="!shownComments.length" class="text-xs text-slate-500">No comments.</p>
          <div v-for="c in shownComments" :key="c.id" class="border border-slate-300 rounded p-2 mb-2 cursor-pointer" @click="c.activityId && select(c.activityId)">
            <div class="text-xs text-slate-500"><strong>{{ c.authorName }}</strong> · {{ c.kind.toLowerCase() }} · <StatusChip :status="c.status" /></div>
            <div class="text-xs mt-1">{{ c.body }}</div>
            <button v-if="c.status === 'OPEN'" class="btn btn-sm mt-1" @click.stop="resolveComment(c)">Resolve</button>
          </div>
        </div>

        <div v-if="panelTab === 'Documents'" class="flex-1 overflow-y-auto p-4">
          <form v-if="canAttach" class="mb-3" @submit.prevent="upload">
            <div class="text-xs text-slate-500 mb-1">Attach to: {{ selectedItem ? 'the selected step' : 'the whole map' }}</div>
            <input ref="fileInput" type="file" class="input mb-2" required aria-label="File">
            <input v-model="docTitle" class="input mb-2" placeholder="Title (optional)">
            <button class="btn btn-sm btn-primary"><Icon name="upload" :size="13" />Upload</button>
          </form>
          <p v-if="!attachments.length" class="text-xs text-slate-500">No documents yet.</p>
          <div v-for="a in attachments" :key="a.id" class="border border-slate-300 rounded p-2 mb-2 text-xs">
            <button class="bg-transparent border-0 p-0 text-brand-700 underline cursor-pointer text-xs" @click="download(a)">{{ a.attachTitle }}</button>
            <div class="text-slate-500">{{ a.category }} · {{ a.activityId ? 'step' : 'map' }} · {{ a.uploaderName }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { call } from '@/api'
import { session, hasRole, toast, errMsg } from '@/session'
import { uuid } from '@/util'
import { toMapItems } from '@/layout/adapt'
import ProcessMap from '@/components/ProcessMap.vue'
import StatusChip from '@/components/StatusChip.vue'

const props = defineProps({ id: { type: [String, Number], required: true } })
const PANEL_TABS = ['Map', 'Comments', 'Documents']
const AUTOSAVE_MS = 1200
const POLL_MS = 30000

const me = computed(() => session.user)
const ver = ref(null)
const roles = ref([])
const systems = ref([])
const comments = ref([])
const attachments = ref([])
const loading = ref(true)
const conflict = ref('')
const panelTab = ref('Map')
const selectedId = ref(null)
const drafts = reactive({}) // sectionId -> activities being edited
const revisions = {}
let lastSaved = {}
const saveState = ref('saved')
const savedAt = ref(null)
let saving = false
let saveTimer = null
let pollTimer = null

const submitFor = ref(null)
const submitDesc = ref('')
const submitting = ref(false)
const commentBody = ref('')
const commentKind = ref('COMMENT')
const onlySelected = ref(false)
const docTitle = ref('')
const fileInput = ref(null)
const outlineEl = ref(null)

// ── permissions (UI convenience only; the server re-checks everything) ──
const editableSet = computed(() => {
  const s = new Set()
  if (!ver.value || ver.value.status !== 'IN_PROGRESS' || !hasRole('CONTRIBUTOR', 'OWNER')) return s
  if (hasRole('OWNER') && ver.value.map.ownerId === me.value.id) { ver.value.sections.forEach((x) => s.add(x.id)); return s }
  for (const sec of ver.value.sections) if (sec.assigneeId === me.value.id && ['ASSIGNED', 'IN_PROGRESS', 'CHANGES_REQUESTED'].includes(sec.status)) s.add(sec.id)
  return s
})
const isEditable = (sid) => editableSet.value.has(sid)
const mySections = computed(() => (ver.value?.sections || []).filter((s) => isEditable(s.id)))
const canSubmit = (sec) => sec.assigneeId === me.value.id && sec.status === 'IN_PROGRESS' && ver.value.status === 'IN_PROGRESS'
const isOwner = computed(() => ver.value && (hasRole('ADMIN') || (hasRole('OWNER') && ver.value.map.ownerId === me.value.id)))
const canAttach = computed(() => ver.value && (isOwner.value || ver.value.map.team?.some((t) => t.id === me.value.id) || editableSet.value.size > 0))
const canComment = computed(() => ver.value && (isOwner.value || editableSet.value.size > 0 || (hasRole('APPROVER') && ver.value.status === 'IN_REVIEW') || canAttach.value))
const canRevision = computed(() => isOwner.value || (hasRole('APPROVER') && ver.value?.status === 'IN_REVIEW'))
const readOnlyReason = computed(() => {
  const st = ver.value?.status
  if (st === 'PLANNING') return 'Writing opens when the map is kicked off. Assign sections, then kick off from the overview.'
  if (st === 'IN_REVIEW') return 'This map is in review and locked.'
  if (st === 'CHANGES_REQUESTED') return 'Waiting for the owner to reopen sections.'
  if (st !== 'IN_PROGRESS') return `This version is ${st?.toLowerCase().replace('_', ' ')} and read-only.`
  return 'No section is assigned to you (or yours is already submitted or approved), so everything is read-only.'
})

// ── outline model ──
const itemsOf = (sec) => (isEditable(sec.id) ? drafts[sec.id] || [] : sec.activities || [])
const globalItems = computed(() => (ver.value?.sections || []).flatMap((sec) => itemsOf(sec).map((a) => ({ ...a, sectionId: sec.id }))))
const globalIndex = (aid) => globalItems.value.findIndex((a) => a.id === aid)
const mapItems = computed(() => toMapItems(globalItems.value, { roles: roles.value, systems: systems.value, sections: ver.value?.sections || [] }))
const roleName = (rid) => roles.value.find((r) => r.id === rid)?.name || 'No role'
const selectedItem = computed(() => globalItems.value.find((a) => a.id === selectedId.value) || null)
const targetsAfter = (aid) => {
  const i = globalIndex(aid)
  return globalItems.value.slice(i + 1).map((a, k) => ({ id: a.id, text: `${i + k + 2}. ${a.label || '(no label)'}` }))
}
const openRevisions = (sec) => comments.value.filter((c) => c.versionId === ver.value.id && c.sectionId === sec.id && c.kind === 'REVISION' && c.status === 'OPEN')
const commentCounts = computed(() => {
  const o = {}
  comments.value.filter((c) => c.status === 'OPEN' && c.activityId && c.versionId === ver.value?.id).forEach((c) => { o[c.activityId] = (o[c.activityId] || 0) + 1 })
  return o
})
// plain-language problems shown on a card (the server enforces the real rules)
const issues = computed(() => {
  const o = {}
  const items = globalItems.value
  items.forEach((a, i) => {
    if (i === 0 && a.kind === 'decision') o[a.id] = 'A decision cannot be the first step of the map.'
    if (a.kind === 'decision' && (a.yes || items[i + 1]?.id || 'END') === (a.no || items[i + 1]?.id || 'END')) o[a.id] = 'Yes and No lead to the same step. Send one of them somewhere else, or this decision cannot be published.'
    for (const t of [a.yes, a.no, a.next]) {
      if (!t || t === 'END') continue
      const j = items.findIndex((x) => x.id === t)
      if (j === -1) o[a.id] = 'This step points at a step that no longer exists.'
      else if (j <= i) o[a.id] = 'This step points backwards. Loops are not supported yet.'
    }
  })
  return o
})

function select(aid) { selectedId.value = aid }
function selectFromMap(aid) {
  selectedId.value = aid
  if (aid) nextTick(() => document.getElementById(`card-${aid}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }))
}
const newItem = (kind) => ({ id: uuid('a'), kind, label: '', role_id: null, system_id: null, tasks: [], notes: '', attachment_ids: [], linked_map_id: null, ...(kind === 'decision' ? { yes: null, no: null } : { next: null }) })
function addItem(sid, kind) {
  const it = newItem(kind)
  const list = drafts[sid]
  const last = [...list].reverse().find((x) => x.role_id)
  if (kind === 'activity') it.role_id = last?.role_id ?? null // same lane as the previous step is the usual case
  if (kind === 'decision') it.role_id = last?.role_id ?? null
  list.push(it)
  selectedId.value = it.id
  nextTick(() => document.getElementById(`card-${it.id}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }))
}
const addTask = (a) => a.tasks.push({ id: uuid('t'), text: '' })
function move(sid, i, d) { const l = drafts[sid]; const [x] = l.splice(i, 1); l.splice(i + d, 0, x) }
function removeItem(sid, i) {
  const a = drafts[sid][i]
  const users = globalItems.value.filter((x) => x.yes === a.id || x.no === a.id || x.next === a.id)
  if (users.length) { toast(`Cannot delete: "${users[0].label || 'another step'}" points at this step. Change that first.`, 'error'); return }
  drafts[sid].splice(i, 1)
  if (selectedId.value === a.id) selectedId.value = null
}

// ── autosave with revision conflict handling ──
const dirtySections = () => [...editableSet.value].filter((sid) => drafts[sid] && JSON.stringify(drafts[sid]) !== lastSaved[sid])
function scheduleSave() {
  if (conflict.value || loading.value) return
  if (!dirtySections().length) { if (saveState.value !== 'saving') saveState.value = 'saved'; return }
  saveState.value = 'dirty'
  clearTimeout(saveTimer)
  saveTimer = setTimeout(flushSave, AUTOSAVE_MS)
}
async function flushSave() {
  clearTimeout(saveTimer)
  if (saving || conflict.value) return
  const todo = dirtySections()
  if (!todo.length) { saveState.value = 'saved'; return }
  saving = true
  saveState.value = 'saving'
  try {
    for (const sid of todo) {
      const body = JSON.stringify(drafts[sid])
      const r = await call(`section/save/${sid}`, { activities: JSON.parse(body), revision: revisions[sid] })
      revisions[sid] = r.revision
      lastSaved[sid] = body
      const sec = ver.value.sections.find((s) => s.id === sid)
      if (sec) { sec.status = r.status; sec.revision = r.revision }
    }
    lastSaved = { ...lastSaved }
    saveState.value = 'saved'
    savedAt.value = new Date()
  } catch (e) {
    if (e.code === 409) { conflict.value = e.message; saveState.value = 'conflict' } else { saveState.value = 'error'; toast(errMsg(e), 'error') }
  } finally {
    saving = false
    if (!conflict.value && dirtySections().length) scheduleSave()
  }
}
watch(drafts, scheduleSave, { deep: true })
const saveLabel = computed(() => ({
  saved: savedAt.value ? `Saved ${savedAt.value.toLocaleTimeString()}` : 'All changes saved',
  dirty: 'Unsaved changes…', saving: 'Saving…', error: 'Save failed. Retrying on next change', conflict: 'Not saved: conflict',
}[saveState.value]))
const saveClass = computed(() => ({ saved: 'text-green-600', dirty: 'text-amber-600', saving: 'text-slate-500', error: 'text-red-600', conflict: 'text-red-600' }[saveState.value]))

// ── submit a section ──
function startSubmit(sec) { submitFor.value = sec.id; submitDesc.value = '' }
async function submitSection(sec) {
  submitting.value = true
  try {
    await flushSave()
    if (conflict.value) return
    await call(`section/submit/${sec.id}`, { changeDescription: submitDesc.value })
    toast(`"${sec.title}" submitted for review.`)
    submitFor.value = null
    await reload()
  } catch (e) { toast(errMsg(e), 'error') } finally { submitting.value = false }
}

// ── comments & documents ──
const shownComments = computed(() => comments.value.filter((c) => c.versionId === ver.value?.id && (!onlySelected.value || !selectedId.value || c.activityId === selectedId.value)))
async function loadSide() { [comments.value, attachments.value] = await Promise.all([call(`comment/list/${props.id}`), call(`attachment/list/${props.id}`)]) }
const sectionOfItem = (aid) => globalItems.value.find((a) => a.id === aid)?.sectionId ?? null
async function postComment() {
  try {
    await call('comment/create', { mapId: Number(props.id), versionId: ver.value.id, sectionId: sectionOfItem(selectedId.value), activityId: selectedId.value, kind: commentKind.value, body: commentBody.value })
    commentBody.value = ''
    await loadSide()
  } catch (e) { toast(errMsg(e), 'error') }
}
async function resolveComment(c) { try { await call(`comment/resolve/${c.id}`); await loadSide() } catch (e) { toast(errMsg(e), 'error') } }
const readFile = (f) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f) })
async function upload() {
  const f = fileInput.value.files[0]
  if (!f) return
  try {
    await call('attachment/upload', { mapId: Number(props.id), versionId: ver.value.id, sectionId: sectionOfItem(selectedId.value), activityId: selectedId.value, ogTitle: f.name, attachTitle: docTitle.value || f.name, category: 'General', dataUrl: await readFile(f), size: f.size })
    docTitle.value = ''
    fileInput.value.value = ''
    toast('Document uploaded.')
    await loadSide()
  } catch (e) { toast(errMsg(e), 'error') }
}
async function download(a) {
  try { const f = await call(`attachment/download/${a.id}`); const l = document.createElement('a'); l.href = f.dataUrl; l.download = f.name; l.click() } catch (e) { toast(errMsg(e), 'error') }
}

// ── load, poll, presence ──
async function fetchVersion() {
  const m = await call(`map/detail/${props.id}`)
  const vid = m.openVersion?.id ?? m.versions[0].id
  const v = await call(`version/detail/${vid}`)
  v.map = { ...v.map, team: m.team }
  return v
}
const signature = (v) => JSON.stringify([v.status, v.sections.map((s) => [s.id, s.revision, s.status, s.assigneeId])])
let sig = ''
function applyVersion(v, { keepDirty = false } = {}) {
  ver.value = v
  const next = {}
  for (const sec of v.sections) {
    revisions[sec.id] = sec.revision
    const mine = v.status === 'IN_PROGRESS' && editableSet.value.has(sec.id)
    if (!mine) { delete drafts[sec.id]; continue }
    if (keepDirty && drafts[sec.id] && JSON.stringify(drafts[sec.id]) !== lastSaved[sec.id]) { next[sec.id] = lastSaved[sec.id]; continue }
    drafts[sec.id] = JSON.parse(JSON.stringify(sec.activities || []))
    next[sec.id] = JSON.stringify(drafts[sec.id])
  }
  lastSaved = next
  sig = signature(v)
}
async function reload() {
  conflict.value = ''
  loading.value = true
  const v = await fetchVersion()
  ver.value = v // editableSet depends on ver
  await loadSide()
  applyVersion(v)
  await nextTick()
  loading.value = false
  saveState.value = 'saved'
  announcePresence()
}
function announcePresence() { editableSet.value.forEach((sid) => call(`section/open/${sid}`).catch(() => {})) }
async function poll() {
  if (saving || conflict.value || dirtySections().length || document.hidden) return
  try {
    const v = await fetchVersion()
    if (signature(v) !== sig) {
      ver.value = v
      await loadSide()
      applyVersion(v, { keepDirty: true })
      if (v.status !== 'IN_PROGRESS') toast('The version moved on. Editor refreshed.')
    }
    announcePresence()
  } catch { /* transient */ }
}
onBeforeRouteLeave(async () => { await flushSave(); if (conflict.value) return window.confirm('Your latest changes could not be saved. Leave anyway?') })
function onLeave(e) { if (saveState.value === 'dirty' || saveState.value === 'saving') { e.preventDefault(); e.returnValue = '' } }

onMounted(async () => {
  try {
    ;[roles.value, systems.value] = await Promise.all([call('role/list'), call('system/list')])
    await reload()
  } catch (e) { toast(errMsg(e), 'error'); loading.value = false }
  pollTimer = setInterval(poll, POLL_MS)
  window.addEventListener('beforeunload', onLeave)
})
onBeforeUnmount(() => {
  clearInterval(pollTimer)
  clearTimeout(saveTimer)
  window.removeEventListener('beforeunload', onLeave)
  if (dirtySections().length) flushSave()
})
</script>

<style scoped>
.card--sel { border-color: #0067B1; box-shadow: 0 0 0 3px #FFD200; }
.ro-card { font-size: 12px; background: #fff; border: 1px solid #cbd5e1; border-radius: 4px; padding: 6px 10px; margin-bottom: 4px; color: #334155; cursor: pointer; }
.ro-card--sel { border-color: #0067B1; background: #EAF3FA; box-shadow: 0 0 0 2px #FFD200; }
.input--warn { border-color: #CE9700; background: #FFF8D6; }
</style>
