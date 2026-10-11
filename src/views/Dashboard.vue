<template>
  <div class="p-6 max-w-6xl">
    <h1 class="text-xl font-bold mt-0 mb-1">Welcome, {{ session.user.name }}</h1>
    <p class="text-sm text-slate-500 mt-0 mb-6">Here is what needs your attention.</p>
    <p v-if="!d" class="text-slate-400">Loading…</p>
    <template v-else>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <router-link v-if="d.mySections !== undefined" to="/my-work" class="card no-underline text-inherit hover:border-brand-400">
          <div class="text-3xl font-bold">{{ d.mySections }}</div><div class="text-sm text-slate-500">Sections assigned to me</div>
        </router-link>
        <router-link v-if="d.pendingReviews !== undefined" to="/reviews" class="card no-underline text-inherit hover:border-brand-400">
          <div class="text-3xl font-bold">{{ d.pendingReviews }}</div><div class="text-sm text-slate-500">Maps awaiting my approval</div>
        </router-link>
        <div v-if="d.totalMaps !== undefined" class="card"><div class="text-3xl font-bold">{{ d.totalMaps }}</div><div class="text-sm text-slate-500">{{ isAdmin ? 'Maps' : 'My maps' }}</div></div>
        <div v-if="d.openFeedback !== undefined" class="card"><div class="text-3xl font-bold">{{ d.openFeedback }}</div><div class="text-sm text-slate-500">Open feedback</div></div>
        <div v-if="d.userCount !== undefined" class="card"><div class="text-3xl font-bold">{{ d.userCount }}</div><div class="text-sm text-slate-500">Users</div></div>
      </div>

      <div class="grid lg:grid-cols-2 gap-4">
        <div v-if="d.mapsByStatus" class="card">
          <h3 class="mt-0 text-sm">Maps by status</h3>
          <p v-if="!Object.keys(d.mapsByStatus).length" class="text-sm text-slate-400">No maps yet.</p>
          <div v-for="(n, s) in d.mapsByStatus" :key="s" class="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
            <StatusChip :status="s" /><span class="font-semibold">{{ n }}</span>
          </div>
        </div>

        <div v-if="d.sectionsAwaitingApproval" class="card">
          <h3 class="mt-0 text-sm">Sections awaiting my approval</h3>
          <p v-if="!d.sectionsAwaitingApproval.length" class="text-sm text-slate-400">Nothing to review.</p>
          <router-link v-for="s in d.sectionsAwaitingApproval" :key="s.id" :to="`/maps/${s.mapId}`" class="block py-1.5 text-sm no-underline text-brand-700 border-b border-slate-50 last:border-0">
            {{ s.title }} <span class="text-slate-400">· {{ s.mapTitle }}</span>
          </router-link>
        </div>

        <div v-if="d.reviewsDue" class="card">
          <h3 class="mt-0 text-sm">Reviews due</h3>
          <p v-if="!d.reviewsDue.length" class="text-sm text-slate-400">No reviews due in the next 30 days.</p>
          <router-link v-for="m in d.reviewsDue" :key="m.id" :to="`/maps/${m.id}`" class="block py-1.5 text-sm no-underline" :class="m.overdue ? 'text-red-600' : 'text-amber-700'">{{ m.title }} <span class="text-slate-500">· {{ m.overdue ? 'overdue since' : 'due' }} {{ fmtDate(m.due) }}</span></router-link>
        </div>

        <div v-if="d.reviewsOverdue" class="card">
          <h3 class="mt-0 text-sm">Periodic reviews overdue</h3>
          <p v-if="!d.reviewsOverdue.length" class="text-sm text-slate-400">None overdue.</p>
          <router-link v-for="m in d.reviewsOverdue" :key="m.id" :to="`/maps/${m.id}`" class="block py-1.5 text-sm no-underline text-brand-700">{{ m.title }} <span class="text-slate-400">· due {{ fmtDate(m.due) }}</span></router-link>
        </div>

        <div v-if="d.mostViewed" class="card">
          <h3 class="mt-0 text-sm">Most viewed published maps</h3>
          <p v-if="!d.mostViewed.length" class="text-sm text-slate-400">No published maps yet.</p>
          <router-link v-for="m in d.mostViewed" :key="m.id" :to="`/published/${m.id}`" class="flex justify-between py-1.5 text-sm no-underline text-brand-700"><span>{{ m.title }}</span><span class="text-slate-400">{{ m.views }} views</span></router-link>
        </div>

        <div v-if="viewerOnly" class="card lg:col-span-2">
          <h3 class="mt-0 text-sm">Published maps</h3>
          <p class="text-sm text-slate-500">You have read-only access. Browse approved process maps and send feedback.</p>
          <router-link to="/published" class="btn btn-primary no-underline">Browse published maps</router-link>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { call } from '@/api'
import { session, hasRole } from '@/session'
import { fmtDate } from '@/util'
import StatusChip from '@/components/StatusChip.vue'

const d = ref(null)
const isAdmin = computed(() => hasRole('ADMIN'))
const viewerOnly = computed(() => session.user.roles.every((r) => r === 'VIEWER'))
onMounted(async () => { d.value = await call('dashboard/summary') })
</script>
