<template>
  <div class="p-6 max-w-5xl">
    <h1 class="text-xl font-bold mt-0 mb-4">My work</h1>
    <p v-if="loading" class="text-slate-400">Loading…</p>
    <p v-else-if="!rows.length" class="text-sm text-slate-500">No sections are assigned to you right now.</p>
    <div v-for="s in rows" :key="s.id" class="card mb-3 flex items-center justify-between gap-4">
      <div class="min-w-0">
        <div class="font-semibold">{{ s.title }} <StatusChip :status="s.status" /></div>
        <div class="text-xs text-slate-500">{{ s.mapCode }} · {{ s.mapTitle }} · v{{ s.versionNo }}<span v-if="s.dueDate"> · due {{ fmtDate(s.dueDate) }}</span></div>
        <div v-if="s.openRevisions" class="text-xs text-red-600 mt-1">{{ s.openRevisions }} open revision comment(s) to resolve</div>
      </div>
      <div class="flex gap-2 shrink-0">
        <router-link :to="`/maps/${s.mapId}`" class="btn btn-sm no-underline">Overview</router-link>
        <router-link v-if="s.versionStatus === 'IN_PROGRESS'" :to="`/maps/${s.mapId}/edit`" class="btn btn-sm btn-primary no-underline">Open editor</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { call } from '@/api'
import { fmtDate } from '@/util'
import StatusChip from '@/components/StatusChip.vue'

const rows = ref([])
const loading = ref(true)
onMounted(async () => { rows.value = await call('section/my-assignments'); loading.value = false })
</script>
