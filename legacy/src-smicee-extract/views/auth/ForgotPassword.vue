<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 py-10 px-6">
    <div class="auth-card bg-white rounded-2xl p-10 w-full max-w-[440px] shadow-[0_4px_24px_rgba(0,0,0,0.07)] border border-slate-200">
      <div class="w-14 h-14 rounded-[14px] inline-flex items-center justify-center text-white text-[26px] mb-6"
           style="background: linear-gradient(135deg, #2D5A27 0%, #1B3419 100%)">
        <i class="ri-key-2-line" />
      </div>
      <h1 class="text-[1.6rem] font-extrabold text-slate-800 m-0 mb-1.5">Forgot your password?</h1>
      <p class="text-sm text-slate-500 m-0 mb-7">Enter your account email and we'll send you a one-time code to reset it.</p>

      <transition name="alert-slide">
        <div v-if="error" class="flex items-center gap-2.5 px-3.5 py-3 rounded-[10px] text-sm mb-5 bg-red-50 text-red-600 border border-red-200">
          <i class="ri-error-warning-line" />
          <span>{{ error }}</span>
        </div>
      </transition>

      <form @submit.prevent="submit" novalidate class="flex flex-col gap-[18px]">
        <div class="flex flex-col gap-[7px]">
          <label class="text-[0.8rem] font-semibold text-gray-700" for="email">Email address</label>
          <div class="relative flex items-center">
            <i class="ri-mail-line absolute left-[13px] text-gray-400 text-base pointer-events-none" />
            <input
              id="email"
              v-model.trim="email"
              type="email"
              class="w-full h-[46px] pl-10 pr-3 border-[1.5px] border-gray-200 rounded-[9px] text-[0.9rem] text-slate-800 bg-gray-50 outline-none box-border"
              placeholder="you@example.com"
              autocomplete="email"
              autofocus
            />
          </div>
        </div>

        <button
          type="submit"
          class="h-12 text-white border-none rounded-[10px] text-[0.95rem] font-bold cursor-pointer flex items-center justify-center gap-2 mt-1 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          style="background: linear-gradient(135deg, #2D5A27 0%, #1B3419 100%)"
          :disabled="loading || !email"
        >
          <span v-if="loading" class="flex items-center gap-2"><i class="ri-loader-4-line spinning" /> Sending code…</span>
          <span v-else>Send Reset Code <i class="ri-arrow-right-line" /></span>
        </button>
      </form>

      <p class="text-center text-sm text-slate-500 mt-6 mb-0">
        Remembered your password?
        <router-link class="text-brand-600 no-underline font-semibold hover:underline" :to="{ name: 'Login' }">Back to sign in</router-link>
      </p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ForgotPasswordView',
  inject: ['toast'],

  data() {
    return {
      email:   '',
      loading: false,
      error:   '',
    }
  },

  methods: {
    async submit() {
      this.error = ''
      this.loading = true
      try {
        const data = await this.$store.dispatch('resetPassword/emailCheck', this.email)
        this.toast?.success('A reset code has been sent to your email.')
        // The backend returns the internal user id needed by the OTP-verify
        // step — carry both the email (for display) and that id forward.
        const userId = data?.user ?? data?.id ?? data?.data?.user ?? data?.data?.id
        // The backend currently returns the OTP directly in this response
        // (email delivery isn't wired up yet) — carry it forward so
        // ResetPassword can show it to the user for now.
        const otp = data?.otp ?? data?.data?.otp
        this.$router.push({ name: 'ResetPassword', query: { email: this.email, user: userId, otp } })
      } catch (err) {
        this.error = err.response?.data?.message || 'We could not find an account with that email.'
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style scoped>
.auth-card { animation: card-in 0.35s ease; }
@keyframes card-in {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
.alert-slide-enter-active, .alert-slide-leave-active { transition: all .25s ease; }
.alert-slide-enter-from, .alert-slide-leave-to       { opacity: 0; transform: translateY(-8px); }
</style>
