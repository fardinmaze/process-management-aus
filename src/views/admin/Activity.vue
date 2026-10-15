<template>
  <div class="p-4 sm:p-6 max-w-6xl">
    <h1 class="text-xl font-bold mt-0 mb-4 flex items-center gap-2"><Icon name="activity" :size="22" />Activity log</h1>
    <div class="card p-0 overflow-hidden">
      <table class="w-full border-collapse">
        <thead><tr><th class="th">When</th><th class="th">Who</th><th class="th">Action</th><th class="th">Object</th><th class="th">Change</th><th class="th">Note</th></tr></thead>
        <tbody>
          <tr v-if="!rows.length"><td class="td text-slate-500" colspan="6">No activity yet.</td></tr>
          <tr v-for="a in rows" :key="a.id">
            <td class="td whitespace-nowrap">{{ fmt(a.at) }}</td><td class="td">{{ a.userName }}</td><td class="td font-mono text-xs">{{ a.action }}</td>
            <td class="td">{{ a.object }} #{{ a.objectId }}</td><td class="td">{{ a.from || a.to ? `${a.from || '—'} → ${a.to || '—'}` : '' }}</td><td class="td">{{ a.note }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { call } from '@/api'
import { fmt } from '@/util'

const rows = ref([])
onMounted(async () => { rows.value = await call('activity/list') })
</script>
