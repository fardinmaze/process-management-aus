<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Designation Permissions</h1>
        <p class="page-subtitle">Toggle what this designation can access.</p>
      </div>
      <button type="button" class="btn btn--ghost" @click="goBack">
        <i class="ri-arrow-left-line" /> Back
      </button>
    </div>

    <div v-if="loading && !features.length" class="card page-loader text-muted">Loading…</div>
    <div v-else-if="error" class="card p-4 text-danger">Failed to load designation permissions.</div>

    <template v-else>
      <div class="form-card space-y-1">
        <h2 class="form-card__title">{{ detail.title || 'Designation' }}</h2>
        <p class="text-muted">
          Department: <strong>{{ detail.department?.name || '—' }}</strong>
        </p>
      </div>

      <div v-for="feature in features" :key="feature.title" class="card p-4">
        <h3 class="feature-title">{{ feature.title }}</h3>
        <ul class="perm-list">
          <li v-for="permission in feature.permissions" :key="permission.id" class="perm-row">
            <span class="perm-row__label">{{ permission.title }}</span>
            <label class="switch">
              <input
                type="checkbox"
                :checked="permission.status"
                :disabled="busyId === permission.id"
                @change="toggle(permission)"
              />
              <span class="switch__track"><span class="switch__thumb" /></span>
            </label>
          </li>
        </ul>
      </div>

      <div v-if="!features.length" class="card p-4">
        <div class="empty-state">
          <i class="ri-shield-keyhole-line" />
          <h3>No permissions</h3>
          <p>This designation has no configurable features.</p>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import { goBack as goBackTo } from '@/utils/helpers'

export default {
  name: 'DesignationPermissionsView',
  inject: ['toast'],

  data() {
    return { busyId: null }
  },

  computed: {
    detail()   { return this.$store.getters['designation/designationDetail'] || {} },
    loading()  { return this.$store.getters['designation/designationLoading'] },
    error()    { return this.$store.getters['designation/designationError'] },
    features() { return Array.isArray(this.detail.feature) ? this.detail.feature : [] },
  },

  created() {
    this.$store.dispatch('designation/fetchDesignationDetails', this.$route.params.id)
  },

  methods: {
    goBack() {
      goBackTo(this.$router, { name: 'DesignationList' })
    },

    // The store action re-fetches the detail on success, so `permission.status`
    // reflects the server after the toggle resolves — no optimistic flip needed.
    async toggle(permission) {
      this.busyId = permission.id
      try {
        await this.$store.dispatch('designation/toggleDesignationPermission', {
          designation: this.$route.params.id,
          permission: permission.id,
        })
      } catch {
        this.toast?.error('Failed to update permission.')
      } finally {
        this.busyId = null
      }
    },
  },
}
</script>

<style scoped>
.feature-title {
  margin: 0 0 6px;
  font-size: 0.9rem;
  font-weight: 700;
  color: #1e293b;
}

.perm-list { list-style: none; margin: 0; padding: 0; }
.perm-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 2px;
  border-bottom: 1px solid #f1f5f9;
}
.perm-row:last-child { border-bottom: 0; }
.perm-row__label { font-size: 13px; color: #334155; }

/* iOS-style toggle — no shared class exists yet, so it lives here. */
.switch { position: relative; display: inline-flex; flex-shrink: 0; cursor: pointer; }
.switch input { position: absolute; width: 1px; height: 1px; opacity: 0; }
.switch__track {
  width: 40px;
  height: 22px;
  padding: 2px;
  border-radius: 9999px;
  background: #cbd5e1;
  display: inline-flex;
  align-items: center;
  transition: background-color 0.18s ease;
}
.switch__thumb {
  width: 18px;
  height: 18px;
  border-radius: 9999px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
  transition: transform 0.18s ease;
}
.switch input:checked + .switch__track { background: #008610; }
.switch input:checked + .switch__track .switch__thumb { transform: translateX(18px); }
.switch input:disabled + .switch__track { opacity: 0.5; cursor: not-allowed; }
.switch input:focus-visible + .switch__track { box-shadow: 0 0 0 3px rgba(0, 134, 16, 0.25); }
</style>
