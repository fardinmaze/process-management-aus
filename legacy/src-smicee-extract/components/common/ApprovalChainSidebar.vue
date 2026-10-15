<template>
  <teleport to="body">
    <div class="fixed inset-0 bg-slate-900/30 z-[1000]" style="animation: sidebar-backdrop-in .2s ease" @click.self="$emit('close')">
      <aside
        class="chain-sidebar bg-white flex flex-col h-full overflow-hidden ml-auto w-full max-w-[480px] shadow-[-4px_0_24px_rgba(220,220,220,0.4)]"
        style="animation: sidebar-slide-in .22s ease"
        role="dialog"
        aria-modal="true"
      >
        <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0"> 
          <h3 class="sidebar__title">Approval Chain Details</h3>
          <button type="button" class="chain-sidebar__close" @click="$emit('close')">
            <i class="ri-close-line" /> 
          </button>
        </div>


        <div v-if="loading" class="page-loader text-muted px-6 pb-6">Loading…</div>

        <div v-else class="flex-1 min-h-0 overflow-y-auto px-6 pb-6 flex flex-col gap-6">
          <!-- Header -->
          <div class="flex flex-col gap-3 mt-4">

            <div class="flex flex-col gap-4">
              <div class="chain-row">
                <span class="chain-row__label">Feature</span>
                <span class="chain-row__value">{{ feature.name || '—' }}</span>
              </div>

              <div class="chain-row">
                <span class="chain-row__label">Enter Number of Stages</span>
                <div class="chain-stepper">
                  <div class="chain-stepper__arrows">
                    <button type="button" class="chain-stepper__arrow" title="Increase" :disabled="isEdit && mutating" @click="increaseStage">
                      <i class="ri-arrow-up-s-fill" />
                    </button>
                    <button type="button" class="chain-stepper__arrow" title="Decrease" :disabled="stageCount <= 1 || (isEdit && mutating)" @click="decreaseStage">
                      <i class="ri-arrow-down-s-fill" />
                    </button>
                  </div>
                  <span class="chain-stepper__value">{{ stageCount }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Assign Members -->
          <div class="flex flex-col gap-6">
            <h3 class="sidebar__title">Assign Members</h3>
            <div class="chain-sidebar__divider" />
   

            <div v-for="(stage, idx) in stages" :key="idx" class="chain-stage">
              <div class="flex flex-col gap-2.5">
                <div class="flex items-center justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <p class="chain-stage__title">Stage {{ String(idx + 1).padStart(2, '0') }}</p>
                    <button
                      type="button"
                      class="chain-rule"
                      :class="stage.rule === 'ALL' ? 'chain-rule--all' : 'chain-rule--any'"
                      :disabled="isEdit && mutating"
                      @click="toggleRule(idx)"
                    >
                      <span class="chain-rule__label" :class="{ 'chain-rule__label--active': stage.rule !== 'ALL' }">Any</span>
                      <span class="chain-rule__track">
                        <span class="chain-rule__thumb" />
                      </span>
                      <span class="chain-rule__label" :class="{ 'chain-rule__label--active': stage.rule === 'ALL' }">All</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    class="icon-btn icon-btn--delete"
                    title="Delete Stage"
                    :disabled="stages.length <= 1 || (isEdit && mutating)"
                    @click="deleteStageAt(idx)"
                  >

                  </button>
                </div>
                <div class="chain-sidebar__divider" />
              </div>

              <div class="flex flex-wrap gap-3 items-start relative" :ref="setPickerAnchor(idx)">
                <span v-for="m in stageApprovers(stage)" :key="m.id" class="chain-pill">
                  <span class="chain-pill__avatar">
                    <img v-if="memberPhoto(m)" :src="memberPhoto(m)" :alt="memberName(m)" />
                    <span v-else>{{ getInitials(memberName(m)) }}</span>
                  </span>
                  <span class="chain-pill__name">{{ memberName(m) }}</span>
                  <button type="button" class="chain-pill__remove" title="Remove" :disabled="isEdit && mutating" @click="removeApprover(idx, m.id)">
                    <i class="ri-subtract-line" />
                  </button>
                </span>

                <button type="button" class="chain-pill__add" title="Add approver" :disabled="isEdit && mutating" @click="togglePicker(idx)">
                  <i class="ri-add-line" />
                </button>

                <div v-if="pickerOpenIndex === idx" class="chain-picker">
                  <div class="chain-picker__search">
                    <i class="ri-search-line" />
                    <input v-model="pickerSearch" type="text" placeholder="Search members…" />
                  </div>
                  <div class="chain-picker__options">
                    <button
                      v-for="m in unassignedMembers(stage)"
                      :key="m.id"
                      type="button"
                      class="chain-picker__option"
                      @click="addApprover(idx, m.id)"
                    >
                      <span class="chain-picker__option-avatar">
                        <img v-if="memberPhoto(m)" :src="memberPhoto(m)" :alt="memberName(m)" />
                        <span v-else>{{ getInitials(memberName(m)) }}</span>
                      </span>
                      <span class="chain-picker__option-name">{{ memberName(m) }}</span>
                    </button>
                    <p v-if="!unassignedMembers(stage).length" class="chain-picker__empty">
                      {{ availableMembers.length ? 'No matches.' : 'No members available.' }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="chain-sidebar__footer no-print">
            <span v-if="isEdit && mutating" class="chain-mutating-hint"><i class="ri-loader-4-line spinning" /> Saving…</span>
            <!-- <button type="button" class="btn btn--ghost" :disabled="submitting" @click="$emit('close')">
              {{ isEdit ? 'Close' : 'Cancel' }}
            </button> -->
            <button v-if="!isEdit" type="button" class="btn btn--primary" :disabled="submitting || !canSave" @click="save">
              {{ submitting ? 'Saving…' : 'Save Chain' }}
            </button>
          </div>
        </div>
      </aside>
    </div>
  </teleport>
</template>

<script>
import { getInitials } from '@/utils/helpers'
import { API_HOST } from '@/utils/apiPaths'


export default {
  name: 'ApprovalChainSidebar',
  emits: ['close', 'save', 'create-stage', 'remove-stage', 'update-stage-rule', 'add-approver', 'remove-approver'],

  props: {
    loading:    { type: Boolean, default: false },
    submitting: { type: Boolean, default: false },
    mutating:   { type: Boolean, default: false },
    feature: { type: Object, required: true },
    existingChain: { type: Object, default: null },
    availableMembers: { type: Array, default: () => [] },
  },

  data() {
    const initialStages = this.buildInitialStages()
    return {
      stageCount: initialStages.length,
      stages: initialStages,
      pickerOpenIndex: null,
      pickerSearch: '',
    }
  },

  computed: {
    canSave() {
      return this.stages.every((s) => s.approvers.length)
    },
    isEdit() {
      return !!this.existingChain?.id
    },
  },

  watch: {
    existingChain() {
      const rebuilt = this.buildInitialStages()
      this.stageCount = rebuilt.length
      this.stages = rebuilt
    },
  },

  mounted() {
    document.addEventListener('mousedown', this.handleClickOutside)
    this.previousHtmlOverflowY = document.documentElement.style.overflowY
    document.documentElement.style.overflowY = 'hidden'
  },
  beforeUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside)
    document.documentElement.style.overflowY = this.previousHtmlOverflowY
  },

  methods: {
    getInitials,

    buildInitialStages() {
      const existing = this.existingChain?.stages
      if (existing?.length) {
        return [...existing]
          .sort((a, b) => (a.sequence_no ?? 0) - (b.sequence_no ?? 0))
          .map((s) => ({
            stage_id: s.id ?? null,
            sequence_no: s.sequence_no ?? null,
            name: s.name || '',
            rule: s.rule === 'ALL' ? 'ALL' : 'ANY_ONE',
            approvers: (s.approvers || []).map((a) => this.normalizeApprover(a)),
          }))
      }
      return [{ stage_id: null, sequence_no: null, name: '', rule: 'ANY_ONE', approvers: [] }]
    },

    
    normalizeApprover(a) {
      if (a && typeof a === 'object' && 'user_detail' in a) {
        const detail = a.user_detail || {}
        return {
          id: a.id,
          user: a.user ?? detail.id,
          first_name: detail.first_name || '',
          last_name: detail.last_name || '',
          email: detail.email || '',
          photo: detail.photo || null,
        }
      }
      const obj = a && typeof a === 'object' ? a : { id: a }
      return {
        id: obj.id,
        user: obj.id,
        first_name: obj.first_name || '',
        last_name: obj.last_name || '',
        email: obj.email || '',
        photo: obj.photo || null,
      }
    },

    nextStageName(idx) {
      return String.fromCharCode(65 + idx)
    },

    setStageCount(count) {
      const next = Math.max(1, count)
      if (next > this.stages.length) {
        while (this.stages.length < next) this.stages.push({ stage_id: null, sequence_no: null, name: '', rule: 'ANY_ONE', approvers: [] })
      } else if (next < this.stages.length) {
        this.stages.splice(next)
      }
      this.stageCount = next
    },

    
    increaseStage() {
      if (this.isEdit) {
        if (this.mutating) return
        this.$emit('create-stage', {
          sequence_no: this.nextSequenceNo(),
          name: this.nextStageName(this.stages.length),
        })
      } else {
        this.setStageCount(this.stages.length + 1)
      }
    },

    nextSequenceNo() {
      return this.stages.reduce((max, s) => Math.max(max, s.sequence_no || 0), 0) + 1
    },

    decreaseStage() {
      this.deleteStageAt(this.stages.length - 1)
    },

    
    deleteStageAt(idx) {
      if (this.stages.length <= 1) return
      const stage = this.stages[idx]
      if (!stage) return
      if (this.isEdit) {
        if (this.mutating) return
        this.$emit('remove-stage', stage.stage_id)
      } else {
        this.stages.splice(idx, 1)
        this.stageCount = this.stages.length
      }
    },

    toggleRule(idx) {
      const stage = this.stages[idx]
      const nextRule = stage.rule === 'ALL' ? 'ANY_ONE' : 'ALL'
      if (this.isEdit) {
        if (this.mutating) return
        this.$emit('update-stage-rule', { stage_id: stage.stage_id, name: stage.name, rule: nextRule })
      } else {
        stage.rule = nextRule
      }
    },

    memberName(m) {
      return m?.full_name
        || [m?.first_name, m?.last_name].filter(Boolean).join(' ')
        || m?.username
        || 'Unknown'
    },

    memberPhoto(m) {
      const photo = m?.photo
      if (!photo) return null
      return photo.startsWith('http') ? photo : API_HOST + photo
    },

    // Renders straight from the stage's own approver list — no lookup
    // against `availableMembers` needed, so an approver still shows even if
    // they've since dropped out of that (e.g. deactivated) list.
    stageApprovers(stage) {
      return stage.approvers
    },

    unassignedMembers(stage) {
      const assignedIds = new Set(stage.approvers.map((a) => a.user))
      const q = this.pickerSearch.trim().toLowerCase()
      return this.availableMembers.filter((m) => {
        if (assignedIds.has(m.id)) return false
        if (!q) return true
        return this.memberName(m).toLowerCase().includes(q)
      })
    },

    togglePicker(idx) {
      this.pickerOpenIndex = this.pickerOpenIndex === idx ? null : idx
      this.pickerSearch = ''
    },

    setPickerAnchor(idx) {
      this.pickerAnchors ||= {}
      return (el) => { this.pickerAnchors[idx] = el }
    },

    addApprover(idx, memberId) {
      const stage = this.stages[idx]
      if (stage.approvers.some((a) => a.user === memberId)) return
      if (this.isEdit) {
        if (this.mutating) return
        this.$emit('add-approver', { stage_id: stage.stage_id, userId: memberId })
        this.pickerOpenIndex = null
      } else {
        const member = this.availableMembers.find((m) => m.id === memberId)
        if (member) stage.approvers.push(this.normalizeApprover(member))
      }
    },

    removeApprover(idx, memberId) {
      if (this.isEdit) {
        if (this.mutating) return
        this.$emit('remove-approver', { approverId: memberId })
      } else {
        this.stages[idx].approvers = this.stages[idx].approvers.filter((a) => a.id !== memberId)
      }
    },

    handleClickOutside(e) {
      if (this.pickerOpenIndex === null) return
      const anchor = this.pickerAnchors?.[this.pickerOpenIndex]
      if (anchor?.contains(e.target)) return
      this.pickerOpenIndex = null
    },

    save() {
      if (!this.canSave) return

      const stages = this.stages.map((s, idx) => ({
        sequence_no: idx + 1,
        name: this.nextStageName(idx),
        rule: s.rule,
        approver_ids: s.approvers.map((a) => a.user),
      }))
      this.$emit('save', { feature: this.feature.id, stages })
    },
  },
}
</script>

<style scoped>
@keyframes sidebar-backdrop-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes sidebar-slide-in {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}

.chain-sidebar__close {
  background: transparent; border: none; font-size: 20px; color: #A3A3A4; cursor: pointer;
  padding: 2px; border-radius: 6px; line-height: 1; display: flex; flex-shrink: 0;
  transition: color .15s, background-color .15s;
}
.chain-sidebar__close:hover { color: #272727; background: #F0F0F0; }

.chain-sidebar__title { margin: 0; font-family: 'Spline Sans', 'Poppins', sans-serif; font-size: 20px; font-weight: 500; color: #573FE0; }
.chain-sidebar__title--sm { font-size: 20px; }
.chain-sidebar__divider { height: 1px; background: #DCDCDC; width: 100%; flex-shrink: 0; }

.chain-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.chain-row__label { font-size: 14px; color: #6E6E6F; }
.chain-row__value { font-size: 16px; font-weight: 500; color: #573FE0; }

.chain-stepper {
  display: inline-flex; align-items: center; gap: 16px; background: #F9F9F9;
  border-radius: 8px; padding: 6px 12px;
}
.chain-stepper__arrows { display: flex; flex-direction: column; line-height: 0; }
.chain-stepper__arrow { background: transparent; border: none; color: #6E6E6F; font-size: 15px; cursor: pointer; padding: 0; line-height: 12px; }
.chain-stepper__arrow:disabled { opacity: .4; cursor: not-allowed; }
.chain-stepper__value { font-size: 16px; font-weight: 500; color: #3D3D3E; min-width: 12px; text-align: center; }

.chain-stage { display: flex; flex-direction: column; gap: 12px; }
.chain-stage__title { margin: 0; font-size: 18px; font-weight: 500; color: #3D3D3E; }
.chain-stage__delete {
  display: inline-flex; align-items: center; justify-content: center;
  width: 24px; height: 24px; border: none; border-radius: 6px; padding: 0;
  background: transparent; color: #BF0022; cursor: pointer; font-size: 15px;
  transition: background-color .15s;
}
.chain-stage__delete:hover:not(:disabled) { background: #FFDEDC; }
.chain-stage__delete:disabled { opacity: .4; cursor: not-allowed; }

.chain-rule { display: inline-flex; align-items: center; gap: 8px; background: transparent; border: none; cursor: pointer; padding: 0; }
.chain-rule:disabled { opacity: .6; cursor: not-allowed; }
.chain-rule__label { font-size: 12px; color: #888889; }
.chain-rule__label--active.chain-rule--any .chain-rule__label,
.chain-rule--any .chain-rule__label--active { color: #008610; }
.chain-rule--all .chain-rule__label--active { color: #573FE0; }
.chain-rule__track {
  width: 32px; height: 16px; border-radius: 20px; padding: 2px; display: flex; align-items: center;
  transition: background-color .15s;
}
.chain-rule--any .chain-rule__track { background: #BAEFBF; justify-content: flex-start; }
.chain-rule--all .chain-rule__track { background: #CFD4FF; justify-content: flex-end; }
.chain-rule__thumb { width: 12px; height: 12px; border-radius: 50%; transition: background-color .15s; }
.chain-rule--any .chain-rule__thumb { background: #008610; }
.chain-rule--all .chain-rule__thumb { background: #573FE0; }

.chain-pill {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 6px 8px 6px 6px; border-radius: 36px;
  background: #F9F9F9; border: 1px solid #DCDCDC;
  font-size: 10px; color: #3D3D3E;
  max-width: fit-content;
}
.chain-pill__avatar {
  width: 16px; height: 16px; border-radius: 50%; flex-shrink: 0; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  background: #573FE0; color: #fff; font-size: 7px; font-weight: 700;
}
.chain-pill__avatar img { width: 100%; height: 100%; object-fit: cover; }
.chain-pill__name { white-space: nowrap; }
.chain-pill__remove {
  display: inline-flex; align-items: center; justify-content: center;
  width: 16px; height: 16px; border: none; border-radius: 50%; padding: 0;
  background: #FFDEDC; color: #BF0022; cursor: pointer; font-size: 11px;
}
.chain-pill__remove:disabled { opacity: .5; cursor: not-allowed; }
.chain-pill__add {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border: none; border-radius: 50%; padding: 0;
  background: #008610; color: #fff; font-size: 16px; cursor: pointer; transition: background-color .15s;
}
.chain-pill__add:hover:not(:disabled) { background: #006500; }
.chain-pill__add:disabled { opacity: .5; cursor: not-allowed; }

.chain-picker {
  position: absolute; top: calc(100% + 8px); left: 0; z-index: 20;
  width: 240px; max-width: calc(100vw - 48px);
  background: #fff; border: 1px solid #DCDCDC; border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  display: flex; flex-direction: column; overflow: hidden;
}
.chain-picker__search {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 12px; border-bottom: 1px solid #F0F0F0; color: #A3A3A4; font-size: 13px;
}
.chain-picker__search input { flex: 1; border: none; outline: none; font-size: 13px; color: #272727; background: transparent; }
.chain-picker__options { max-height: 200px; overflow-y: auto; padding: 4px; }
.chain-picker__option {
  display: flex; align-items: center; gap: 8px; width: 100%;
  padding: 7px 8px; border-radius: 8px; cursor: pointer; border: none; background: transparent;
  font-size: 13px; color: #272727; transition: background-color .15s;
}
.chain-picker__option:hover { background: #F9F9F9; }
.chain-picker__option-avatar {
  width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  background: #CFD4FF; color: #4010BD; font-size: 10px; font-weight: 700;
}
.chain-picker__option-avatar img { width: 100%; height: 100%; object-fit: cover; }
.chain-picker__option-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: left; }
.chain-picker__empty { margin: 0; padding: 16px 8px; text-align: center; font-size: 12.5px; color: #A3A3A4; }

.chain-sidebar__footer { display: flex; align-items: center; justify-content: flex-end; gap: 8px; padding-top: 8px; border-top: 1px solid #F0F0F0; }
.chain-mutating-hint { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: #6E6E6F; margin-right: auto; }

@media (max-width: 560px) {
  .chain-sidebar { max-width: 100%; }
}
</style>
