<template>
  <div class="p-4 sm:p-6 max-w-6xl">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-bold m-0 flex items-center gap-2"><Icon name="layers" :size="22" />Maps in progress</h1>
      <router-link v-if="hasRole('ADMIN', 'OWNER')" to="/maps/new" class="btn btn-primary no-underline"><Icon name="plus" :size="15" />New map</router-link>
    </div>
    <div class="flex gap-3 mb-4">
      <div class="relative max-w-xs w-full"><Icon name="search" :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input v-model="q" class="input !pl-9" placeholder="Filter by title or code…" aria-label="Filter maps"></div>
      <select v-model="folder" class="input max-w-[180px]">
        <option value="">All folders</option>
        <option v-for="f in folders" :key="f.id" :value="f.name">{{ f.name }}</option>
      </select>
    </div>
    <div class="card p-0 overflow-hidden">
      <table class="w-full border-collapse">
        <thead><tr><th class="th">Code</th><th class="th">Title</th><th class="th">Folder</th><th class="th">Owner</th><th class="th">Status</th><th class="th">Version</th></tr></thead>
        <tbody>
          <tr v-if="loading"><td class="td text-slate-500" colspan="6">Loading…</td></tr>
          <tr v-else-if="!rows.length"><td class="td text-slate-500" colspan="6">No maps yet.</td></tr>
          <tr v-for="m in rows" :key="m.id" class="hover:bg-slate-50 cursor-pointer" @click="$router.push(`/maps/${m.id}`)">
            <td class="td font-mono text-xs">{{ m.code }}</td>
            <td class="td font-semibold">{{ m.title }}</td>
            <td class="td">{{ m.folderName }}</td>
            <td class="td">{{ m.ownerName }}</td>
            <td class="td"><StatusChip :status="m.status" /></td>
            <td class="td">v{{ (m.openVersion || m.publishedVersion)?.versionNo ?? 1 }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { call } from '@/api'
import { hasRole } from '@/session'
import StatusChip from '@/components/StatusChip.vue'

const maps = ref([])
const folders = ref([])
const loading = ref(true)
const q = ref('')
const folder = ref('')

const rows = computed(() => maps.value.filter((m) =>
  (!folder.value || m.folderName === folder.value) &&
  (!q.value || `${m.title} ${m.code}`.toLowerCase().includes(q.value.toLowerCase())),
))
onMounted(async () => {
  [maps.value, folders.value] = await Promise.all([call('map/list'), call('folder/list')])
  loading.value = false
})
</script>
