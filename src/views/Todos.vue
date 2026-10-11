<template>
  <div class="p-6 max-w-4xl">
    <h1 class="text-xl font-bold mt-0 mb-4">To-do list</h1>
    <p v-if="loading" class="text-slate-400">Loading…</p>
    <template v-else>
      <h2 class="text-sm font-semibold mt-0 mb-2">Assigned to me</h2>
      <p v-if="!mine.length" class="text-sm text-slate-500">Nothing assigned to you.</p>
      <div v-for="t in mine" :key="t.id" class="card mb-2 flex items-center gap-3">
        <input type="checkbox" :checked="t.done" :aria-label="`Mark ${t.title} done`" @change="toggle(t)">
        <div class="min-w-0 flex-1">
          <div :class="t.done ? 'line-through text-slate-400' : 'font-semibold'">{{ t.title }}</div>
          <div class="text-xs text-slate-500">{{ t.mapCode }} · {{ t.mapTitle }} · from {{ t.createdByName }}<span v-if="t.dueDate" :class="!t.done && t.dueDate < today ? 'text-red-600' : ''"> · due {{ fmtDate(t.dueDate) }}</span></div>
          <div v-if="t.note" class="text-xs text-slate-500">{{ t.note }}</div>
        </div>
        <router-link :to="`/maps/${t.mapId}`" class="btn btn-sm no-underline">Open map</router-link>
      </div>

      <template v-if="assignedByMe.length">
        <h2 class="text-sm font-semibold mt-6 mb-2">Assigned by me</h2>
        <div v-for="t in assignedByMe" :key="t.id" class="card mb-2 flex items-center gap-3">
          <span class="chip" :class="t.done ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'">{{ t.done ? 'Done' : 'Open' }}</span>
          <div class="min-w-0 flex-1">
            <div class="font-semibold">{{ t.title }}</div>
            <div class="text-xs text-slate-500">{{ t.mapCode }} · {{ t.mapTitle }} · to {{ t.assigneeName }}<span v-if="t.dueDate"> · due {{ fmtDate(t.dueDate) }}</span></div>
          </div>
          <router-link :to="`/maps/${t.mapId}`" class="btn btn-sm no-underline">Open map</router-link>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { call } from '@/api'
import { session, toast, errMsg } from '@/session'
import { fmtDate } from '@/util'

const rows = ref([])
const loading = ref(true)
const today = new Date().toISOString().slice(0, 10)
const mine = computed(() => rows.value.filter((t) => t.assigneeId === session.user.id))
const assignedByMe = computed(() => rows.value.filter((t) => t.createdBy === session.user.id && t.assigneeId !== session.user.id))
const load = async () => { rows.value = await call('todo/my'); loading.value = false }
async function toggle(t) { try { await call(`todo/toggle/${t.id}`); await load() } catch (e) { toast(errMsg(e), 'error') } }
onMounted(load)
</script>
