<template>
  <div class="p-6 max-w-6xl">
    <p v-if="loadError" class="text-red-600">{{ loadError }}</p>
    <p v-else-if="!map || !ver" class="text-slate-400">Loading…</p>
    <template v-else>
      <!-- Header -->
      <div class="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div class="min-w-0">
          <div class="text-xs font-mono text-slate-400">{{ map.code }} · {{ map.folderName }}</div>
          <h1 class="text-xl font-bold m-0">{{ map.title }}
            <StatusChip :status="ver.status" />
            <span class="text-sm font-normal text-slate-400">v{{ ver.versionNo }}</span>
          </h1>
          <p v-if="map.description" class="text-sm text-slate-500 mt-1 mb-0">{{ map.description }}</p>
          <p class="text-xs text-slate-500 mt-1 mb-0">Owner {{ map.ownerName }}<span v-if="map.expertName"> · Expert {{ map.expertName }}</span><span v-if="map.lastReviewedAt"> · last reviewed {{ fmtDate(map.lastReviewedAt) }}</span><span v-if="map.nextReviewDue" :class="map.overdue ? 'text-red-600 font-semibold' : ''"> · next review {{ fmtDate(map.nextReviewDue) }}</span></p>
          <p v-if="ver.changeNote" class="text-xs text-slate-500 mt-1 mb-0">Change note: {{ ver.changeNote }}</p>
          <p v-if="ver.submitDescription" class="text-xs text-slate-500 mt-1 mb-0">Submitted with: {{ ver.submitDescription }}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <select v-if="map.versions.length > 1" v-model.number="versionId" class="input w-auto" @change="loadVersion">
            <option v-for="v in map.versions" :key="v.id" :value="v.id">Version {{ v.versionNo }} · {{ v.status.toLowerCase().replace('_', ' ') }}</option>
          </select>
          <router-link v-if="canvasVisible" :to="`/maps/${map.id}/edit`" class="btn btn-primary no-underline">
            {{ ver.status === 'IN_PROGRESS' ? 'Open editor' : 'View outline' }}
          </router-link>
          <router-link v-if="ver.status === 'PUBLISHED'" :to="`/published/${map.id}`" class="btn no-underline">Open published view</router-link>
        </div>
      </div>

      <!-- Workflow banner -->
      <div class="card mb-4 bg-brand-50 border-brand-100">
        <div class="text-sm font-semibold text-brand-800">{{ banner.title }}</div>
        <div class="text-sm text-brand-700">{{ banner.text }}</div>
      </div>

      <!-- Owner actions -->
      <div v-if="isOwner" class="card mb-4">
        <div class="flex flex-wrap items-center gap-2">
          <template v-if="ver.status === 'PLANNING'">
            <button class="btn btn-primary" :disabled="busy" @click="kickoff">Kick off</button>
            <span class="text-xs text-slate-500">Every section needs an assignee first.</span>
          </template>
          <template v-if="ver.status === 'IN_PROGRESS'">
            <input v-model="pubDesc" class="input w-80" placeholder="What changed? (required to submit)" aria-label="Change description">
            <button class="btn btn-primary" :disabled="busy || !allApproved || !pubDesc.trim()" @click="submitPublication">Submit for publication</button>
            <button class="btn" @click="showLint = !showLint">{{ showLint ? 'Hide' : 'Run' }} map lint</button>
            <span v-if="!allApproved" class="text-xs text-slate-500">All sections must be approved first.</span>
          </template>
          <template v-if="ver.status === 'CHANGES_REQUESTED'">
            <button class="btn btn-primary" :disabled="busy || !reopenIds.length" @click="reopen">Reopen {{ reopenIds.length }} selected section(s)</button>
            <span class="text-xs text-slate-500">Tick the sections to rework below. Unticked sections stay approved.</span>
          </template>
          <template v-if="ver.status === 'PLANNING' && ver.versionNo > 1">
            <button class="btn" :disabled="busy || !reopenIds.length" @click="reopen">Reopen {{ reopenIds.length }} selected section(s)</button>
          </template>
          <template v-if="canNewVersion">
            <input v-model="changeNote" class="input w-72" placeholder="Change note (required)">
            <button class="btn btn-primary" :disabled="busy" @click="newVersion">Create new version</button>
          </template>
        </div>
        <div v-if="showLint || lintResult" class="mt-3">
          <LintPanel :lint="lintResult || ver.lint" />
        </div>
      </div>

      <!-- Periodic review (owner or Expert) -->
      <div v-if="canReview" class="card mb-4">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-sm font-semibold">Periodic review</span>
          <span class="text-xs" :class="map.overdue ? 'text-red-600' : 'text-slate-500'">Next review {{ fmtDate(map.nextReviewDue) }}{{ map.overdue ? ' (overdue)' : '' }}</span>
          <input v-model="reviewDesc" class="input w-80" placeholder="Note, e.g. Re-read, still accurate" aria-label="Review note">
          <button class="btn" :disabled="busy || !reviewDesc.trim()" @click="markReviewed">Mark as reviewed</button>
          <span class="text-xs text-slate-500">No change needed. For a change, create a new version instead.</span>
        </div>
      </div>

      <!-- Gate 2: approver -->
      <div v-if="ver.status === 'IN_REVIEW' && ver.approval" class="card mb-4 border-amber-200">
        <h3 class="mt-0 text-sm">Approval ({{ ver.approval.stages[ver.approval.stageIdx]?.name }})</h3>
        <p class="text-sm text-slate-600 mt-0">
          Submitted by {{ ver.submittedByName }}.
          Pending: <span v-if="!ver.approval.pendingApprovers.length">none</span>
          <span v-for="a in ver.approval.pendingApprovers" :key="a.id" class="chip bg-amber-100 text-amber-700 mr-1">{{ a.name }}</span>
        </p>
        <div v-for="(a, i) in ver.approval.actions" :key="i" class="text-xs text-slate-500">{{ a.userName }} {{ a.action.toLowerCase() }}d{{ a.note ? `: ${a.note}` : '' }}</div>
        <div v-if="ver.approval.canAct" class="mt-3 flex flex-wrap gap-2 items-center">
          <input v-model="reviewNote" class="input w-80" placeholder="Note (required to reject)">
          <button class="btn btn-primary" :disabled="busy" @click="decide('approve')">Approve</button>
          <button class="btn btn-danger" :disabled="busy" @click="decide('reject')">Reject</button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex gap-1 border-b border-slate-200 mb-4">
        <button v-for="t in tabs" :key="t" class="px-4 py-2 text-sm bg-transparent border-0 border-b-2 cursor-pointer"
                :class="tab === t ? 'border-brand-600 text-brand-700 font-semibold' : 'border-transparent text-slate-500'" @click="tab = t">
          {{ t }}<span v-if="t === 'Comments' && openComments" class="chip bg-amber-100 text-amber-700 ml-1">{{ openComments }}</span><span v-if="t === 'To-do' && openTodos" class="chip bg-amber-100 text-amber-700 ml-1">{{ openTodos }}</span>
        </button>
      </div>

      <!-- Sections -->
      <div v-if="tab === 'Sections'">
        <div v-if="!ver.sections.length" class="text-sm text-slate-500 mb-3">No sections yet. Split the process into sections and allocate each to a contributor.</div>
        <div v-for="s in ver.sections" :key="s.id" class="card mb-3">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <input v-if="isOwner && reopenable(s)" v-model="reopenIds" type="checkbox" :value="s.id" :aria-label="`Reopen ${s.title}`">
              <div>
                <div class="font-semibold">{{ s.title }} <StatusChip :status="s.status" /></div>
                <div class="text-xs text-slate-500">
                  {{ s.assigneeName ? `Assigned to ${s.assigneeName}` : 'Unassigned' }}<span v-if="s.dueDate"> · due {{ fmtDate(s.dueDate) }}</span>
                  <span v-if="s.openedBy" class="text-sky-600"> · opened by {{ s.openedBy.name }}</span>
                  · {{ s.activityCount }} step(s)
                </div>
                <div v-if="s.description" class="text-xs text-slate-500">{{ s.description }}</div>
              </div>
            </div>
            <div v-if="isOwner" class="flex flex-wrap items-center gap-2">
              <template v-if="editableVersion && s.status !== 'APPROVED'">
                <select class="input w-auto" :value="s.assigneeId || ''" @change="assign(s, $event.target.value)">
                  <option value="" disabled>Assign to…</option>
                  <option v-for="u in assignable" :key="u.id" :value="u.id">{{ u.name }}</option>
                </select>
              </template>
              <template v-if="s.status === 'SUBMITTED'">
                <input v-model="sectionNotes[s.id]" class="input w-56" placeholder="Note (required for changes)">
                <button class="btn btn-sm btn-primary" :disabled="busy" @click="gate1(s, 'approve')">Approve</button>
                <button class="btn btn-sm btn-danger" :disabled="busy" @click="gate1(s, 'request-changes')">Request changes</button>
              </template>
              <button v-if="editableVersion && !s.activityCount" class="btn btn-sm btn-danger" @click="removeSection(s)">Delete</button>
            </div>
          </div>
          <div v-for="d in decisionsFor(s.id)" :key="d.id" class="text-xs mt-1" :class="d.decision === 'APPROVED' ? 'text-green-700' : 'text-red-600'">
            {{ d.reviewerName }}: {{ d.decision === 'APPROVED' ? 'approved' : 'requested changes' }}{{ d.note ? ` — ${d.note}` : '' }}
          </div>
        </div>

        <form v-if="isOwner && editableVersion" class="card" @submit.prevent="addSection">
          <h3 class="mt-0 text-sm">Add a section</h3>
          <div class="grid md:grid-cols-4 gap-3">
            <input v-model="newSection.title" class="input" placeholder="Title (e.g. HR admin)" required>
            <input v-model="newSection.description" class="input" placeholder="Description">
            <select v-model="newSection.assigneeId" class="input">
              <option value="">Assign later</option>
              <option v-for="u in assignable" :key="u.id" :value="u.id">{{ u.name }}</option>
            </select>
            <input v-model="newSection.dueDate" class="input" type="date" aria-label="Due date">
          </div>
          <button class="btn btn-primary mt-3" :disabled="busy">Add section</button>
        </form>
      </div>

      <!-- Team -->
      <div v-if="tab === 'Team'" class="grid md:grid-cols-2 gap-4">
        <div class="card">
          <h3 class="mt-0 text-sm">Map team</h3>
          <div v-for="u in map.team" :key="u.id" class="flex items-center justify-between py-1.5 border-b border-slate-50 text-sm">
            <span>{{ u.name }} <span v-if="u.isOwner" class="chip bg-brand-50 text-brand-700">Owner</span></span>
            <span class="text-xs text-slate-400">{{ u.roles.join(', ') }}</span>
          </div>
        </div>
        <form v-if="isOwner" class="card" @submit.prevent="invite">
          <h3 class="mt-0 text-sm">Invite someone to this map</h3>
          <input v-model="inv.email" type="email" class="input mb-2" placeholder="Email" required>
          <select v-model="inv.role" class="input mb-3"><option value="CONTRIBUTOR">Contributor</option><option value="VIEWER">Viewer</option></select>
          <button class="btn btn-primary" :disabled="busy">Send invitation</button>
          <div v-if="inviteLink" class="mt-3 text-xs break-all bg-slate-50 rounded-lg p-2">
            Demo email (no mail server): <a :href="inviteLink">{{ inviteLink }}</a>
          </div>
        </form>
      </div>

      <!-- Documents -->
      <div v-if="tab === 'Documents'">
        <form v-if="canAttach" class="card mb-4" @submit.prevent="upload">
          <h3 class="mt-0 text-sm">Attach a document</h3>
          <div class="grid md:grid-cols-4 gap-3">
            <input ref="fileInput" type="file" class="input" required aria-label="File">
            <input v-model="doc.title" class="input" placeholder="Title">
            <select v-model="doc.category" class="input"><option>General</option><option>Briefing</option><option>Checklist</option><option>Policy</option><option>Form</option></select>
            <select v-model="doc.sectionId" class="input"><option value="">Whole map</option><option v-for="s in ver.sections" :key="s.id" :value="s.id">{{ s.title }}</option></select>
          </div>
          <button class="btn btn-primary mt-3" :disabled="busy">Upload</button>
          <span class="text-xs text-slate-400 ml-2">Demo limit 600 KB. Attachments are internal by default.</span>
        </form>
        <div class="card p-0 overflow-hidden">
          <table class="w-full border-collapse">
            <thead><tr><th class="th">Title</th><th class="th">Category</th><th class="th">Scope</th><th class="th">By</th><th class="th">Visibility</th><th class="th" /></tr></thead>
            <tbody>
              <tr v-if="!attachments.length"><td class="td text-slate-400" colspan="6">No documents yet.</td></tr>
              <tr v-for="a in attachments" :key="a.id">
                <td class="td"><button class="bg-transparent border-0 text-brand-700 cursor-pointer p-0 text-sm underline" @click="download(a)">{{ a.attachTitle }}</button></td>
                <td class="td">{{ a.category }}</td>
                <td class="td">{{ scopeLabel(a) }}</td>
                <td class="td">{{ a.uploaderName }}</td>
                <td class="td">
                  <button v-if="isOwner" class="btn btn-sm" @click="toggleVis(a)">{{ a.visibility === 'PORTAL' ? 'Published readers' : 'Internal' }}</button>
                  <span v-else>{{ a.visibility === 'PORTAL' ? 'Published readers' : 'Internal' }}</span>
                </td>
                <td class="td"><button v-if="isOwner || a.uploadedBy === session.user.id" class="btn btn-sm btn-danger" @click="removeDoc(a)">Delete</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Comments -->
      <div v-if="tab === 'Comments'">
        <form v-if="canComment" class="card mb-4" @submit.prevent="comment">
          <div class="grid md:grid-cols-4 gap-3">
            <textarea v-model="newComment.body" class="input md:col-span-2" rows="2" placeholder="Write a comment…" required />
            <select v-model="newComment.sectionId" class="input"><option value="">Whole map</option><option v-for="s in ver.sections" :key="s.id" :value="s.id">{{ s.title }}</option></select>
            <select v-model="newComment.kind" class="input">
              <option value="COMMENT">Comment</option>
              <option v-if="canRevision" value="REVISION">Revision (blocks submit)</option>
            </select>
          </div>
          <button class="btn btn-primary mt-3" :disabled="busy">Post</button>
        </form>
        <p v-if="!comments.length" class="text-sm text-slate-500">No comments yet.</p>
        <div v-for="c in comments" :key="c.id" class="card mb-2">
          <div class="flex items-center justify-between">
            <div class="text-xs text-slate-500">
              <strong>{{ c.authorName }}</strong> · {{ fmt(c.createdAt) }} ·
              <span class="chip" :class="c.kind === 'REVISION' ? 'bg-red-100 text-red-700' : c.kind === 'FEEDBACK' ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-600'">{{ c.kind.toLowerCase() }}</span>
              <span v-if="c.sectionId"> · {{ sectionTitle(c.sectionId) }}</span>
              <span v-if="c.nodeId"> · step</span>
            </div>
            <div class="flex items-center gap-2"><StatusChip :status="c.status" /><button v-if="c.status === 'OPEN'" class="btn btn-sm" @click="resolve(c)">Resolve</button></div>
          </div>
          <div class="text-sm mt-1">{{ c.body }}</div>
        </div>
      </div>

      <!-- Summary -->
      <div v-if="tab === 'Summary'" class="grid md:grid-cols-3 gap-4">
        <form class="card md:col-span-2" @submit.prevent="saveSummary">
          <h3 class="mt-0 text-sm">Summary</h3>
          <template v-for="f in SUMMARY_FIELDS" :key="f.key">
            <label class="label" :for="`sm-${f.key}`">{{ f.label }}</label>
            <textarea :id="`sm-${f.key}`" v-model="summary[f.key]" class="input mb-3" rows="2" :placeholder="f.hint" :disabled="!isOwner" />
          </template>
          <button v-if="isOwner" class="btn btn-primary" :disabled="busy">Save summary and tags</button>
          <span v-else class="text-xs text-slate-400">Only the map owner can edit the summary.</span>
        </form>
        <div class="card self-start">
          <h3 class="mt-0 text-sm">Tags</h3>
          <div class="flex flex-wrap gap-1 mb-3">
            <span v-if="!tagList.length" class="text-sm text-slate-400">No tags yet.</span>
            <span v-for="t in tagList" :key="t" class="chip bg-brand-50 text-brand-700">
              {{ t }}<button v-if="isOwner" type="button" class="bg-transparent border-0 cursor-pointer text-brand-700 ml-1 p-0" :aria-label="`Remove tag ${t}`" @click="removeTag(t)">×</button>
            </span>
          </div>
          <div v-if="isOwner" class="flex gap-2">
            <input v-model="newTag" class="input" placeholder="Add a tag" aria-label="New tag" @keydown.enter.prevent="addTag">
            <button type="button" class="btn" @click="addTag">Add</button>
          </div>
          <p class="text-xs text-slate-400 mb-0 mt-2">Tags are saved when you press Save summary and tags.</p>
        </div>
      </div>

      <!-- To-do -->
      <div v-if="tab === 'To-do'">
        <form v-if="isOwner" class="card mb-4" @submit.prevent="addTodo">
          <h3 class="mt-0 text-sm">Assign a to-do</h3>
          <div class="grid md:grid-cols-4 gap-3">
            <input v-model="newTodo.title" class="input md:col-span-2" placeholder="What needs doing?" required aria-label="To-do title">
            <select v-model="newTodo.assigneeId" class="input" required aria-label="Assign to">
              <option value="" disabled>Assign to…</option>
              <option v-for="u in assignable" :key="u.id" :value="u.id">{{ u.name }}</option>
            </select>
            <input v-model="newTodo.dueDate" type="date" class="input" aria-label="Due date">
          </div>
          <input v-model="newTodo.note" class="input mt-3" placeholder="Note (optional)" aria-label="Note">
          <button class="btn btn-primary mt-3" :disabled="busy">Add to-do</button>
          <span class="text-xs text-slate-400 ml-2">It appears in the assignee's To-do list.</span>
        </form>
        <div class="card p-0 overflow-hidden">
          <table class="w-full border-collapse">
            <thead><tr><th class="th w-10" /><th class="th">To-do</th><th class="th">Assigned to</th><th class="th">Due</th><th class="th" /></tr></thead>
            <tbody>
              <tr v-if="!todos.length"><td class="td text-slate-400" colspan="5">No to-dos yet.</td></tr>
              <tr v-for="t in todos" :key="t.id">
                <td class="td"><input type="checkbox" :checked="t.done" :disabled="t.assigneeId !== session.user.id && !isOwner" :aria-label="`Mark ${t.title} done`" @change="toggleTodo(t)"></td>
                <td class="td" :class="t.done ? 'line-through text-slate-400' : ''">{{ t.title }}<div v-if="t.note" class="text-xs text-slate-500 no-underline">{{ t.note }}</div></td>
                <td class="td">{{ t.assigneeName }}</td>
                <td class="td whitespace-nowrap" :class="!t.done && t.dueDate && t.dueDate < today ? 'text-red-600' : ''">{{ t.dueDate ? fmtDate(t.dueDate) : '' }}</td>
                <td class="td"><button v-if="isOwner" class="btn btn-sm btn-danger" @click="removeTodo(t)">Delete</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Change log -->
      <div v-if="tab === 'Change log'" class="card p-0 overflow-hidden">
        <table class="w-full border-collapse">
          <thead><tr><th class="th">When</th><th class="th">Who</th><th class="th">What changed</th><th class="th">Note</th></tr></thead>
          <tbody>
            <tr v-if="!changeLog.length"><td class="td text-slate-400" colspan="4">Nothing yet.</td></tr>
            <tr v-for="c in changeLog" :key="c.id"><td class="td whitespace-nowrap">{{ fmt(c.at) }}</td><td class="td">{{ c.userName }}</td><td class="td">{{ c.text }}</td><td class="td">{{ c.note }}</td></tr>
          </tbody>
        </table>
      </div>

      <!-- Activity -->
      <div v-if="tab === 'Activity'" class="card p-0 overflow-hidden">
        <table class="w-full border-collapse">
          <thead><tr><th class="th">When</th><th class="th">Who</th><th class="th">Action</th><th class="th">Change</th><th class="th">Note</th></tr></thead>
          <tbody>
            <tr v-if="!activity.length"><td class="td text-slate-400" colspan="5">No activity yet.</td></tr>
            <tr v-for="a in activity" :key="a.id">
              <td class="td whitespace-nowrap">{{ fmt(a.at) }}</td><td class="td">{{ a.userName }}</td><td class="td font-mono text-xs">{{ a.action }}</td>
              <td class="td">{{ a.from || a.to ? `${a.from || '—'} → ${a.to || '—'}` : '' }}</td><td class="td">{{ a.note }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { call } from '@/api'
import { session, hasRole, toast, errMsg } from '@/session'
import { fmt, fmtDate } from '@/util'
import StatusChip from '@/components/StatusChip.vue'
import LintPanel from '@/components/LintPanel.vue'

const props = defineProps({ id: { type: [String, Number], required: true } })
const router = useRouter()

const map = ref(null)
const ver = ref(null)
const versionId = ref(null)
const loadError = ref('')
const busy = ref(false)
const tab = ref('Sections')
const tabs = ['Sections', 'Summary', 'To-do', 'Team', 'Documents', 'Comments', 'Change log', 'Activity']

const users = ref([])
const comments = ref([])
const attachments = ref([])
const activity = ref([])
const changeLog = ref([])
const todos = ref([])
const summary = reactive({ objective: '', background: '', triggers: '', inputs: '', outputs: '' })
const tagList = ref([])
const newTag = ref('')
const newTodo = reactive({ title: '', note: '', assigneeId: '', dueDate: '' })
const today = new Date().toISOString().slice(0, 10)
const SUMMARY_FIELDS = [
  { key: 'objective', label: 'Objective', hint: 'Why this process exists' },
  { key: 'background', label: 'Background', hint: 'Context, policy or legislation behind it' },
  { key: 'triggers', label: 'Triggers', hint: 'What starts the process' },
  { key: 'inputs', label: 'Inputs', hint: 'What is needed to begin' },
  { key: 'outputs', label: 'Outputs', hint: 'What it produces' },
]
const reopenIds = ref([])
const reviewNote = ref('')
const pubDesc = ref('')
const reviewDesc = ref('')
const changeNote = ref('')
const sectionNotes = reactive({})
const newSection = reactive({ title: '', description: '', assigneeId: '', dueDate: '' })
const newComment = reactive({ body: '', sectionId: '', kind: 'COMMENT' })
const doc = reactive({ title: '', category: 'General', sectionId: '' })
const inv = reactive({ email: '', role: 'CONTRIBUTOR' })
const inviteLink = ref('')
const showLint = ref(false)
const lintResult = ref(null)
const fileInput = ref(null)

const me = computed(() => session.user)
const canReview = computed(() => map.value && map.value.publishedVersion && ver.value.id === map.value.publishedVersion.id && (isOwner.value || map.value.expertId === me.value.id))
const isOwner = computed(() => hasRole('ADMIN') || (hasRole('OWNER') && map.value?.ownerId === me.value.id))
const editableVersion = computed(() => ['PLANNING', 'IN_PROGRESS', 'CHANGES_REQUESTED'].includes(ver.value?.status))
const allApproved = computed(() => ver.value.sections.length > 0 && ver.value.sections.every((s) => s.status === 'APPROVED'))
const canNewVersion = computed(() => !map.value.openVersion && map.value.publishedVersion && ver.value.status === 'PUBLISHED' && ver.value.id === map.value.publishedVersion.id)
const canvasVisible = computed(() => ['PLANNING', 'IN_PROGRESS', 'CHANGES_REQUESTED', 'IN_REVIEW'].includes(ver.value.status) && ver.value.sections.length > 0)
const canAttach = computed(() => isOwner.value || map.value.team.some((t) => t.id === me.value.id))
const canComment = computed(() => isOwner.value || canAttach.value || (hasRole('APPROVER') && ver.value.status === 'IN_REVIEW'))
const canRevision = computed(() => isOwner.value || (hasRole('APPROVER') && ver.value.status === 'IN_REVIEW'))
const openTodos = computed(() => todos.value.filter((t) => !t.done).length)
const openComments = computed(() => comments.value.filter((c) => c.status === 'OPEN').length)
const assignable = computed(() => users.value.filter((u) => u.roles.includes('CONTRIBUTOR') || u.roles.includes('OWNER')))

const BANNERS = {
  PLANNING: ['Planning', 'Define sections and allocate each to a contributor, then kick off.'],
  IN_PROGRESS: ['In progress', 'Contributors write their own sections as outlines. Review each submitted section (gate 1), then submit the assembled map for publication.'],
  IN_REVIEW: ['In review', 'The assembled map is locked while approvers review it (gate 2).'],
  CHANGES_REQUESTED: ['Changes requested', 'An approver rejected this version. Reopen the sections that need rework.'],
  PUBLISHED: ['Published', 'This version is live and read-only. Create a new version to revise it.'],
  SUPERSEDED: ['Superseded', 'A newer version has replaced this one.'],
}
const banner = computed(() => ({ title: BANNERS[ver.value.status][0], text: BANNERS[ver.value.status][1] }))

const reopenable = (s) => s.status === 'APPROVED' && ['CHANGES_REQUESTED', 'PLANNING'].includes(ver.value.status) && (ver.value.status === 'CHANGES_REQUESTED' || ver.value.versionNo > 1)
const decisionsFor = (sid) => (ver.value.decisions || []).filter((d) => d.sectionId === sid)
const sectionTitle = (sid) => ver.value.sections.find((s) => s.id === sid)?.title || ''
const scopeLabel = (a) => (a.sectionId ? sectionTitle(a.sectionId) || 'Section' : 'Whole map')

async function loadAll() {
  try {
    map.value = await call(`map/detail/${props.id}`)
    versionId.value = versionId.value || map.value.openVersion?.id || map.value.publishedVersion?.id || map.value.versions[0].id
    await loadVersion()
    if (hasRole('ADMIN', 'OWNER')) users.value = await call('user/list')
  } catch (e) { loadError.value = errMsg(e) }
}
async function loadVersion() {
  ver.value = await call(`version/detail/${versionId.value}`)
  reopenIds.value = []
  lintResult.value = null
  await refreshSide()
}
async function refreshSide() {
  [comments.value, attachments.value] = await Promise.all([call(`comment/list/${props.id}`), call(`attachment/list/${props.id}`)])
  comments.value = comments.value.filter((c) => c.versionId === ver.value.id || c.kind === 'FEEDBACK')
  activity.value = await call('activity/list', { mapId: props.id })
  ;[changeLog.value, todos.value] = await Promise.all([call(`changelog/list/${props.id}`), call(`todo/list/${props.id}`)])
  Object.assign(summary, map.value.summary || {})
  tagList.value = [...(map.value.tags || [])]
}
const addTag = () => { const t = newTag.value.trim(); if (t && !tagList.value.includes(t)) tagList.value.push(t); newTag.value = '' }
const removeTag = (t) => { tagList.value = tagList.value.filter((x) => x !== t) }
const saveSummary = () => run(() => call(`map/edit/${props.id}`, { summary: { ...summary }, tags: tagList.value }), 'Summary and tags saved.')
const addTodo = () => run(async () => {
  await call('todo/create', { mapId: Number(props.id), ...newTodo, assigneeId: Number(newTodo.assigneeId) })
  Object.assign(newTodo, { title: '', note: '', assigneeId: '', dueDate: '' })
}, 'To-do assigned.')
const toggleTodo = (t) => run(() => call(`todo/toggle/${t.id}`))
const removeTodo = (t) => run(() => call(`todo/delete/${t.id}`), 'To-do deleted.')
async function run(fn, okMsg) {
  busy.value = true
  try {
    await fn()
    if (okMsg) toast(okMsg)
    map.value = await call(`map/detail/${props.id}`)
    if (!map.value.versions.some((v) => v.id === versionId.value)) versionId.value = map.value.versions[0].id
    await loadVersion()
  } catch (e) {
    if (e.code === 422 && e.data) { lintResult.value = e.data; showLint.value = true }
    toast(errMsg(e), 'error')
  } finally { busy.value = false }
}

const addSection = () => run(async () => {
  await call('section/create', { versionId: ver.value.id, ...newSection, assigneeId: newSection.assigneeId || null, dueDate: newSection.dueDate || null })
  Object.assign(newSection, { title: '', description: '', assigneeId: '', dueDate: '' })
}, 'Section added.')
const assign = (s, userId) => run(() => call(`section/assign/${s.id}`, { assigneeId: userId }), 'Section assigned.')
const removeSection = (s) => run(() => call(`section/delete/${s.id}`), 'Section deleted.')
const kickoff = () => run(() => call(`version/kickoff/${ver.value.id}`), 'Kicked off. Assignees were notified.')
const gate1 = (s, action) => run(() => call(`section/${action}/${s.id}`, { note: sectionNotes[s.id] || '' }), action === 'approve' ? 'Section approved.' : 'Changes requested.')
const submitPublication = () => run(async () => { await call(`version/submit/${ver.value.id}`, { changeDescription: pubDesc.value }); pubDesc.value = '' }, 'Submitted for publication.')
const markReviewed = () => run(async () => { await call(`map/mark-reviewed/${map.value.id}`, { note: reviewDesc.value }); reviewDesc.value = '' }, 'Marked as reviewed. No new version was created.')
async function decide(what) {
  busy.value = true
  try {
    await call(`version/${what}/${ver.value.id}`, { note: reviewNote.value })
    toast(what === 'approve' ? 'Approval recorded.' : 'Rejected and returned to the owner.')
    // Approvers may only view a map while it is IN_REVIEW, so leave the page once they have decided.
    router.push('/reviews')
  } catch (e) { toast(errMsg(e), 'error') } finally { busy.value = false }
}
const reopen = () => run(() => call(`version/reopen/${ver.value.id}`, { sectionIds: reopenIds.value }), 'Sections reopened.')
const newVersion = () => run(async () => {
  const v = await call(`version/create-draft/${props.id}`, { changeNote: changeNote.value })
  versionId.value = v.id
  changeNote.value = ''
  tab.value = 'Sections'
}, 'New version created in planning.')
const comment = () => run(async () => {
  await call('comment/create', { mapId: Number(props.id), versionId: ver.value.id, sectionId: newComment.sectionId || null, kind: newComment.kind, body: newComment.body })
  Object.assign(newComment, { body: '', sectionId: '', kind: 'COMMENT' })
})
const resolve = (c) => run(() => call(`comment/resolve/${c.id}`))
const invite = () => run(async () => {
  const i = await call('invitation/create', { email: inv.email, role: inv.role, mapId: Number(props.id) })
  inviteLink.value = `${location.origin}/invite/accept/${i.token}`
  inv.email = ''
}, 'Invitation created.')

function readFile(file) {
  return new Promise((resolveFn, rejectFn) => {
    const r = new FileReader()
    r.onload = () => resolveFn(r.result)
    r.onerror = rejectFn
    r.readAsDataURL(file)
  })
}
const upload = () => run(async () => {
  const file = fileInput.value.files[0]
  if (!file) throw new Error('Choose a file.')
  await call('attachment/upload', { mapId: Number(props.id), versionId: ver.value.id, sectionId: doc.sectionId || null, ogTitle: file.name, attachTitle: doc.title || file.name, category: doc.category, dataUrl: await readFile(file), size: file.size })
  doc.title = ''
  fileInput.value.value = ''
}, 'Document uploaded.')
async function download(a) {
  try {
    const f = await call(`attachment/download/${a.id}`)
    const link = document.createElement('a')
    link.href = f.dataUrl
    link.download = f.name
    link.click()
  } catch (e) { toast(errMsg(e), 'error') }
}
const toggleVis = (a) => run(() => call(`attachment/toggle-portal/${a.id}`))
const removeDoc = (a) => run(() => call(`attachment/delete/${a.id}`), 'Document deleted.')

onMounted(loadAll)
</script>
