<template>
  <div class="p-6 max-w-5xl">
    <h1 class="text-xl font-bold mt-0 mb-4">Invitations</h1>
    <form class="card mb-4 flex flex-wrap items-end gap-3" @submit.prevent="send">
      <div class="flex-1 min-w-[220px]"><label class="label" for="e">Email</label><input id="e" v-model="email" type="email" class="input" required></div>
      <div>
        <label class="label" for="r">Role</label>
        <select id="r" v-model="role" class="input"><option v-for="r in roles" :key="r" :value="r">{{ r }}</option></select>
      </div>
      <button class="btn btn-primary" :disabled="busy">Send invitation</button>
    </form>
    <div v-if="link" class="card mb-4 text-xs break-all">Demo email (no mail server). Invitation link: <a :href="link">{{ link }}</a></div>
    <div class="card p-0 overflow-hidden">
      <table class="w-full border-collapse">
        <thead><tr><th class="th">Email</th><th class="th">Role</th><th class="th">Status</th><th class="th">Expires</th><th class="th" /></tr></thead>
        <tbody>
          <tr v-if="!rows.length"><td class="td text-slate-400" colspan="5">No invitations yet.</td></tr>
          <tr v-for="i in rows" :key="i.id">
            <td class="td">{{ i.email }}</td><td class="td">{{ i.role }}</td><td class="td"><StatusChip :status="i.status" /></td><td class="td">{{ fmtDate(i.expiresAt) }}</td>
            <td class="td text-right">
              <button v-if="['PENDING', 'EXPIRED'].includes(i.status)" class="btn btn-sm mr-1" @click="act('resend', i)">Resend</button>
              <button v-if="i.status === 'PENDING'" class="btn btn-sm btn-danger" @click="act('revoke', i)">Revoke</button>
              <a v-if="i.status === 'PENDING'" class="text-xs ml-2" :href="`/invite/accept/${i.token}`">Open link</a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { call } from '@/api'
import { hasRole, toast, errMsg } from '@/session'
import { fmtDate } from '@/util'
import StatusChip from '@/components/StatusChip.vue'

const rows = ref([])
const email = ref('')
const role = ref('CONTRIBUTOR')
const link = ref('')
const busy = ref(false)
const roles = computed(() => (hasRole('ADMIN') ? ['ADMIN', 'OWNER', 'CONTRIBUTOR', 'APPROVER', 'VIEWER'] : ['CONTRIBUTOR', 'VIEWER']))
const load = async () => { rows.value = await call('invitation/list') }

async function send() {
  busy.value = true
  try {
    const i = await call('invitation/create', { email: email.value, role: role.value })
    link.value = `${location.origin}/invite/accept/${i.token}`
    email.value = ''
    toast('Invitation created.')
    await load()
  } catch (e) { toast(errMsg(e), 'error') } finally { busy.value = false }
}
async function act(what, i) {
  try {
    const r = await call(`invitation/${what}/${i.id}`)
    if (what === 'resend') link.value = `${location.origin}/invite/accept/${r.token}`
    await load()
  } catch (e) { toast(errMsg(e), 'error') }
}
onMounted(load)
</script>
