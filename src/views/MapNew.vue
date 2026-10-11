<template>
  <div class="p-6 max-w-2xl">
    <h1 class="text-xl font-bold mt-0 mb-4">Initiate a process map</h1>
    <form class="card" @submit.prevent="create">
      <label class="label" for="t">Title</label>
      <input id="t" v-model="form.title" class="input mb-3" placeholder="e.g. New Employee Onboarding" required>
      <label class="label" for="d">Description</label>
      <textarea id="d" v-model="form.description" class="input mb-3" rows="3" />
      <label class="label" for="ob">Objective</label>
      <textarea id="ob" v-model="form.objective" class="input mb-3" rows="2" placeholder="Why this process exists" />
      <div class="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label class="label" for="f">Folder</label>
          <select id="f" v-model="form.folderId" class="input" required @change="applyFolder">
            <option value="" disabled>Choose…</option>
            <option v-for="f in folders" :key="f.id" :value="f.id">{{ f.name }}</option>
          </select>
        </div>
        <div>
          <label class="label" for="r">Review interval (days)</label>
          <input id="r" v-model.number="form.reviewIntervalDays" class="input" type="number" min="1">
        </div>
      </div>
      <label class="label" for="ex">Expert (optional)</label>
      <select id="ex" v-model="form.expertId" class="input mb-1">
        <option value="">None</option>
        <option v-for="u in people" :key="u.id" :value="u.id">{{ u.name }}</option>
      </select>
      <p class="text-xs text-slate-500 mt-0 mb-3">The person who looks after this map day to day. The Expert can mark it reviewed and resolve feedback. Editing rights still come from section allocation.</p>
      <label class="label" for="tg">Tags (comma separated)</label>
      <input id="tg" v-model="tags" class="input mb-4" placeholder="onboarding, hr">
      <p v-if="error" class="text-sm text-red-600 mt-0">{{ error }}</p>
      <div class="flex gap-2">
        <button class="btn btn-primary" :disabled="busy">Create map</button>
        <router-link to="/maps" class="btn no-underline">Cancel</router-link>
      </div>
    </form>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { call } from '@/api'
import { errMsg, toast } from '@/session'

const router = useRouter()
const folders = ref([])
const tags = ref('')
const error = ref('')
const busy = ref(false)
const people = ref([])
const form = reactive({ title: '', description: '', objective: '', folderId: '', expertId: '', reviewIntervalDays: 365 })
function applyFolder() { const f = folders.value.find((x) => x.id === form.folderId); if (f?.defaultExpertId && !form.expertId) form.expertId = f.defaultExpertId }

onMounted(async () => {
  folders.value = await call('folder/list')
  people.value = (await call('user/list')).filter((u) => u.roles.some((r) => ['ADMIN', 'OWNER', 'CONTRIBUTOR'].includes(r)))
})
async function create() {
  busy.value = true
  error.value = ''
  try {
    const m = await call('map/create', { ...form, expertId: form.expertId || null, visibility: 'INTERNAL', tags: tags.value.split(',').map((s) => s.trim()).filter(Boolean) })
    toast('Map created. Version 1 is in planning.')
    router.push(`/maps/${m.id}`)
  } catch (e) { error.value = errMsg(e) } finally { busy.value = false }
}
</script>
