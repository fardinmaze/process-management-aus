<template>
  <div class="min-h-full flex items-center justify-center p-6 bg-gradient-to-br from-brand-50 to-slate-100">
    <div class="w-full max-w-4xl grid md:grid-cols-2 gap-6">
      <form class="card p-8" @submit.prevent="submit">
        <h1 class="text-2xl font-bold text-brand-700 m-0">Process Maps</h1>
        <p class="text-sm text-slate-500 mt-1 mb-6">Sign in to continue.</p>
        <label class="label" for="email">Email</label>
        <input id="email" v-model="email" class="input mb-3" type="email" autocomplete="username" required>
        <label class="label" for="pw">Password</label>
        <input id="pw" v-model="password" class="input mb-4" type="password" autocomplete="current-password" required>
        <p v-if="error" class="text-sm text-red-600 mt-0">{{ error }}</p>
        <button class="btn btn-primary w-full" :disabled="busy">{{ busy ? 'Signing in…' : 'Sign in' }}</button>
      </form>

      <div class="card p-8">
        <h2 class="text-sm font-bold uppercase tracking-wide text-slate-500 mt-0">Demo accounts (password: demo)</h2>
        <button
          v-for="a in accounts"
          :key="a.email"
          type="button"
          class="w-full text-left flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 mb-2 bg-white cursor-pointer hover:border-brand-400"
          @click="quick(a.email)"
        >
          <span class="text-sm font-semibold">{{ a.name }}</span>
          <span class="chip bg-brand-50 text-brand-700">{{ a.role }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { login, errMsg } from '@/session'

const route = useRoute()
const router = useRouter()
const email = ref('')
const password = ref('demo')
const error = ref('')
const busy = ref(false)

const accounts = [
  { name: 'Avery Admin', role: 'ADMIN', email: 'admin@demo.test' },
  { name: 'Olivia Owner (HR)', role: 'OWNER', email: 'owner@demo.test' },
  { name: 'Hugo Hall (HR)', role: 'CONTRIBUTOR', email: 'hr.contrib@demo.test' },
  { name: 'Ivy Intel (IT)', role: 'CONTRIBUTOR', email: 'it.contrib@demo.test' },
  { name: 'Aaron Approver', role: 'APPROVER', email: 'approver@demo.test' },
  { name: 'Vera Viewer', role: 'VIEWER', email: 'viewer@demo.test' },
]
function quick(e) { email.value = e; password.value = 'demo'; submit() }
async function submit() {
  error.value = ''
  busy.value = true
  try {
    await login(email.value, password.value)
    router.push(route.query.redirect || '/dashboard')
  } catch (e) { error.value = errMsg(e) } finally { busy.value = false }
}
</script>
