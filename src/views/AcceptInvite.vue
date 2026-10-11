<template>
  <div class="min-h-full flex items-center justify-center p-6 bg-gradient-to-br from-brand-50 to-slate-100">
    <div class="card p-8 w-full max-w-md">
      <h1 class="text-xl font-bold text-brand-700 mt-0">Join Process Maps</h1>
      <p v-if="loading" class="text-sm text-slate-500">Checking your invitation…</p>
      <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
      <form v-else @submit.prevent="accept">
        <p class="text-sm text-slate-500 mt-0">
          You were invited as <strong>{{ info.role }}</strong> using <strong>{{ info.email }}</strong>
          <span v-if="info.mapTitle"> to work on <strong>{{ info.mapTitle }}</strong></span>.
        </p>
        <label class="label" for="n">Your name</label>
        <input id="n" v-model="name" class="input mb-3" required>
        <label class="label" for="p">Choose a password</label>
        <input id="p" v-model="password" class="input mb-4" type="password" minlength="4" required>
        <p v-if="formError" class="text-sm text-red-600 mt-0">{{ formError }}</p>
        <button class="btn btn-primary w-full" :disabled="busy">Create account</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { call } from '@/api'
import { loadSession, errMsg } from '@/session'

const route = useRoute()
const router = useRouter()
const info = ref({})
const loading = ref(true)
const error = ref('')
const formError = ref('')
const busy = ref(false)
const name = ref('')
const password = ref('')

onMounted(async () => {
  try { info.value = await call('invitation/lookup', { token: route.params.token }) } catch (e) { error.value = errMsg(e) }
  loading.value = false
})
async function accept() {
  busy.value = true
  formError.value = ''
  try {
    await call('invitation/accept', { token: route.params.token, name: name.value, password: password.value })
    await loadSession()
    router.push('/dashboard')
  } catch (e) { formError.value = errMsg(e) } finally { busy.value = false }
}
</script>
