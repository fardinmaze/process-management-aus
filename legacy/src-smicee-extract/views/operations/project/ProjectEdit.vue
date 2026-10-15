<template>
<div class="page">
    <div class="page-header">
      <h1 class="page-title">Edit Project</h1>
      <button type="button" class="btn btn--ghost btn--sm" @click="goBack">
        <i class="ri-arrow-left-line" /> Back
      </button>
    </div>

    <div v-if="loadingDetail" class="page-loader text-muted">Loading…</div>

    <form v-else class="form-card wizard-card" @submit.prevent="handlePrimaryAction">
      <div v-if="steps.length > 1" class="step-track">
        <template v-for="(step, index) in steps" :key="step.key">
          <button
            type="button"
            class="step-circle"
            :class="{ 'step-circle--done': index < currentStepIndex, 'step-circle--current': index === currentStepIndex }"
            :title="step.label"
            @click="goToStep(step.key)"
          >
            <i v-if="index < currentStepIndex" class="ri-check-line" />
            <span v-else>{{ index + 1 }}</span>
          </button>
          <div v-if="index < steps.length - 1" class="step-line" :class="{ 'step-line--done': index < currentStepIndex }" />
        </template>
      </div>

      <div class="step-heading">
        <p class="step-heading__text">
          <template v-if="steps.length > 1">{{ currentStepIndex + 1 }}. </template>{{ steps[currentStepIndex]?.label }}
        </p>
        <hr class="step-heading__divider" />
      </div>

      <!-- Project Details -->
      <div v-show="activeTab === 'details'" class="step-panel">
        <div class="details-grid">
          <div class="details-grid__col">
            <div class="form-group">
              <label class="form-label">Project Title <span class="required">*</span></label>
              <input v-model.trim="project.title" type="text" class="form-input" :class="{ 'form-input--error': errors.title }" placeholder="Enter here" />
              <span v-if="errors.title" class="form-error">{{ errors.title }}</span>
            </div>

            <div class="form-group">
              <label class="form-label">Project Type</label>
              <select v-model="project.category" class="form-select">
                <option :value="null">Select Here</option>
                <option v-for="t in projectTypeOptions" :key="t.id" :value="t.id">{{ t.title }}</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Company <span class="required">*</span></label>
              <select v-model="project.company" class="form-select" :class="{ 'form-input--error': errors.company }">
                <option :value="null">-- Select Company --</option>
                <option v-for="c in companies" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
              <span v-if="errors.company" class="form-error">{{ errors.company }}</span>
            </div>

            <div v-if="project.company" class="form-group">
              <label class="form-label">Client</label>
              <div class="input-prefix-group">
                <!-- <span class="input-prefix-group__prefix">C/</span> -->
                <select v-model="project.client_ids" class="form-select flex-1">
                  <option :value="null">Select a client</option>
                  <option v-for="c in clientsByCompany" :key="c.id" :value="c.id">{{ c.display_name }}</option>
                </select>
              </div>
            </div>
          </div>

          <div class="details-grid__col">
            <div class="form-group form-group--fill">
              <label class="form-label">Project Description</label>
              <textarea v-model.trim="project.details" class="form-input details-textarea" placeholder="Enter here" />
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Assigned Team</label>
          <MultiSelect v-model="assignedEmployee" :options="employeeOptions" pill search-when-empty search-placeholder="" placeholder="Search & Select" />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Priority</label>
            <select v-model="project.priority" class="form-select">
              <option v-for="p in priorities" :key="p" :value="p">{{ capitalize(p) }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select v-model="project.status" class="form-select">
              <option v-for="s in statuses" :key="s" :value="s">{{ capitalize(s) }}</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Start Date <span class="required">*</span></label>
            <DatePicker :model-value="project.start_date" placeholder="Select a Date" @update:model-value="onStartDateChange" />
            <span v-if="errors.start_date" class="form-error">{{ errors.start_date }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">Deadline</label>
            <DatePicker :model-value="project.deadline" placeholder="Select a Date" :min="project.start_date" @update:model-value="(val) => (project.deadline = val)" />
          </div>
        </div>
      </div>

      <!-- Deliverables -->
      <div v-if="PROJECT_DELIVERABLES" v-show="activeTab === 'deliverables'" class="step-panel">
        <div v-for="(deliverable, dIndex) in project.deliverables" :key="dIndex" class="deliverable-card">
          <div class="deliverable-card__type-row flex items-end gap-3">
            <div class="form-group flex-1 mb-0">
              <label class="form-label">Delivery Type</label>
              <input v-model.trim="deliverable.delivery_type" type="text" class="form-input" placeholder="Milestone / Final Handover" />
            </div>
            <div class="form-group flex-1 mb-0">
              <label class="form-label">#Milestone</label>
              <input
                v-model.number="deliverable.milestone_count"
                type="number" min="0" class="form-input" placeholder="Enter here"
                @change="syncMilestoneCount(deliverable)"
              />
            </div>
          </div>

          <template v-if="deliverable.details.length">
            <p class="deliverable-card__subheading">Deliverables in Phases</p>
            <hr class="deliverable-card__divider" />

            <div v-for="(detail, detailIndex) in deliverable.details" :key="detailIndex" class="deliverable-row">
              <div class="deliverable-row__index-wrap">
                <span class="deliverable-row__index-spacer">&nbsp;</span>
                <span class="deliverable-row__index">{{ String(detailIndex + 1).padStart(2, '0') }}</span>
              </div>
              <div class="form-group flex-1 mb-0">
                <label class="form-label">Expected Deliverables</label>
                <input v-model.trim="detail.expected_deliverable" type="text" class="form-input" placeholder="Enter here" />
              </div>
              <div class="form-group flex-1 mb-0">
                <label class="form-label">Due Date</label>
                <DatePicker :model-value="detail.due_date" placeholder="Select a Date" @update:model-value="(val) => (detail.due_date = val)" />
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- Financial Info -->
      <div v-if="isProjectCategory" v-show="activeTab === 'financial'" class="step-panel">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Purchase Order Value</label>
            <input v-model.number="project.po_value" type="number" step="any" class="form-input" placeholder="Enter here" />
            <span v-if="errors.po_value" class="form-error">{{ errors.po_value }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">Budget</label>
            <input v-model.number="project.budget" type="number" step="any" class="form-input" placeholder="Enter here" />
            <span v-if="errors.budget" class="form-error">{{ errors.budget }}</span>
          </div>
        </div>

        <div class="form-row form-row--3">
          <div class="form-group">
            <label class="form-label">VAT Type</label>
            <select v-model="project.val_type" class="form-select">
              <option v-for="t in valTypeOptions" :key="t.value" :value="t.value">{{ t.title }}</option>
            </select>
            <span v-if="errors.val_type" class="form-error">{{ errors.val_type }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">PO VAT (%)</label>
            <input v-model.number="project.po_vat" type="number" min="0" step="any" class="form-input" placeholder="Enter here" @input="clampNonNegative('po_vat')" />
            <span v-if="errors.po_vat" class="form-error">{{ errors.po_vat }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">PO VAT Amount</label>
            <input :value="vatAmount" type="number" class="form-input" disabled />
          </div>
        </div>

        <div class="form-row form-row--3">
          <div class="form-group">
            <label class="form-label">AIT Type</label>
            <select v-model="project.ait_type" class="form-select">
              <option v-for="t in valTypeOptions" :key="t.value" :value="t.value">{{ t.title }}</option>
            </select>
            <span v-if="errors.ait_type" class="form-error">{{ errors.ait_type }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">PO AIT (%)</label>
            <input v-model.number="project.po_ait" type="number" min="0" step="any" class="form-input" placeholder="Enter here" @input="clampNonNegative('po_ait')" />
            <span v-if="errors.po_ait" class="form-error">{{ errors.po_ait }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">PO AIT Amount</label>
            <input :value="aitAmount" type="number" class="form-input" disabled />
          </div>
        </div>

        <div v-if="PROJECT_DELIVERABLES && hasDeliverables" class="installments">
          <div class="installments__header">
            <p class="installments__title">Installments</p>
            <button
              type="button"
              class="toggle-switch"
              :class="{ 'toggle-switch--on': showInstallmentInput }"
              :aria-pressed="showInstallmentInput"
              title="Toggle installments"
              @click="toggleInstallments"
            >
              <span class="toggle-switch__thumb" />
            </button>
          </div>
          <hr class="installments__divider" />

          <div v-show="showInstallmentInput">
            <div v-for="(installment, iIndex) in project.installments" :key="iIndex" class="installment-group">
              <div class="form-row form-row--3">
                <div class="form-group">
                  <label class="form-label">Approximate Date</label>
                  <DatePicker :model-value="installment.date" placeholder="Select a Date" @update:model-value="(val) => (installment.date = val)" />
                </div>
                <div class="form-group">
                  <label class="form-label">Percentage</label>
                  <input v-model.number="installment.text" type="number" min="0" max="100" class="form-input" placeholder="Enter Here" @input="updateInstallmentAmount(installment)" />
                </div>
                <div class="form-group">
                  <label class="form-label">Deliverables</label>
                  <select v-model="installment.deliverables" class="form-select" multiple>
                    <option v-for="d in deliverableOptions" :key="d" :value="d">{{ d }}</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Expected Receivable Amount</label>
                <input :value="installment.amount" type="number" class="form-input" disabled />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="form-actions form-actions--wizard">
        <router-link :to="{ name: 'ProjectList' }" class="btn btn--discard">
          <i class="ri-arrow-left-line" /> Discard
        </router-link>
        <button type="submit" class="btn btn--primary" :disabled="submitting">
          {{ submitting ? 'Updating…' : primaryLabel }}
          <i v-if="submitting" class="ri-loader-4-line spinning" />
          <i v-else class="ri-arrow-right-line" />
        </button>
      </div>
    </form>
  </div>
</template>

<script>
import { capitalize, apiErrorMessage, goBack as goBackTo } from '@/utils/helpers'
import { PROJECT_DELIVERABLES } from '@/utils/constants'
import DatePicker  from '@/components/common/DatePicker.vue'
import MultiSelect from '@/components/common/MultiSelect.vue'

const PRIORITIES = ['HIGH', 'MEDIUM', 'LOW']
const STATUSES   = ['PENDING', 'APPROVED', 'WORKING', 'COMPLETED', 'PAUSED', 'POSTPONED', 'ARCHIVED']
const VAT_TYPES  = [
  { value: 'inclusive', title: 'Inclusive' },
  { value: 'exclusive', title: 'Exclusive' },
]

function blankProject() {
  return {
    title:       '',
    details:     '',
    start_date:  '',
    deadline:    '',
    priority:    'HIGH',
    status:      'APPROVED',
    po_value:    null,
    po_vat:      null,
    po_ait:      null,
    budget:      null,
    val_type:    'inclusive',
    ait_type:    'inclusive',
    client_ids:  null,
    company:     null,
    category:    null,
    deliverables: [{ delivery_type: '', milestone_count: null, details: [{ expected_deliverable: '', due_date: '' }] }],
    installments: [],
  }
}

// Ported from the legacy Edit Project page in task.txt — same fields,
// validation and PO VAT/AIT math as ProjectCreate.vue, plus loading the
// existing record via `project/fetchProjectDetails` and submitting through
// `project/updateProject` instead of `addProject`. `project.category` holds
// just the type's id (not the whole object, like ProjectCreate's
// `projectCategory`) so the Project Type <select> matches correctly once
// the record loads, without depending on object reference equality between
// `projectTypeOptions` and the loaded detail's `category`.
//
// No file upload in this form (unlike ProjectCreate) — matches the legacy
// edit script, which keeps it out entirely so re-editing never risks
// clobbering the existing attachment.
//
// Mirrors ProjectCreate.vue's 3-step wizard (Figma node
// 739-14775/742-29481/742-29834): Project Details → Deliverables →
// Financial Info, with deliverables driven by Delivery Type + #Milestone
// (auto-sizing the "Deliverables in Phases" rows) and installments
// auto-filled from those phases' due_date/expected_deliverable the first
// time the Installments toggle is switched on.
//
// No "Project Details" page exists yet in this app, so — unlike the legacy
// script's `router.push('/project/details/:id')` — this redirects back to
// the Projects list on success.
export default {
  name: 'ProjectEditView',
  components: { DatePicker, MultiSelect },
  inject: ['toast'],

  data() {
    return {
      PROJECT_DELIVERABLES,
      project: blankProject(),
      assignedEmployee: [],
      activeTab: 'details',
      priorities: PRIORITIES,
      statuses: STATUSES,
      valTypeOptions: VAT_TYPES,
      showInstallmentInput: false,
      loadingDetail: false,
      errors: {},
      submitting: false,
    }
  },

  computed: {
    projectTypeOptions() { return this.$store.getters['projectType/projectType'] || [] },
    employeeOptions()    { return this.$store.getters['employee/employeeList'] || [] },
    companies()          { return this.$store.getters['client/company'] || [] },
    clientsByCompany()   { return this.$store.getters['client/clientByCompany'] || [] },

    selectedProjectType() {
      return this.projectTypeOptions.find((t) => t.id === this.project.category) || null
    },

    isProjectCategory() {
      return (this.selectedProjectType?.title || '').trim().toUpperCase() === 'PROJECT'
    },

    steps() {
      const s = [{ key: 'details', label: 'Project Details' }]
      if (PROJECT_DELIVERABLES) s.push({ key: 'deliverables', label: 'Deliverables' })
      if (this.isProjectCategory) s.push({ key: 'financial', label: 'Financial Information' })
      return s
    },

    currentStepIndex() {
      const idx = this.steps.findIndex((s) => s.key === this.activeTab)
      return idx === -1 ? 0 : idx
    },

    isLastStep() {
      return this.currentStepIndex === this.steps.length - 1
    },

    primaryLabel() {
      return this.isLastStep ? 'Update Project' : 'Continue'
    },

    hasDeliverables() {
      return this.project.deliverables.some((d) => d.delivery_type && d.delivery_type.trim() !== '')
    },

    deliverableOptions() {
      return this.project.deliverables
        .flatMap((d) => d.details || [])
        .map((d) => d.expected_deliverable)
        .filter((v) => v && v.trim() !== '')
    },

    basePrice() {
      const total = Number(this.project.po_value) || 0
      if (!total) return 0
      let divisor = 1
      if (this.project.val_type === 'inclusive') divisor += (Number(this.project.po_vat) || 0) / 100
      if (this.project.ait_type === 'inclusive') divisor += (Number(this.project.po_ait) || 0) / 100
      return Math.round((total / divisor + Number.EPSILON) * 100) / 100
    },

    vatAmount() {
      if (!this.project.po_vat || !this.project.val_type || !this.project.po_value) return 0
      return Math.round((this.basePrice * Number(this.project.po_vat) / 100 + Number.EPSILON) * 100) / 100
    },

    aitAmount() {
      if (!this.project.po_ait || !this.project.ait_type || !this.project.po_value) return 0
      return Math.round((this.basePrice * Number(this.project.po_ait) / 100 + Number.EPSILON) * 100) / 100
    },
  },

  watch: {
    'project.po_value'() {
      this.project.installments.forEach((installment) => this.updateInstallmentAmount(installment))
    },

    // Matches the legacy `temp_project.company` watcher — fires on both the
    // initial hydrated value and later user changes, but (per that script)
    // never clears `client_ids` itself.
    'project.company': {
      handler(companyId) {
        if (companyId) this.$store.dispatch('client/fetchClientByCompany', companyId)
      },
      immediate: true,
    },

    // If the project type is switched away from "Project" while the user is
    // sitting on the (now hidden) Financial Info step, fall back a step
    // instead of leaving activeTab pointing at a panel that no longer renders.
    isProjectCategory(val) {
      if (!val && this.activeTab === 'financial') this.activeTab = 'deliverables'
    },
  },

  created() {
    this.$store.dispatch('projectType/fetchProjectType')
    this.$store.dispatch('employee/fetchOptimisedEmployeeList')
    this.$store.dispatch('client/fetchCompany')
    this.loadDetail()
  },

  methods: {
    capitalize,

    goBack() {
      goBackTo(this.$router, { name: 'ProjectList' })
    },

    goToStep(key) {
      this.activeTab = key
    },

    async loadDetail() {
      this.loadingDetail = true
      try {
        await this.$store.dispatch('project/fetchProjectDetails', this.$route.params.id)
        this.hydrateForm(this.$store.getters['project/projectDetail'])
      } catch (err) {
        this.toast?.error(apiErrorMessage(err, 'Failed to load project.'))
      } finally {
        this.loadingDetail = false
      }
    },

    hydrateForm(detail) {
      if (!detail) return
      this.project.title       = detail.title || ''
      this.project.details     = detail.details || ''
      this.project.start_date  = detail.start_date || ''
      this.project.deadline    = detail.deadline || ''
      this.project.priority    = detail.priority || 'HIGH'
      this.project.status      = detail.status || 'APPROVED'
      this.project.po_value    = detail.po_value
      this.project.po_vat      = detail.po_vat
      this.project.po_ait      = detail.po_ait
      this.project.budget      = detail.budget
      this.project.val_type    = detail.val_type || 'inclusive'
      this.project.ait_type    = detail.ait_type || 'inclusive'
      this.project.company     = detail.company?.id ?? null
      this.project.client_ids  = detail.client_name?.client_id ?? null
      this.project.category    = detail.category?.id ?? null
      this.project.deliverables = this.mapDeliverables(detail.project_deliverable)
      this.project.installments = detail.installments || []
      this.showInstallmentInput = this.project.installments.length > 0
      this.assignedEmployee     = this.mapTeammates(detail.teammates)
    },

    mapTeammates(teammates) {
      return (teammates || []).map((t) => ({
        id:        t.user_id?.id ?? t.id,
        full_name: t.user_name ?? t.user_id?.full_name ?? t.full_name ?? 'Unknown',
        photo:     t.user_id?.additional_info?.photo ?? t.photo ?? null,
      }))
    },

    // `expected_deliverable`/`due_date` fall back to the old
    // `expected_receivable` field (and an empty due_date) for records saved
    // before the deliverables redesign.
    mapDeliverables(deliverables) {
      if (!deliverables || !deliverables.length) {
        return [{ delivery_type: '', milestone_count: null, details: [{ expected_deliverable: '', due_date: '' }] }]
      }
      return deliverables.map((d) => {
        const details = d.details && d.details.length
          ? d.details.map((detail) => ({
              expected_deliverable: detail.expected_deliverable ?? detail.expected_receivable ?? '',
              due_date: detail.due_date || '',
            }))
          : [{ expected_deliverable: '', due_date: '' }]
        return {
          delivery_type: d.delivery_type?.name ?? d.delivery_type ?? '',
          milestone_count: d.milestone_count ?? details.length,
          details,
        }
      })
    },

    // #Milestone drives how many "Deliverables in Phases" rows a deliverable
    // has — grow/shrink `details` to match instead of separate manual
    // add/remove-detail buttons (matches Figma node 742-29481).
    syncMilestoneCount(deliverable) {
      const count = Math.max(0, Number(deliverable.milestone_count) || 0)
      const current = deliverable.details.length
      if (count > current) {
        for (let i = current; i < count; i++) {
          deliverable.details.push({ expected_deliverable: '', due_date: '' })
        }
      } else if (count < current) {
        deliverable.details.splice(count)
      }
    },

    // Installments toggle (Figma node 742-29834) auto-fills one installment
    // per deliverable phase the first time it's switched on — date from
    // that phase's due_date, deliverables from its expected_deliverable —
    // instead of the old manual "how many installments?" + Generate flow.
    // Only runs when installments is empty so re-toggling doesn't clobber
    // percentages the user has already entered, and so it doesn't stomp on
    // installments already saved on the record being edited.
    toggleInstallments() {
      this.showInstallmentInput = !this.showInstallmentInput
      if (this.showInstallmentInput && !this.project.installments.length) {
        this.syncInstallmentsFromDeliverables()
      }
    },

    syncInstallmentsFromDeliverables() {
      const phases = this.project.deliverables.flatMap((d) => d.details || [])
      this.project.installments = phases
        .filter((p) => p.expected_deliverable && p.expected_deliverable.trim() !== '')
        .map((p) => ({
          date: p.due_date || '',
          text: 0,
          amount: 0,
          deliverables: [p.expected_deliverable],
        }))
    },

    updateInstallmentAmount(installment) {
      const poValue = Number(this.project.po_value) || 0
      let percentage = Number(installment.text) || 0
      if (percentage > 100) percentage = 100
      if (percentage < 0) percentage = 0
      installment.text = percentage
      installment.amount = (poValue * percentage) / 100
    },

    // PO VAT/AIT (%) must never go negative — the `min="0"` attribute alone
    // doesn't stop someone typing/pasting "-5" into a number input.
    clampNonNegative(field) {
      if (this.project[field] < 0) this.project[field] = 0
    },

    onStartDateChange(val) {
      this.project.start_date = val
      if (this.project.deadline && this.project.deadline < val) {
        this.project.deadline = ''
      }
    },

    // DatePicker only gives a plain 'YYYY-MM-DD' string, but the backend
    // expects each installment's date as a full ISO datetime — and
    // deliverables/installments must go over the wire as a JSON array
    // (a plain string field), not the bracket-notation keys toFormData
    // would otherwise flatten a nested array/object into.
    serializeInstallments() {
      return this.project.installments.map((i) => ({
        date: i.date ? new Date(i.date).toISOString() : null,
        text: Number(i.text) || 0,
        amount: Number(i.amount) || 0,
        deliverables: i.deliverables,
      }))
    },

    validateDetailsStep() {
      const errors = {}
      if (!this.project.title) errors.title = 'Project title is required.'
      if (!this.project.start_date) errors.start_date = 'Start date is required.'
      if (!this.project.company) errors.company = 'Company is required.'
      return errors
    },

    validateFinancialStep() {
      const errors = {}
      if (!this.isProjectCategory) return errors
      if (!this.project.po_value) errors.po_value = 'PO Value is required.'
      if (!this.project.po_vat)   errors.po_vat   = 'PO VAT is required.'
      if (!this.project.po_ait)   errors.po_ait   = 'PO AIT is required.'
      if (!this.project.budget)  errors.budget   = 'Budget is required.'
      if (!this.project.val_type) errors.val_type = 'VAT type is required.'
      if (!this.project.ait_type) errors.ait_type = 'AIT type is required.'
      if (this.project.po_vat < 0) errors.po_vat = 'PO VAT cannot be negative.'
      if (this.project.po_ait < 0) errors.po_ait = 'PO AIT cannot be negative.'
      return errors
    },

    validate() {
      return { ...this.validateDetailsStep(), ...this.validateFinancialStep() }
    },

    // Each step's primary button both validates and advances — only the
    // last visible step (Financial Info, or Deliverables when the project
    // type isn't "Project") actually submits the form.
    async handlePrimaryAction() {
      const stepErrors = this.activeTab === 'financial' ? this.validateFinancialStep() : this.validateDetailsStep()

      if (this.activeTab === 'deliverables') {
        this.errors = {}
      } else if (Object.keys(stepErrors).length) {
        this.errors = stepErrors
        return
      } else {
        this.errors = {}
      }

      if (!this.isLastStep) {
        this.activeTab = this.steps[this.currentStepIndex + 1].key
        return
      }

      await this.submit()
    },

    async submit() {
      const errors = this.validate()
      if (Object.keys(errors).length) {
        this.errors = errors
        const financialKeys = ['po_value', 'po_vat', 'po_ait', 'budget', 'val_type', 'ait_type']
        this.activeTab = financialKeys.some((k) => errors[k]) ? 'financial' : 'details'
        return
      }

      this.submitting = true
      this.errors = {}
      try {
        const employeeIds = this.assignedEmployee.map((e) => e.id)
        const payload = {
          ...this.project,
          // A never-touched deliverable stays in the array as the blank
          // default row ({ delivery_type: '', ... }) — drop it so leaving
          // the Deliverables step untouched submits [] instead of one
          // empty-string entry.
          deliverables: JSON.stringify(PROJECT_DELIVERABLES ? this.project.deliverables.filter((d) => d.delivery_type && d.delivery_type.trim() !== '') : []),
          installments: JSON.stringify(PROJECT_DELIVERABLES ? this.serializeInstallments() : []),
        }
        if (!payload.client_ids) delete payload.client_ids

        const res = await this.$store.dispatch('project/updateProject', {
          id: this.$route.params.id,
          project: payload,
          employee: employeeIds,
        })

        if (res?.code === 200) {
          this.toast?.success(res?.response || 'Project updated.')
          this.$router.push({ name: 'ProjectList' })
        } else {
          this.toast?.error(res?.response || 'Failed to update project.')
        }
      } catch (err) {
        this.toast?.error(apiErrorMessage(err, 'Failed to update project.'))
      } finally {
        this.submitting = false
      }
    },
  },
}
</script>

<style scoped>
/* DatePicker's own trigger button is inline-flex with just a min-width, so
   two of them side by side (Start Date / Deadline, or in the installment
   row) don't stretch to fill their column like every other
   .form-input/.form-select does — force it to, scoped to this form only. */
.wizard-card :deep(.dp),
.wizard-card :deep(.dp-trigger) {
  width: 100%;
}

.wizard-card { padding-top: 28px; }

/* ── Step wizard track (numbered circles + connecting lines) ─────────────── */
.step-track {
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 798px;
  margin: 0 auto 20px;
}
.step-circle {
  flex-shrink: 0;
  width: 41px;
  height: 41px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 500;
  cursor: pointer;
  background: #E9EFFF;
  border: 1px solid #CFD4FF;
  color: #573FE0;
  transition: background-color .15s, border-color .15s;
}
.step-circle--current { border: 1.5px solid #573FE0; }
.step-circle--done { background: #573FE0; border: none; color: #fff; font-size: 18px; }
.step-line {
  flex: 1 0 0;
  height: 2px;
  background: #CFD4FF;
  margin: 0 -1px;
}
.step-line--done { background: #573FE0; }

.step-heading { width: 100%; }
.step-heading__text { font-size: 18px; font-weight: 500; color: #272727; margin: 0 0 12px; }
.step-heading__divider { border: none; border-top: 1px solid #DCDCDC; margin: 0 0 24px; }

.step-panel { width: 100%; }

/* ── Step 1: Project Title/Type/Client stacked next to a full-height
   Project Description textarea ───────────────────────────────────────────── */
.details-grid {
  display: flex;
  gap: 32px;
  align-items: stretch;
  width: 100%;
}
.details-grid__col { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.form-group--fill { flex: 1; }
.details-textarea { flex: 1; min-height: 180px; resize: vertical; }

.input-prefix-group { display: flex; gap: 6px; }
.input-prefix-group__prefix {
  flex-shrink: 0; width: 44px; height: 40px;
  display: flex; align-items: center; justify-content: center;
  background: #F9F9F9; border: 1px solid #DCDCDC; border-radius: 8px;
  color: #888889; font-size: 12px;
}

@media (max-width: 900px) {
  .details-grid { flex-direction: column; }
}

.form-row--3 { grid-template-columns: repeat(3, 1fr); }

.deliverable-card {
  background: #F9F9F9;
  border: 1px solid #DCDCDC;
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 14px;
}
.deliverable-card__subheading { font-size: 15px; font-weight: 600; color: #272727; margin: 4px 0 0; }
.deliverable-card__divider {
  border: none;
  border-top: 1px solid #DCDCDC;
  margin: 12px 0;
}

.deliverable-row { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
.deliverable-row__index-wrap { display: flex; flex-direction: column; gap: 6px; flex-shrink: 0; }
.deliverable-row__index-spacer { font-size: 0.8rem; visibility: hidden; }
.deliverable-row__index {
  width: 44px; height: 40px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  background: #fff; border: 1px solid #DCDCDC; color: #888889; font-size: 12px;
}

/* Mobile: stack Delivery Type/#Milestone and each phase row's index/fields
   instead of squeezing them all into one horizontal row. */
@media (max-width: 600px) {
  .deliverable-card__type-row { flex-direction: column; align-items: stretch; }
  .deliverable-row { flex-direction: column; align-items: stretch; gap: 8px; }
  .deliverable-row__index-wrap { flex-direction: row; align-items: center; gap: 8px; }
  .deliverable-row__index-spacer { display: none; }
  .deliverable-row__index { width: auto; height: auto; padding: 3px 10px; }
}

/* ── Financial Info: Installments header toggle ───────────────────────────── */
.installments { margin-top: 12px; width: 100%; }
.installments__header { display: flex; align-items: center; gap: 12px; }
.installments__title { font-size: 18px; font-weight: 500; color: #272727; margin: 0; }
.installments__divider { border: none; border-top: 1px solid #DCDCDC; margin: 12px 0 16px; }

/* Installment rows auto-derived 1:1 from deliverable phases — flat stacked
   groups (matches Figma node 742-29834), not individually add/removable
   cards like the old manual "Generate" flow. */
.installment-group { margin-bottom: 24px; }
.installment-group:last-child { margin-bottom: 0; }

.toggle-switch {
  width: 32px; height: 16px; padding: 2px; flex-shrink: 0;
  border: none; border-radius: 999px; background: #CFD4FF;
  display: flex; align-items: center; cursor: pointer;
  transition: background-color .15s;
}
.toggle-switch__thumb {
  width: 12px; height: 12px; border-radius: 50%; background: #fff;
  transition: transform .15s;
}
.toggle-switch--on { background: #573FE0; }
.toggle-switch--on .toggle-switch__thumb { transform: translateX(16px); }

/* ── Footer actions: Discard (danger) far left, primary Continue/Submit
   far right, matching the Figma layout (crud.css's .form-actions default
   is justify-end, both on the right) ─────────────────────────────────────── */
.form-actions--wizard { justify-content: space-between; margin-top: 8px; }
.btn--discard { background: #DB3545; border-color: #DB3545; color: #F9F9F9; }
.btn--discard:hover { background: #BF0022; border-color: #BF0022; color: #F9F9F9; }
</style>
