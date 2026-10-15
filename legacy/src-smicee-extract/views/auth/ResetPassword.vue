<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 py-10 px-6">
    <div class="auth-card bg-white rounded-2xl p-10 w-full max-w-[440px] shadow-[0_4px_24px_rgba(0,0,0,0.07)] border border-slate-200">
      <div class="w-14 h-14 rounded-[14px] inline-flex items-center justify-center text-white text-[26px] mb-6"
           style="background: linear-gradient(135deg, #2D5A27 0%, #1B3419 100%)">
        <i class="ri-shield-keyhole-line" />
      </div>
      <h1 class="text-[1.6rem] font-extrabold text-slate-800 m-0 mb-1.5">Reset your password</h1>
      <p class="text-sm text-slate-500 m-0 mb-7">
        Enter the code sent to <strong>{{ email || 'your email' }}</strong> and choose a new password.
      </p>

      <transition name="alert-slide">
        <div v-if="error" class="flex items-center gap-2.5 px-3.5 py-3 rounded-[10px] text-sm mb-5 bg-red-50 text-red-600 border border-red-200">
          <i class="ri-error-warning-line" />
          <span>{{ error }}</span>
        </div>
      </transition>

      <div v-if="devOtp" class="flex items-center gap-2.5 px-3.5 py-3 rounded-[10px] text-sm mb-5 bg-amber-50 text-amber-700 border border-amber-200">
        <i class="ri-information-line" />
        <span>Dev only — your OTP is <strong>{{ devOtp }}</strong></span>
      </div>

      <form @submit.prevent="submit" novalidate class="flex flex-col gap-[18px]">
        <div v-if="!queryEmail" class="flex flex-col gap-[7px]">
          <label class="text-[0.8rem] font-semibold text-gray-700" for="email">Email address</label>
          <input
            id="email"
            v-model.trim="email"
            type="email"
            class="w-full h-[46px] px-3 border-[1.5px] border-gray-200 rounded-[9px] text-[0.9rem] text-slate-800 bg-gray-50 outline-none box-border"
            placeholder="you@example.com"
          />
        </div>

        <div class="flex flex-col gap-[7px]">
          <label class="text-[0.8rem] font-semibold text-gray-700">One-time code</label>
          <div class="flex items-center justify-between gap-2">
            <input
              v-for="(digit, i) in otpDigits"
              :key="i"
              :ref="el => otpInputs[i] = el"
              v-model="otpDigits[i]"
              type="text"
              inputmode="numeric"
              maxlength="1"
              autocomplete="one-time-code"
              :autofocus="i === 0"
              :disabled="otpVerifying"
              class="w-full h-[52px] border-[1.5px] rounded-[9px] text-[1.1rem] text-slate-800 bg-gray-50 outline-none box-border text-center font-semibold focus:border-brand-500 disabled:opacity-60"
              :class="otpVerified ? 'border-green-400' : otpError ? 'border-red-400' : 'border-gray-200'"
              @input="onOtpInput(i, $event)"
              @keydown="onOtpKeydown(i, $event)"
              @paste="onOtpPaste($event)"
            />
          </div>
          <span v-if="otpVerifying" class="text-[0.75rem] text-gray-500 font-medium">Verifying code…</span>
          <span v-else-if="otpVerified" class="text-[0.75rem] text-green-600 font-medium flex items-center gap-1">
            <i class="ri-checkbox-circle-line" /> Code verified.
          </span>
          <span v-else-if="otpError" class="text-[0.75rem] text-red-500 font-medium">{{ otpError }}</span>
        </div>

        <div class="flex flex-col gap-[7px]">
          <label class="text-[0.8rem] font-semibold text-gray-700" for="password">New password</label>
          <div class="relative flex items-center">
            <input
              id="password"
              v-model="password"
              :type="showPwd ? 'text' : 'password'"
              class="w-full h-[46px] px-3 pr-[42px] border-[1.5px] border-gray-200 rounded-[9px] text-[0.9rem] text-slate-800 bg-gray-50 outline-none box-border"
              placeholder="Min. 8 characters"
              autocomplete="new-password"
            />
            <button type="button" class="absolute right-[10px] bg-transparent border-none text-gray-400 cursor-pointer text-[17px] p-0 flex leading-none hover:text-brand-600" @click="showPwd = !showPwd">
              <i :class="showPwd ? 'ri-eye-off-line' : 'ri-eye-line'" />
            </button>
          </div>
        </div>

        <div class="flex flex-col gap-[7px]">
          <label class="text-[0.8rem] font-semibold text-gray-700" for="confirm">Confirm new password</label>
          <input
            id="confirm"
            v-model="passwordConfirmation"
            type="password"
            class="w-full h-[46px] px-3 border-[1.5px] border-gray-200 rounded-[9px] text-[0.9rem] text-slate-800 bg-gray-50 outline-none box-border"
            placeholder="Repeat new password"
            autocomplete="new-password"
          />
          <span v-if="passwordConfirmation && passwordConfirmation !== password" class="text-[0.75rem] text-red-500 font-medium">
            Passwords do not match.
          </span>
        </div>

        <button
          type="submit"
          class="h-12 text-white border-none rounded-[10px] text-[0.95rem] font-bold cursor-pointer flex items-center justify-center gap-2 mt-1 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          style="background: linear-gradient(135deg, #2D5A27 0%, #1B3419 100%)"
          :disabled="loading || !canSubmit"
        >
          <span v-if="loading" class="flex items-center gap-2"><i class="ri-loader-4-line spinning" /> Resetting…</span>
          <span v-else>Reset Password <i class="ri-arrow-right-line" /></span>
        </button>
      </form>

      <p class="text-center text-sm text-slate-500 mt-6 mb-0">
        <router-link class="text-brand-600 no-underline font-semibold hover:underline" :to="{ name: 'Login' }">Back to sign in</router-link>
      </p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ResetPasswordView',
  inject: ['toast'],

  data() {
    return {
      queryEmail: this.$route.query.email || '',
      email: this.$route.query.email || '',
      userId: this.$route.query.user || '',
      devOtp: this.$route.query.otp || '',
      otpDigits: ['', '', '', '', '', ''],
      otpInputs: [],
      otpVerifying: false,
      otpVerified: false,
      otpError: '',
      password: '',
      passwordConfirmation: '',
      showPwd: false,
      loading: false,
      error: '',
    }
  },

  computed: {
    otp() {
      return this.otpDigits.join('')
    },
    canSubmit() {
      return this.email && this.otpVerified && this.password.length >= 8 && this.password === this.passwordConfirmation
    },
  },

  watch: {
    otp(value) {
      this.otpVerified = false
      this.otpError = ''
      if (value.length === 6) this.verifyOtp()
    },
  },

  methods: {
    onOtpInput(index, event) {
      const digit = event.target.value.replace(/\D/g, '').slice(-1)
      this.otpDigits[index] = digit
      if (digit && index < this.otpDigits.length - 1) {
        this.otpInputs[index + 1]?.focus()
      }
    },

    onOtpKeydown(index, event) {
      if (event.key === 'Backspace' && !this.otpDigits[index] && index > 0) {
        this.otpInputs[index - 1]?.focus()
      }
    },

    onOtpPaste(event) {
      const pasted = (event.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, this.otpDigits.length)
      if (!pasted) return
      event.preventDefault()
      pasted.split('').forEach((digit, i) => { this.otpDigits[i] = digit })
      const nextIndex = Math.min(pasted.length, this.otpDigits.length - 1)
      this.otpInputs[nextIndex]?.focus()
    },

    async verifyOtp() {
      this.otpVerifying = true
      this.otpError = ''
      try {
        await this.$store.dispatch('resetPassword/verifyOTP', { otp: this.otp, user: this.userId })
        this.otpVerified = true
      } catch (err) {
        this.otpVerified = false
        this.otpError = err.response?.data?.message || 'Invalid or expired code.'
      } finally {
        this.otpVerifying = false
      }
    },

    async submit() {
      if (!this.canSubmit) return
      this.error = ''
      this.loading = true
      try {
        await this.$store.dispatch('resetPassword/resetPassword', {
          email: this.email,
          new_password: this.password,
          new_password2: this.passwordConfirmation,
        })
        this.toast?.success('Password reset successfully. Please sign in with your new password.')
        this.$router.push({ name: 'Login' })
      } catch (err) {
        this.error = err.response?.data?.message || 'Could not reset your password. Check the code and try again.'
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
