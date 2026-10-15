<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Approval Chain</h1>
        <p class="page-subtitle">Enable multi-stage approval chains per feature</p>
      </div>
    </div>

    <div class="card chain-card">
      <p class="chain-card__title">Feature List</p>
      <div class="chain-card__divider" />
        
      <div v-if="loading" class="page-loader text-muted">Loading…</div>
   

      <template v-else>
        <template v-for="(feature, idx) in featureList" :key="feature.id">
          <div class="chain-card__row">
            <p class="chain-card__name">{{ idx + 1 }}. {{ feature.name }}</p>

            <div class="chain-card__actions">
              <button
                type="button"
                role="switch"
                :aria-checked="feature.is_chain_enabled"
                class="feature-toggle"
                :disabled="toggleLoading"
                @click="onToggle(feature)"
              >
                <span class="feature-toggle__label" :class="{ 'feature-toggle__label--on': feature.is_chain_enabled }">On</span>
                <span class="feature-toggle__track" :class="feature.is_chain_enabled ? 'feature-toggle__track--on' : 'feature-toggle__track--off'">
                  <span class="feature-toggle__thumb" />
                </span>
                <span class="feature-toggle__label" :class="{ 'feature-toggle__label--off': !feature.is_chain_enabled }">Off</span>
              </button>

              <button
                type="button"
                class="feature-details"
                :class="{ 'feature-details--active': feature.is_chain_enabled }"
                :disabled="!feature.is_chain_enabled"
                @click="openDetails(feature)"
              >
                Details <i class="ri-arrow-right-double-line" />
              </button>
            </div>
          </div>
          <div v-if="idx < featureList.length - 1" class="chain-card__divider" />
        </template>

        <p v-if="!featureList.length" class="text-muted text-sm">No features found.</p>
      </template>
    </div>

    <ApprovalChainSidebar
      v-if="sidebarOpen"
      :feature="activeFeature"
      :existing-chain="activeChain"
      :available-members="availableMembers"
      :loading="chainLoading"
      :submitting="submitting"
      :mutating="chainMutating"
      @close="sidebarOpen = false"
      @save="onSaveChain"
      @create-stage="onCreateStage"
      @remove-stage="onRemoveStage"
      @update-stage-rule="onUpdateStageRule"
      @add-approver="onAddApprover"
      @remove-approver="onRemoveApprover"
    />
  </div>
</template>

<script>
import ApprovalChainSidebar from '@/components/common/ApprovalChainSidebar.vue'

export default {
  name: 'ApprovalChainList',
  components: { ApprovalChainSidebar },
  inject: ['toast'],

  data() {
    return {
      sidebarOpen: false,
      activeFeature: null,
      activeChain: null,
      chainLoading: false,
      submitting: false,
      chainMutating: false,
    }
  },

  computed: {
    featureList()   { return this.$store.getters['approvalChain/featureList'] },
    loading()       { return this.$store.getters['approvalChain/loading'] },
    toggleLoading() { return this.$store.getters['approvalChain/toggleLoading'] },
    availableMembers() { return this.$store.getters['employee/employeeList'] ?? [] },
  },

  created() {
    this.$store.dispatch('approvalChain/fetchFeatureList')
    this.$store.dispatch('employee/fetchOptimisedEmployeeList')
  },

  methods: {
    // Switching a feature's chain OFF just disables it. Switching it ON
    // (from off) opens the sidebar right away so the newly-enabled feature
    // isn't left without a configured chain.
    async onToggle(feature) {
      const wasOff = !feature.is_chain_enabled
      try {
        await this.$store.dispatch('approvalChain/toggleFeature', { id: feature.id })
        if (wasOff) this.openDetails(feature, { forCreate: true })
      } catch {
        this.toast?.error('Failed to update feature status.')
      }
    },

    async openDetails(feature, { forCreate = false } = {}) {
      this.activeFeature = feature
      this.activeChain = null
      this.sidebarOpen = true

      if (forCreate) return

      this.chainLoading = true
      try {
        await this.refreshActiveChain()
      } catch {
        this.toast?.error('Failed to load chain details.')
      } finally {
        this.chainLoading = false
      }
    },

    // Re-fetches the currently open chain and flows it back down to the
    // sidebar via `existingChain` — used after every granular stage/approver
    // edit so the sidebar always renders server-confirmed state rather than
    // an optimistic guess.
    async refreshActiveChain() {
      await this.$store.dispatch('approvalChain/fetchActiveChain', this.activeFeature.code)
      this.activeChain = this.$store.getters['approvalChain/chainPreset']
    },

    async onCreateStage({ sequence_no, name }) {
      this.chainMutating = true
      try {
        await this.$store.dispatch('approvalChain/createStage', {
          chain: this.activeChain.id,
          sequence_no,
          name,
          rule: 'ANY_ONE',
          approver_ids: [],
        })
        await this.refreshActiveChain()
      } catch {
        this.toast?.error('Failed to add stage.')
      } finally {
        this.chainMutating = false
      }
    },

    async onRemoveStage(stageId) {
      this.chainMutating = true
      try {
        await this.$store.dispatch('approvalChain/deleteStage', stageId)
        await this.refreshActiveChain()
      } catch {
        this.toast?.error('Failed to remove stage.')
      } finally {
        this.chainMutating = false
      }
    },

    async onUpdateStageRule({ stage_id, name, rule }) {
      this.chainMutating = true
      try {
        await this.$store.dispatch('approvalChain/updateStage', { stage_id, name, rule })
        await this.refreshActiveChain()
      } catch {
        this.toast?.error('Failed to update stage.')
      } finally {
        this.chainMutating = false
      }
    },

    async onAddApprover({ stage_id, userId }) {
      this.chainMutating = true
      try {
        await this.$store.dispatch('approvalChain/addStageApprover', { stage: stage_id, user: userId })
        await this.refreshActiveChain()
      } catch {
        this.toast?.error('Failed to add approver.')
      } finally {
        this.chainMutating = false
      }
    },

    async onRemoveApprover({ approverId }) {
      this.chainMutating = true
      try {
        await this.$store.dispatch('approvalChain/deleteStageApprover', approverId)
        await this.refreshActiveChain()
      } catch {
        this.toast?.error('Failed to remove approver.')
      } finally {
        this.chainMutating = false
      }
    },

    async onSaveChain(payload) {
      this.submitting = true
      try {
        const created = await this.$store.dispatch('approvalChain/createChain', payload)
        const chainId = created?.data?.id ?? created?.id
        if (!chainId) {
          this.toast?.error('Failed to create chain.')
          return
        }
        await this.$store.dispatch('approvalChain/activateChain', chainId)
        this.toast?.success('Approval chain saved.')
        this.sidebarOpen = false
        this.$store.dispatch('approvalChain/fetchFeatureList')
      } catch {
        this.toast?.error('Failed to save approval chain.')
      } finally {
        this.submitting = false
      }
    },
  },
}
</script>

<style scoped>
.chain-card { display: flex; flex-direction: column; gap: 12px; padding: 24px 16px; }
.chain-card__title { margin: 0; font-size: 18px; font-weight: 500; color: #272727; }
.chain-card__divider { height: 1px; background: #DCDCDC; width: 100%; }

.chain-card__row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px; }
.chain-card__name { margin: 0; font-size: 16px; font-weight: 500; color: #121212; }
.chain-card__actions { display: flex; align-items: center; gap: 10px; }

.feature-toggle { display: inline-flex; align-items: center; gap: 8px; background: transparent; border: none; cursor: pointer; padding: 0; }
.feature-toggle:disabled { opacity: .6; cursor: not-allowed; }
.feature-toggle__label { font-size: 12px; color: #888889; }
.feature-toggle__label--on  { color: #008610; }
.feature-toggle__label--off { color: #BF0022; }
.feature-toggle__track {
  width: 32px; height: 16px; border-radius: 20px; padding: 2px; display: flex; align-items: center;
  transition: background-color .15s;
}
.feature-toggle__track--on  { background: #BAEFBF; justify-content: flex-start; }
.feature-toggle__track--off { background: #FFC2C0; justify-content: flex-end; }
.feature-toggle__thumb { width: 12px; height: 12px; border-radius: 50%; transition: background-color .15s; }
.feature-toggle__track--on .feature-toggle__thumb  { background: #008610; }
.feature-toggle__track--off .feature-toggle__thumb { background: #BF0022; }

.feature-details {
  display: inline-flex; align-items: center; gap: 8px; border: 1.5px solid transparent; border-radius: 6px;
  padding: 6px 12px; font-size: 12px; font-weight: 600; cursor: pointer;
  background: #DCDCDC; color: #888889;
}
.feature-details--active { background: #E9EFFF; border-color: #CFD4FF; color: #573FE0; }
.feature-details:disabled { cursor: not-allowed; }
</style>
