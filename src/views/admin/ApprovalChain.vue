<template>
  <div class="p-6 max-w-3xl">
    <h1 class="text-xl font-bold mt-0 mb-1">Approval chain: PROCESS_MAP</h1>
    <p class="text-sm text-slate-500 mt-0 mb-4">
      Gate 2. Each stage resolves by its rule (any one approver, or all). The person who submitted a version can never approve it.
      Changes apply to future submissions only; in-flight reviews keep the chain they started with.
    </p>
    <p v-if="!chain" class="text-slate-400">Loading…</p>
    <template v-else>
      <label class="flex items-center gap-2 mb-4 text-sm"><input v-model="chain.enabled" type="checkbox"> Approval chain enabled (when off, submitting publishes directly)</label>
      <div v-for="(s, i) in chain.stages" :key="i" class="card mb-3">
        <div class="flex gap-3 mb-3">
          <div class="flex-1"><label class="label" :for="`n${i}`">Stage {{ i + 1 }} name</label><input :id="`n${i}`" v-model="s.name" class="input"></div>
          <div><label class="label" :for="`r${i}`">Rule</label>
            <select :id="`r${i}`" v-model="s.rule" class="input"><option value="ANY_ONE">Any one approver</option><option value="ALL">All approvers</option></select>
          </div>
          <button class="btn btn-sm btn-danger self-end" @click="chain.stages.splice(i, 1)">Remove</button>
        </div>
        <div class="label">Approvers</div>
        <label v-for="u in approvers" :key="u.id" class="inline-flex items-center gap-1 mr-4 text-sm">
          <input v-model="s.approvers" type="checkbox" :value="u.id"> {{ u.name }}
        </label>
        <p v-if="!approvers.length" class="text-xs text-slate-400">No users hold the APPROVER role yet.</p>
      </div>
      <div class="flex gap-2">
        <button class="btn" @click="chain.stages.push({ name: '', rule: 'ANY_ONE', approvers: [] })">Add stage</button>
        <button class="btn btn-primary" :disabled="busy" @click="save">Save chain</button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { call } from '@/api'
import { toast, errMsg } from '@/session'

const chain = ref(null)
const users = ref([])
const busy = ref(false)
const approvers = computed(() => users.value.filter((u) => u.roles.includes('APPROVER')))
onMounted(async () => {
  [chain.value, users.value] = await Promise.all([call('approval-chain/preset-list/PROCESS_MAP'), call('user/list')])
})
async function save() {
  busy.value = true
  try { chain.value = await call('approval-chain/save/PROCESS_MAP', chain.value); toast('Approval chain saved.') } catch (e) { toast(errMsg(e), 'error') } finally { busy.value = false }
}
</script>
