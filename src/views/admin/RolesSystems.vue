<template>
  <div class="p-4 sm:p-6 max-w-4xl">
    <h1 class="text-xl font-bold mt-0 mb-1 flex items-center gap-2"><Icon name="user" :size="22" />Roles & systems</h1>
    <p class="text-sm text-slate-500 mt-0 mb-4">Roles become the swimlanes on every process map. Systems are tagged on activities done in software. Deactivate instead of deleting once a role or system is in use.</p>
    <div class="grid md:grid-cols-2 gap-4">
      <section v-for="g in groups" :key="g.kind">
        <h2 class="text-sm font-semibold mt-0 mb-2">{{ g.title }}</h2>
        <form class="card mb-3 flex gap-2" @submit.prevent="add(g)">
          <input v-model="g.name" class="input" :placeholder="`New ${g.kind} name`" required :aria-label="`New ${g.kind} name`">
          <button class="btn btn-primary">Add</button>
        </form>
        <div class="card p-0 overflow-hidden">
          <p v-if="!g.rows.length" class="p-4 text-sm text-slate-500 m-0">None yet.</p>
          <div v-for="x in g.rows" :key="x.id" class="flex items-center gap-2 px-4 py-2 border-b border-slate-100 last:border-0">
            <span class="flex-1 text-sm" :class="x.isActive ? '' : 'text-slate-500 line-through'">{{ x.name }}</span>
            <button class="btn btn-sm" @click="toggle(g, x)">{{ x.isActive ? 'Deactivate' : 'Activate' }}</button>
            <button class="btn btn-sm btn-danger" @click="remove(g, x)">Delete</button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive } from 'vue'
import { call } from '@/api'
import { toast, errMsg } from '@/session'

const groups = reactive([
  { kind: 'role', title: 'Roles (lanes)', name: '', rows: [] },
  { kind: 'system', title: 'Systems', name: '', rows: [] },
])
const load = async () => { for (const g of groups) g.rows = await call(`${g.kind}/list`) }
async function wrap(fn, ok) { try { await fn(); if (ok) toast(ok); await load() } catch (e) { toast(errMsg(e), 'error') } }
const add = (g) => wrap(async () => { await call(`${g.kind}/create`, { name: g.name }); g.name = '' }, 'Added.')
const toggle = (g, x) => wrap(() => call(`${g.kind}/edit/${x.id}`, { isActive: !x.isActive }))
const remove = (g, x) => wrap(() => call(`${g.kind}/delete/${x.id}`), 'Deleted.')
onMounted(load)
</script>
