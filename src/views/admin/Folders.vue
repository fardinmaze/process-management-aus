<template>
  <div class="p-6 max-w-2xl">
    <h1 class="text-xl font-bold mt-0 mb-1">Folders</h1>
    <p class="text-sm text-slate-500 mt-0 mb-4">Repository categories such as HR or Finance.</p>
    <form class="card mb-4 flex gap-3" @submit.prevent="add">
      <input v-model="name" class="input" placeholder="New folder name" required aria-label="Folder name">
      <button class="btn btn-primary">Add</button>
    </form>
    <div class="card p-0 overflow-hidden">
      <div v-for="f in folders" :key="f.id" class="flex items-center gap-3 px-4 py-2.5 border-b border-slate-100 last:border-0">
        <input v-if="editing === f.id" v-model="editName" class="input" aria-label="Folder name" @keyup.enter="save(f)">
        <span v-else class="flex-1 text-sm font-medium">{{ f.name }}</span>
        <template v-if="editing === f.id">
          <button class="btn btn-sm btn-primary" @click="save(f)">Save</button>
          <button class="btn btn-sm" @click="editing = null">Cancel</button>
        </template>
        <template v-else>
          <button class="btn btn-sm" @click="startEdit(f)">Rename</button>
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
const startEdit = (f) => { editing.value = f.id; editName.value = f.name }
const save = (f) => wrap(async () => { await call(`folder/edit/${f.id}`, { name: editName.value }); editing.value = null }, 'Folder renamed.')
const remove = (f) => wrap(() => call(`folder/delete/${f.id}`), 'Folder deleted.')
onMounted(load)
</script>
