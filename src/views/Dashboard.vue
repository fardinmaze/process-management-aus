<template>
  <div class="p-4 sm:p-6 max-w-6xl">
    <h1 class="text-xl font-bold mt-0 mb-1">Welcome, {{ session.user.name }}</h1>
    <p class="text-sm text-slate-500 mt-0 mb-6">Here is what needs your attention.</p>
    <p v-if="!d" class="text-slate-500">Loading…</p>
    <template v-else>
      <div class="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <a v-if="d.mySections !== undefined" href="#my-work" class="card no-underline text-inherit hover:border-brand-400">
          <div class="flex items-center justify-between"><div class="text-3xl font-bold">{{ d.mySections }}</div><Icon name="edit" :size="22" class="text-brand-500" /></div>
          <div class="text-sm text-slate-500">Sections assigned to me</div>
        </a>
        <a v-if="canTodo" href="#todos" class="card no-underline text-inherit hover:border-brand-400">
          <div class="flex items-center justify-between"><div class="text-3xl font-bold">{{ openTodos }}</div><Icon name="checksquare" :size="22" class="text-brand-500" /></div>
          <div class="text-sm text-slate-500">Open to-dos</div>
        </a>
        <router-link v-if="d.pendingReviews !== undefined" to="/reviews" class="card no-underline text-inherit hover:border-brand-400">
          <div class="flex items-center justify-between"><div class="text-3xl font-bold">{{ d.pendingReviews }}</div><Icon name="inbox" :size="22" class="text-brand-500" /></div>
          <div class="text-sm text-slate-500">Maps awaiting my approval</div>
        </router-link>
        <div v-if="d.totalMaps !== undefined" class="card">
          <div class="flex items-center justify-between"><div class="text-3xl font-bold">{{ d.totalMaps }}</div><Icon name="layers" :size="22" class="text-brand-500" /></div>
          <div class="text-sm text-slate-500">{{ isAdmin ? 'Maps' : 'My maps' }}</div>
        </div>
        <div v-if="d.openFeedback !== undefined" class="card">
          <div class="flex items-center justify-between"><div class="text-3xl font-bold">{{ d.openFeedback }}</div><Icon name="message" :size="22" class="text-brand-500" /></div>
          <div class="text-sm text-slate-500">Open feedback</div>
        </div>
        <div v-if="d.userCount !== undefined" class="card">
          <div class="flex items-center justify-between"><div class="text-3xl font-bold">{{ d.userCount }}</div><Icon name="users" :size="22" class="text-brand-500" /></div>
          <div class="text-sm text-slate-500">Users</div>
        </div>
      </div>

      <section v-if="d.mySections !== undefined" id="my-work" class="mb-8 scroll-mt-4">
        <h2 class="text-base font-bold mt-0 mb-3 flex items-center gap-2"><Icon name="edit" /> My work</h2>
        <p v-if="!sections.length" class="text-sm text-slate-500">No sections are assigned to you right now.</p>
        <div v-for="s in sections" :key="s.id" class="card mb-3 flex flex-wrap items-center justify-between gap-3">
          <div class="min-w-0">
            <div class="font-semibold">{{ s.title }} <StatusChip :status="s.status" /></div>
            <div class="text-xs text-slate-500">{{ s.mapCode }} · {{ s.mapTitle }} · v{{ s.versionNo }}<span v-if="s.dueDate"> · due {{ fmtDate(s.dueDate) }}</span></div>
            <div v-if="s.openRevisions" class="text-xs text-red-600 mt-1 flex items-center gap-1"><Icon name="alert" :size="13" />{{ s.openRevisions }} open revision comment(s) to resolve</div>
          </div>
          <div class="flex gap-2 shrink-0">
            <router-link :to="`/maps/${s.mapId}`" class="btn btn-sm no-underline"><Icon name="eye" :size="14" />Overview</router-link>
            <router-link v-if="s.versionStatus === 'IN_PROGRESS'" :to="`/maps/${s.mapId}/edit`" class="btn btn-sm btn-primary no-underline"><Icon name="edit" :size="14" />Open editor</router-link>
          </div>
        </div>
      </section>

      <section v-if="canTodo" id="todos" class="mb-8 scroll-mt-4">
        <h2 class="text-base font-bold mt-0 mb-3 flex items-center gap-2"><Icon name="checksquare" /> To-do list</h2>
        <h3 class="text-sm font-semibold mt-0 mb-2">Assigned to me</h3>
        <p v-if="!mine.length" class="text-sm text-slate-500">Nothing assigned to you.</p>
        <div v-for="t in mine" :key="t.id" class="card mb-2 flex flex-wrap items-center gap-3">
          <input type="checkbox" :checked="t.done" :aria-label="`Mark ${t.title} done`" @change="toggle(t)">
          <div class="min-w-0 flex-1">
            <div :class="t.done ? 'line-through text-slate-500' : 'font-semibold'">{{ t.title }}</div>
            <div class="text-xs text-slate-500">{{ t.mapCode }} · {{ t.mapTitle }} · from {{ t.createdByName }}<span v-if="t.dueDate" :class="!t.done && t.dueDate < today ? 'text-red-600' : ''"> · due {{ fmtDate(t.dueDate) }}</span></div>
            <div v-if="t.note" class="text-xs text-slate-500">{{ t.note }}</div>
          </div>
          <router-link :to="`/maps/${t.mapId}`" class="btn btn-sm no-underline"><Icon name="map" :size="14" />Open map</router-link>
        </div>

        <template v-if="assignedByMe.length">
          <h3 class="text-sm font-semibold mt-5 mb-2">Assigned by me</h3>
          <div v-for="t in assignedByMe" :key="t.id" class="card mb-2 flex flex-wrap items-center gap-3">
            <span class="chip" :class="t.done ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'">{{ t.done ? 'Done' : 'Open' }}</span>
            <div class="min-w-0 flex-1">
              <div class="font-semibold">{{ t.title }}</div>
              <div class="text-xs text-slate-500">{{ t.mapCode }} · {{ t.mapTitle }} · to {{ t.assigneeName }}<span v-if="t.dueDate"> · due {{ fmtDate(t.dueDate) }}</span></div>
            </div>
            <router-link :to="`/maps/${t.mapId}`" class="btn btn-sm no-underline"><Icon name="map" :size="14" />Open map</router-link>
          </div>
        </template>
      </section>

      <div class="grid lg:grid-cols-2 gap-4">
        <div v-if="d.mapsByStatus" class="card">
          <h3 class="mt-0 text-sm flex items-center gap-2"><Icon name="chart" :size="16" />Maps by status</h3>
          <p v-if="!Object.keys(d.mapsByStatus).length" class="text-sm text-slate-500">No maps yet.</p>
          <div v-for="(n, s) in d.mapsByStatus" :key="s" class="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
            <StatusChip :status="s" /><span class="font-semibold">{{ n }}</span>
          </div>
        </div>

        <div v-if="d.sectionsAwaitingApproval" class="card">
          <h3 class="mt-0 text-sm flex items-center gap-2"><Icon name="check" :size="16" />Sections awaiting my approval</h3>
          <p v-if="!d.sectionsAwaitingApproval.length" class="text-sm text-slate-500">Nothing to review.</p>
          <router-link v-for="s in d.sectionsAwaitingApproval" :key="s.id" :to="`/maps/${s.mapId}`" class="block py-1.5 text-sm no-underline text-brand-700 border-b border-slate-50 last:border-0">
            {{ s.title }} <span class="text-slate-500">· {{ s.mapTitle }}</span>
          </router-link>
        </div>

        <div v-if="d.reviewsDue" class="card">
          <h3 class="mt-0 text-sm flex items-center gap-2"><Icon name="calendar" :size="16" />Reviews due</h3>
          <p v-if="!d.reviewsDue.length" class="text-sm text-slate-500">No reviews due in the next 30 days.</p>
          <router-link v-for="m in d.reviewsDue" :key="m.id" :to="`/maps/${m.id}`" class="block py-1.5 text-sm no-underline" :class="m.overdue ? 'text-red-600' : 'text-amber-700'">{{ m.title }} <span class="text-slate-500">· {{ m.overdue ? 'overdue since' : 'due' }} {{ fmtDate(m.due) }}</span></router-link>
        </div>

        <div v-if="d.reviewsOverdue" class="card">
          <h3 class="mt-0 text-sm flex items-center gap-2"><Icon name="clock" :size="16" />Periodic reviews overdue</h3>
          <p v-if="!d.reviewsOverdue.length" class="text-sm text-slate-500">None overdue.</p>
          <router-link v-for="m in d.reviewsOverdue" :key="m.id" :to="`/maps/${m.id}`" class="block py-1.5 text-sm no-underline text-brand-700">{{ m.title }} <span class="text-slate-500">· due {{ fmtDate(m.due) }}</span></router-link>
        </div>

        <div v-if="d.mostViewed" class="card">
          <h3 class="mt-0 text-sm flex items-center gap-2"><Icon name="eye" :size="16" />Most viewed published maps</h3>
          <p v-if="!d.mostViewed.length" class="text-sm text-slate-500">No published maps yet.</p>
          <router-link v-for="m in d.mostViewed" :key="m.id" :to="`/published/${m.id}`" class="flex justify-between py-1.5 text-sm no-underline text-brand-700"><span>{{ m.title }}</span><span class="text-slate-500">{{ m.views }} views</span></router-link>
        </div>

        <div v-if="viewerOnly" class="card lg:col-span-2">
          <h3 class="mt-0 text-sm flex items-center gap-2"><Icon name="book" :size="16" />Published maps</h3>
          <p class="text-sm text-slate-500">You have read-only access. Browse approved process maps and send feedback.</p>
          <router-link to="/published" class="btn btn-primary no-underline"><Icon name="book" :size="14" />Browse published maps</router-link>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { call } from '@/api'
import { session, hasRole, toast, errMsg } from '@/session'
import { fmtDate } from '@/util'
import StatusChip from '@/components/StatusChip.vue'

const d = ref(null)
const sections = ref([])
const todos = ref([])
const today = new Date().toISOString().slice(0, 10)
const isAdmin = computed(() => hasRole('ADMIN'))
const viewerOnly = computed(() => session.user.roles.every((r) => r === 'VIEWER'))
const canTodo = computed(() => hasRole('OWNER', 'CONTRIBUTOR'))
const mine = computed(() => todos.value.filter((t) => t.assigneeId === session.user.id))
const assignedByMe = computed(() => todos.value.filter((t) => t.createdBy === session.user.id && t.assigneeId !== session.user.id))
const openTodos = computed(() => mine.value.filter((t) => !t.done).length)

async function loadTodos() { if (canTodo.value) todos.value = await call('todo/my') }
async function toggle(t) { try { await call(`todo/toggle/${t.id}`); await loadTodos() } catch (e) { toast(errMsg(e), 'error') } }
onMounted(async () => {
  const [sum, secs] = await Promise.all([call('dashboard/summary'), canTodo.value ? call('section/my-assignments') : []])
  sections.value = secs
  await loadTodos()
  d.value = sum
})
</script>
