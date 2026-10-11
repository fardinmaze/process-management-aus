<template>
  <div class="p-6 max-w-2xl">
    <h1 class="text-xl font-bold mt-0 mb-1">Folders</h1>
    <p class="text-sm text-slate-500 mt-0 mb-4">Repository categories such as HR or Finance. A folder can set a default Expert that new maps inherit.</p>
    <form class="card mb-4 flex gap-3" @submit.prevent="add">
      <input v-model="name" class="input" placeholder="New folder name" required aria-label="Folder name">
      <button class="btn btn-primary">Add</button>
    </form>
    <div class="card p-0 overflow-hidden">
      <div v-for="f in folders" :key="f.id" class="flex items-center gap-3 px-4 py-2.5 border-b border-slate-100 last:border-0">
        <template v-if="editing === f.id">
          <input v-model="editName" class="input" aria-label="Folder name" @keyup.enter="save(f)">
          <select v-model="editExpert" class="input w-44" aria-label="Default Expert"><option :value="null">No default Expert</option><option v-for="u in people" :key="u.id" :value="u.id">{{ u.name }}</option></select>
        </template>
        <span v-else class="flex-1 text-sm font-medium">{{ f.name }}<span v-if="f.defaultExpertId" class="text-xs text-slate-500 font-normal"> · default Expert {{ personName(f.defaultExpertId) }}</span></span>
        <template v-if="editing === f.id">
          <button class="btn btn-sm btn-primary" @click="save(f)">Save</button>
          <button class="btn btn-sm" @click="editing = null">Cancel</button>
        </template>
        <template v-else>
          <button class="btn btn-sm" @click="startEdit(f)">Edit</button>
          <button class="btn btn-sm btn-danger" @click="remove(f)">Delete</button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { call } from '@/api'
import { toast, errMsg } from '@/session'

const folders = ref([])
const name = ref('')
const editing = ref(null)
const editName = ref('')
const load = async () => { folders.value = await call('folder/list') }
async function wrap(fn, ok) {
  try { await fn(); if (ok) toast(ok); await load() } catch (e) { toast(errMsg(e), 'error') }
}
const add = () => wrap(async () => { await call('folder/create', { name: name.value }); name.value = '' }, 'Folder added.')
const people = ref([])
const editExpert = ref(null)
const personName = (id) => people.value.find((u) => u.id === id)?.name || ''
const startEdit = (f) => { editing.value = f.id; editName.value = f.name; editExpert.value = f.defaultExpertId ?? null }
const save = (f) => wrap(async () => { await call(`folder/edit/${f.id}`, { name: editName.value, defaultExpertId: editExpert.value }); editing.value = null }, 'Folder saved.')
const remove = (f) => wrap(() => call(`folder/delete/${f.id}`), 'Folder deleted.')
onMounted(async () => { people.value = (await call('user/list')).filter((u) => u.roles.some((r) => ['ADMIN', 'OWNER', 'CONTRIBUTOR'].includes(r))); await load() })
</script>
