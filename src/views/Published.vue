<template>
  <div class="p-4 sm:p-6 max-w-5xl">
    <h1 class="text-xl font-bold mt-0 mb-1 flex items-center gap-2"><Icon name="book" :size="22" />Published maps</h1>
    <p class="text-sm text-slate-500 mt-0 mb-4">Approved process maps, read-only. Search covers titles, descriptions, tags, step labels, roles and systems.</p>
    <form class="flex gap-2 mb-4" @submit.prevent="search">
      <input v-model="q" class="input max-w-md" placeholder="Search maps, steps, roles, systems…" aria-label="Search published maps">
      <button class="btn btn-primary"><Icon name="search" :size="15" />Search</button>
      <button v-if="searched" type="button" class="btn" @click="clear">Clear</button>
    </form>
    <p v-if="loading" class="text-slate-500">Loading…</p>
    <p v-else-if="!rows.length" class="text-sm text-slate-500">{{ searched ? 'No published maps match your search.' : 'No maps have been published yet.' }}</p>
    <router-link v-for="m in rows" :key="m.id" :to="`/published/${m.id}`" class="card mb-3 block no-underline text-inherit hover:border-brand-400">
      <div class="flex items-center justify-between">
        <div class="font-semibold">{{ m.title }} <span class="text-slate-500 font-normal text-xs">v{{ m.versionNo }}</span></div>
        <span class="text-xs text-slate-500">{{ m.code }} · {{ m.folderName }}</span>
      </div>
      <div v-if="m.description" class="text-sm text-slate-500 mt-1">{{ m.description }}</div>
      <div class="text-xs text-slate-500 mt-1">Published {{ fmtDate(m.publishedAt) }} · {{ m.viewsCount }} views</div>
    </router-link>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { call } from '@/api'
import { fmtDate } from '@/util'

const rows = ref([])
const q = ref('')
const loading = ref(true)
const searched = ref(false)

async function load() { rows.value = await call('published/map/list'); loading.value = false }
async function search() {
  if (!q.value.trim()) return clear()
  searched.value = true
  rows.value = await call('published/search', { q: q.value })
}
async function clear() { q.value = ''; searched.value = false; await load() }
onMounted(load)
</script>
