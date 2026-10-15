<template>
  <div class="p-4 sm:p-6 max-w-5xl">
    <h1 class="text-xl font-bold mt-0 mb-4 flex items-center gap-2"><Icon name="inbox" :size="22" />Approval inbox</h1>
    <p v-if="loading" class="text-slate-500">Loading…</p>
    <p v-else-if="!rows.length" class="text-sm text-slate-500">No maps are waiting for your approval.</p>
    <div v-for="r in rows" :key="r.versionId" class="card mb-3 flex items-center justify-between">
      <div>
        <div class="font-semibold">{{ r.mapTitle }} <span class="text-slate-500 font-normal">v{{ r.versionNo }}</span></div>
        <div class="text-xs text-slate-500">{{ r.mapCode }} · submitted by {{ r.submittedBy }} · {{ fmt(r.submittedAt) }} · stage: {{ r.stage }}</div>
      </div>
      <router-link :to="`/maps/${r.mapId}`" class="btn btn-primary btn-sm no-underline">Review</router-link>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { call } from '@/api'
import { fmt } from '@/util'

const rows = ref([])
const loading = ref(true)
onMounted(async () => { rows.value = await call('review/inbox'); loading.value = false })
</script>
