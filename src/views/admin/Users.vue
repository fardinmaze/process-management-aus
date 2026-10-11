<template>
  <div class="p-6 max-w-5xl">
    <h1 class="text-xl font-bold mt-0 mb-1">Users & roles</h1>
    <p class="text-sm text-slate-500 mt-0 mb-4">A user can hold several roles. Admin, Owner, Contributor and Approver are paid seats; Viewer is free.</p>
    <div class="card p-0 overflow-hidden">
      <table class="w-full border-collapse">
        <thead><tr><th class="th">Name</th><th class="th">Email</th><th class="th">Roles</th><th class="th">Seat</th></tr></thead>
        <tbody>
          <tr v-for="u in users" :key="u.id">
            <td class="td font-semibold">{{ u.name }}</td>
            <td class="td">{{ u.email }}</td>
            <td class="td">
              <label v-for="r in ROLES" :key="r" class="inline-flex items-center gap-1 mr-3 text-xs">
                <input type="checkbox" :checked="u.roles.includes(r)" @change="toggle(u, r, $event.target.checked)"> {{ r }}
              </label>
            </td>
            <td class="td">{{ u.roles.some((r) => r !== 'VIEWER') ? 'Paid' : 'Free' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { call } from '@/api'
import { toast, errMsg } from '@/session'

const ROLES = ['ADMIN', 'OWNER', 'CONTRIBUTOR', 'APPROVER', 'VIEWER']
const users = ref([])
const load = async () => { users.value = await call('user/list') }
async function toggle(u, role, on) {
  const roles = on ? [...new Set([...u.roles, role])] : u.roles.filter((r) => r !== role)
  try { await call(`user/set-roles/${u.id}`, { roles }); toast('Roles updated.') } catch (e) { toast(errMsg(e), 'error') }
  await load()
}
onMounted(load)
</script>
