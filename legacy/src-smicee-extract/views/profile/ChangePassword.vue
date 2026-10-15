<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Change Password</h1>
        <p class="page-subtitle">Update the password used to sign in to your account.</p>
      </div>
    </div>

    <div class="card form-card max-w-[420px]">
      <form @submit.prevent="updatePassword">
        <div class="form-group">
          <label class="form-label">Old Password</label>
          <div class="input-eye">
            <input
              v-model="password.old_password"
              :type="showOld ? 'text' : 'password'"
              class="form-input"
              placeholder="*********"
              autocomplete="current-password"
            />
            <button type="button" class="input-eye__toggle" @click="showOld = !showOld">
              <i :class="showOld ? 'ri-eye-off-line' : 'ri-eye-line'" />
            </button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">New Password</label>
          <div class="input-eye">
            <input
              v-model="password.new_password1"
              :type="showNew ? 'text' : 'password'"
              class="form-input"
              placeholder="*********"
              autocomplete="new-password"
            />
            <button type="button" class="input-eye__toggle" @click="showNew = !showNew">
              <i :class="showNew ? 'ri-eye-off-line' : 'ri-eye-line'" />
            </button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Re-Type New Password</label>
          <div class="input-eye">
            <input
              v-model="password.new_password2"
              :type="showConfirm ? 'text' : 'password'"
              class="form-input"
              placeholder="*********"
              autocomplete="new-password"
            />
            <button type="button" class="input-eye__toggle" @click="showConfirm = !showConfirm">
              <i :class="showConfirm ? 'ri-eye-off-line' : 'ri-eye-line'" />
            </button>
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn--primary" :disabled="submitting">
            {{ submitting ? 'Updating…' : 'Update Password' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ChangePasswordView',
  inject: ['toast'],

  data() {
    return {
      showOld: false,
      showNew: false,
      showConfirm: false,
      submitting: false,
      password: {
        old_password: '',
        new_password1: '',
        new_password2: '',
      },
    }
  },

  methods: {
    async updatePassword() {
      const specialCharacterRegex = /[!@#$%^&*(),.?":{}|<>]/

      if (this.password.new_password1 !== this.password.new_password2) {
        this.toast?.error("Passwords don't match")
        return
      }
      if (this.password.new_password1.length < 8) {
        this.toast?.error('Password must be at least 8 characters long')
        return
      }
      if (!specialCharacterRegex.test(this.password.new_password1)) {
        this.toast?.error('Password must contain at least one special character')
        return
      }

      this.submitting = true
      try {
        const data = await this.$store.dispatch('resetPassword/updatePassword', this.password)
        this.toast?.success(data?.response || 'Password updated successfully.')
        this.password.old_password = ''
        this.password.new_password1 = ''
        this.password.new_password2 = ''
      } catch (err) {
        this.toast?.error(err.response?.data?.message || 'Failed to update password.')
      } finally {
        this.submitting = false
      }
    },
  },
}
</script>
