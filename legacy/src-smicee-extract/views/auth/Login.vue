<template>
  <div class="min-h-screen flex">

    <!-- Left panel — branding / feature list -->
    <div
      class="relative hidden min-[900px]:flex w-[45%] items-center justify-center p-12 overflow-hidden flex-shrink-0"
      style="background: linear-gradient(145deg, #234620 0%, #1B3419 60%, #122310 100%)"
    >
      <div class="relative z-10 max-w-[380px]">
        <div class="w-14 h-14 bg-white/20 rounded-[14px] inline-flex items-center justify-center text-white text-[26px] mb-6 backdrop-blur-sm border border-white/25">
          <i class="ri-shield-check-fill" />
        </div>
        <h2 class="text-[2rem] font-extrabold text-white m-0 mb-3 leading-tight">Process Management</h2>
        <p class="text-base text-white/75 m-0 mb-10 leading-relaxed">
          A complete role-based access control system built for teams of any size.
        </p>

        <ul class="list-none p-0 m-0 flex flex-col gap-6">
          <li v-for="f in features" :key="f.text" class="flex items-start gap-3.5">
            <div class="w-[38px] h-[38px] bg-white/15 rounded-[10px] flex items-center justify-center text-white text-lg flex-shrink-0 backdrop-blur-sm">
              <i :class="f.icon" />
            </div>
            <div>
              <p class="text-sm font-bold text-white m-0 mb-0.5">{{ f.title }}</p>
              <p class="text-[0.8rem] text-white/65 m-0">{{ f.text }}</p>
            </div>
          </li>
        </ul>
      </div>

      <!-- Decorative circles -->
      <div class="absolute w-[400px] h-[400px] -bottom-[100px] -right-[100px] rounded-full bg-white/[0.06] pointer-events-none" />
      <div class="absolute w-[250px] h-[250px] -top-[60px] -left-[60px] rounded-full bg-white/[0.06] pointer-events-none" />
    </div>

    <!-- Right panel — form -->
    <div class="right-panel flex-1 flex items-center justify-center py-10 px-6 overflow-y-auto">
      <div class="auth-card bg-white rounded-2xl p-10 w-full max-w-[440px] shadow-[0_4px_24px_rgba(0,0,0,0.07)] border border-slate-200">
        <div class="mb-7">
          <h1 class="text-[1.6rem] font-extrabold text-slate-800 m-0 mb-1.5">Welcome back</h1>
          <p class="text-sm text-slate-500 m-0">Sign in to your account to continue</p>
        </div>

        <!-- Server-level error -->
        <transition name="alert-slide">
          <div v-if="authError" class="flex items-center gap-2.5 px-3.5 py-3 rounded-[10px] text-sm mb-5 bg-red-50 text-red-600 border border-red-200">
            <i class="ri-error-warning-line" />
            <span>{{ authError }}</span>
          </div>
        </transition>

        <form @submit.prevent="submit" novalidate class="flex flex-col gap-[18px]">

          <!-- Email -->
          <div class="flex flex-col gap-[7px]">
            <label class="text-[0.8rem] font-semibold text-gray-700" for="email">Email address</label>
            <div class="input-wrap relative flex items-center"
                 :class="errors.email ? 'input-wrap--error' : valid.email ? 'input-wrap--valid' : ''">
              <i class="ri-mail-line absolute left-[13px] text-gray-400 text-base pointer-events-none z-10" />
              <input
                id="email"
                v-model.trim="form.email"
                type="email"
                class="form-input w-full h-[46px] pl-10 pr-[42px] border-[1.5px] border-gray-200 rounded-[9px] text-[0.9rem] text-slate-800 bg-gray-50 outline-none box-border"
                placeholder="you@example.com"
                autocomplete="email"
                autofocus
                @blur="validateEmail"
              />
              <i v-if="valid.email" class="ri-checkbox-circle-fill absolute right-[13px] text-emerald-500 text-[17px]" />
            </div>
            <transition name="err-slide">
              <span v-if="errors.email" class="flex items-center gap-1 text-[0.75rem] text-red-500 font-medium">
                <i class="ri-error-warning-line" /> {{ errors.email }}
              </span>
            </transition>
          </div>

          <!-- Password -->
          <div class="flex flex-col gap-[7px]">
            <div class="flex justify-between items-center">
              <label class="text-[0.8rem] font-semibold text-gray-700" for="password">Password</label>
              <button type="button" class="bg-transparent border-none text-[0.78rem] text-brand-600 cursor-pointer p-0 font-medium hover:underline" @click="forgotPassword">
                Forgot password?
              </button>
            </div>
            <div class="input-wrap relative flex items-center"
                 :class="errors.password ? 'input-wrap--error' : ''">
              <i class="ri-lock-line absolute left-[13px] text-gray-400 text-base pointer-events-none z-10" />
              <input
                id="password"
                v-model="form.password"
                :type="showPwd ? 'text' : 'password'"
                class="form-input w-full h-[46px] pl-10 pr-[42px] border-[1.5px] border-gray-200 rounded-[9px] text-[0.9rem] text-slate-800 bg-gray-50 outline-none box-border"
                placeholder="••••••••"
                autocomplete="current-password"
                @blur="validatePassword"
              />
              <button
                type="button"
                class="absolute right-[10px] bg-transparent border-none text-gray-400 cursor-pointer text-[17px] p-0 flex leading-none hover:text-brand-600"
                :aria-label="showPwd ? 'Hide password' : 'Show password'"
                @click="showPwd = !showPwd"
              >
                <i :class="showPwd ? 'ri-eye-off-line' : 'ri-eye-line'" />
              </button>
            </div>
            <transition name="err-slide">
              <span v-if="errors.password" class="flex items-center gap-1 text-[0.75rem] text-red-500 font-medium">
                <i class="ri-error-warning-line" /> {{ errors.password }}
              </span>
            </transition>
          </div>

          <!-- Remember me -->
          <div>
            <label class="checkbox-label flex items-center gap-2.5 text-sm text-slate-500 cursor-pointer select-none">
              <input v-model="form.remember" type="checkbox" class="checkbox hidden" />
              <span class="checkbox-custom w-[18px] h-[18px] border-2 border-gray-300 rounded-[5px] flex-shrink-0 relative" />
              <span>Remember me for 30 days</span>
            </label>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            class="h-12 text-white border-none rounded-[10px] text-[0.95rem] font-bold cursor-pointer flex items-center justify-center gap-2 mt-1 shadow-[0_4px_14px_rgba(45,90,39,0.4)] hover:opacity-[0.93] hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(45,90,39,0.5)] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none transition-all"
            style="background: linear-gradient(135deg, #2D5A27 0%, #1B3419 100%)"
            :disabled="loading"
          >
            <span v-if="loading" class="flex items-center gap-2">
              <i class="ri-loader-4-line spinning" /> Signing in…
            </span>
            <span v-else>Sign In <i class="ri-arrow-right-line" /></span>
          </button>

        </form>

      </div>
    </div>

  </div>
</template>

<script>
import { ref, computed, inject } from 'vue'
import { useStore }              from 'vuex'
import { useRouter, useRoute }   from 'vue-router'
import { parseValidationErrors } from '@/utils/helpers'

export default {
  name: 'LoginView',

  setup() {
    const store  = useStore()
    const router = useRouter()
    const route  = useRoute()
    const toast  = inject('toast')

    const form        = ref({ email: '', password: '', remember: false })
    const errors      = ref({ email: '', password: '' })
    const valid       = ref({ email: false })
    const showPwd     = ref(false)

    const loading   = computed(() => store.getters['auth/loading'])
    const authError = computed(() => store.getters['auth/error'])

    const features = [
      { icon: 'ri-shield-user-line',  title: 'Role-Based Access',    text: 'Fine-grained permissions per role'     },
      { icon: 'ri-user-3-line',       title: 'User Management',      text: 'Full CRUD with status & designation'   },
      { icon: 'ri-lock-2-line',       title: 'Secure Auth',          text: 'JWT with auto-refresh token rotation'  },
      { icon: 'ri-bar-chart-line',    title: 'Activity Dashboard',   text: 'Real-time stats and activity feed'     },
    ]

    function validateEmail() {
      const v = form.value.email
      if (!v) {
        errors.value.email = 'Email is required.'
        valid.value.email  = false
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
        errors.value.email = 'Enter a valid email address.'
        valid.value.email  = false
      } else {
        errors.value.email = ''
        valid.value.email  = true
      }
    }

    function validatePassword() {
      if (!form.value.password) {
        errors.value.password = 'Password is required.'
      } else {
        errors.value.password = ''
      }
    }

    function validateAll() {
      validateEmail()
      validatePassword()
      return !errors.value.email && !errors.value.password
    }

    async function submit() {
      store.dispatch('auth/clearError')
      if (!validateAll()) return

      try {
        await store.dispatch('auth/login', form.value)
        toast?.success('Signed in successfully. Welcome back!')
        router.push(route.query.redirect || '/dashboard')
      } catch (err) {
        const fieldErrors = parseValidationErrors(err)
        if (Object.keys(fieldErrors).length) {
          errors.value = { ...errors.value, ...fieldErrors }
        }
      }
    }

    function forgotPassword() {
      router.push({ name: 'ForgotPassword' })
    }

    return {
      form, errors, valid, showPwd, loading, authError,
      features, validateEmail, validatePassword, submit, forgotPassword,
    }
  },
}
</script>

<style scoped>
/* .form-input's own `px-3` (crud.css) loads after Tailwind's utility layer,
   so at equal specificity it silently wins over the pl-10/pr-[42px] set
   inline here — collapsing the icon gutters and running the icon into the
   placeholder text. Re-assert the gutters with a selector specific enough
   to beat it regardless of stylesheet order. */
.input-wrap .form-input { padding-left: 40px; padding-right: 42px; }

.auth-card { animation: card-in 0.35s ease; }
@keyframes card-in {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

.right-panel { background: #f8fafc; }
@media (max-width: 900px) {
  .right-panel { background: linear-gradient(145deg, #234620, #1B3419); }
  .auth-card   { box-shadow: 0 8px 40px rgba(0,0,0,.2); }
}
@media (max-width: 480px) {
  .auth-card { padding: 28px 20px; }
}

</style>
