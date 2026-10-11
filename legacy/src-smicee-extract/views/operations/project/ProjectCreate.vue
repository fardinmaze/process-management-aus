<template>
<div class="page">
    <div class="page-header">
      <h1 class="page-title">Projects Create</h1>
      <button type="button" class="btn btn--ghost btn--sm" @click="goBack">
        <i class="ri-arrow-left-line" /> Back
      </button>
    </div>

    <form class="form-card wizard-card" @submit.prevent="handlePrimaryAction">
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
              <select v-model="projectCategory" class="form-select">
                <option :value="null">Select Here</option>
                <option v-for="t in projectTypeOptions" :key="t.id" :value="t">{{ t.title }}</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Board Template</label>
              <select v-model="labelTemplateId" class="form-select">
                <option :value="null">No template (start with an empty board)</option>
                <option v-for="t in taskLabelTemplates" :key="t.id" :value="t.id">{{ t.title }} ({{ t.labels.join(', ') }})</option>
              </select>
              <span class="form-hint">
                Stamps a preset list of task board columns onto this project. This is a one-time copy —
                <button type="button" class="bg-transparent border-none p-0 text-brand-600 underline cursor-pointer" @click="showNewTemplateForm = !showNewTemplateForm">
                  {{ showNewTemplateForm ? 'cancel' : '+ create a new template' }}
                </button>
                or <router-link :to="{ name: 'TaskLabelTemplateList' }" class="text-brand-600 underline">manage all templates</router-link>.
              </span>
              <div v-if="showNewTemplateForm" class="flex flex-col gap-2 mt-2 p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <input v-model.trim="newTemplate.title" type="text" class="form-input" placeholder="Template title (e.g. Standard Dev Board)" />
                <input v-model.trim="newTemplate.labels" type="text" class="form-input" placeholder="Comma-separated columns (e.g. To Do, In Progress, Done)" />
                <button type="button" class="btn btn--primary btn--sm max-w-fit" :disabled="creatingTemplate" @click="createTemplate">
                  {{ creatingTemplate ? 'Saving…' : 'Save Template' }}
                </button>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Company <span class="required">*</span></label>
              <select v-model="project.company" class="form-select" :class="{ 'form-input--error': errors.company }" @change="onCompanyChange">
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
          <span class="form-hint">Whoever creates this project will be set as the team lead. This can be changed later.</span>
        </div>

        <div class="form-group">
          <label class="form-label">Attach Documents</label>

          <label
            class="upload-box"
            :class="{ 'upload-box--dragging': dragging }"
            @dragover.prevent="dragging = true"
            @dragleave.prevent="dragging = false"
            @drop.prevent="onFileDrop"
          >
            <input ref="fileInput" type="file" class="sr-only" @change="onFileChange" />

            <template v-if="project.project_attachment">
              <i class="ri-file-text-line upload-box__icon" />
              <div class="upload-box__file">
                <span class="upload-box__filename">{{ project.project_attachment.name }}</span>
                <span class="upload-box__filesize">{{ formatFileSize(project.project_attachment.size) }}</span>
              </div>
              <button type="button" class="upload-box__remove" title="Remove" @click.prevent.stop="clearFile">
                <i class="ri-close-line" />
              </button>
            </template>
            <template v-else>
              <i class="ri-upload-cloud-2-line upload-box__icon" />
              <span class="upload-box__text"><strong>Click to Upload</strong> or Drag and Drop</span>
            </template>
          </label>
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
                <!-- <span class="deliverable-row__hint">Use comma "," to separate multiple items</span> -->
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
          {{ submitting ? 'Creating…' : primaryLabel }}
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
    status:      'PENDING',
    project_attachment: null,
    po_value:    null,
    po_vat:      null,
    po_ait:      null,
    budget:      null,
    val_type:    'inclusive',
    ait_type:    'inclusive',
    client_ids:  null,
    company:     null,
    deliverables: [{ delivery_type: '', milestone_count: null, details: [{ expected_deliverable: '', due_date: '' }] }],
    installments: [],
  }
}

// Ported from the legacy Create Project page in task.txt. Dropped the
// vue-multiselect/vue-select/vue2-dropzone/moment/sweetalert2 dependencies
// in favor of this project's own MultiSelect/DatePicker components, native
// file/multi-selects, and toast — same fields and validation rules
// otherwise. Financial Info (PO value/VAT/AIT, installments) only applies
// when the selected project type is "Project" (case-insensitive), matching
// `projectCategory?.title === 'PROJECT'` in the legacy script.
//
// The form is presented as a 3-step wizard (Figma node 739-14775/15137/15491):
// Project Details → Deliverables → Financial Info (the last step only exists
// when isProjectCategory is true). Each step's own "Create & Continue" click
// validates just that step and advances; the last step actually submits.
export default {
  name: 'ProjectCreateView',
  components: { DatePicker, MultiSelect },
  inject: ['toast'],

  data() {
    return {
      PROJECT_DELIVERABLES,
      project: blankProject(),
      projectCategory: null,
      assignedEmployee: [],
      activeTab: 'details',
      priorities: PRIORITIES,
      statuses: STATUSES,
      valTypeOptions: VAT_TYPES,
      showInstallmentInput: false,
      dragging: false,
      errors: {},
      submitting: false,

      // Board template (task.txt Part 1) — stamped onto the project as a
      // one-time copy of labels on create; `null` means no template,
      // matching the backend's "missing → zero columns" behavior.
      labelTemplateId: null,
      showNewTemplateForm: false,
      newTemplate: { title: '', labels: '' },
      creatingTemplate: false,
    }
  },

  computed: {
    projectTypeOptions() { return this.$store.getters['projectType/projectType'] || [] },
    employeeOptions()    { return this.$store.getters['employee/employeeList'] || [] },
    companies()          { return this.$store.getters['client/company'] || [] },
    clientsByCompany()   { return this.$store.getters['client/clientByCompany'] || [] },
    taskLabelTemplates() { return this.$store.getters['task/taskLabelTemplates'] || [] },

    isProjectCategory() {
      return (this.projectCategory?.title || '').trim().toUpperCase() === 'PROJECT'
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
      return this.isLastStep ? 'Create Project' : 'Create & Continue'
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

    // PO value minus whatever VAT/AIT percentage is marked "inclusive" of it.
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

    'project.company'() {
      this.project.client_ids = null
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
    this.$store.dispatch('task/fetchTaskLabelTemplates')
  },

  methods: {
    capitalize,

    // ── Board template (task.txt Part 1) ─────────────────────────────────
    async createTemplate() {
      const title = this.newTemplate.title.trim()
      const labels = this.newTemplate.labels.split(',').map((l) => l.trim()).filter(Boolean)
      if (!title || !labels.length) {
        this.toast?.error('Enter a template title and at least one label.')
        return
      }
      this.creatingTemplate = true
      try {
        const res = await this.$store.dispatch('task/createTaskLabelTemplate', { title, labels })
        if (res?.code === 200) {
          this.toast?.success(res?.response || 'Template created.')
          this.labelTemplateId = res.data?.id ?? null
          this.showNewTemplateForm = false
          this.newTemplate = { title: '', labels: '' }
        } else {
          this.toast?.error(res?.response || 'Failed to create template.')
        }
      } catch (err) {
        this.toast?.error(apiErrorMessage(err, 'Failed to create template.'))
      } finally {
        this.creatingTemplate = false
      }
    },

    goBack() {
      goBackTo(this.$router, { name: 'ProjectList' })
    },

    goToStep(key) {
      this.activeTab = key
    },

    onCompanyChange() {
      if (this.project.company) {
        this.$store.dispatch('client/fetchClientByCompany', this.project.company)
      }
    },

    onStartDateChange(val) {
      this.project.start_date = val
      if (this.project.deadline && this.project.deadline < val) {
        this.project.deadline = ''
      }
    },

    onFileChange(e) {
      this.project.project_attachment = e.target.files[0] || null
    },

    onFileDrop(e) {
      this.dragging = false
      this.project.project_attachment = e.dataTransfer.files[0] || null
    },

    clearFile() {
      this.project.project_attachment = null
      if (this.$refs.fileInput) this.$refs.fileInput.value = ''
    },

    formatFileSize(bytes) {
      if (!bytes) return '0 B'
      const units = ['B', 'KB', 'MB', 'GB']
      const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
      return `${(bytes / 1024 ** i).toFixed(i ? 1 : 0)} ${units[i]}`
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
    // percentages the user has already entered.
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
        const payload = {
          ...this.project,
          category: this.projectCategory?.id ?? null,
          label_template: this.labelTemplateId,
          // A never-touched deliverable stays in the array as the blank
          // default row ({ delivery_type: '', ... }) — drop it so leaving
          // the Deliverables step untouched submits [] instead of one
          // empty-string entry.
          deliverables: JSON.stringify(PROJECT_DELIVERABLES ? this.project.deliverables.filter((d) => d.delivery_type && d.delivery_type.trim() !== '') : []),
          installments: JSON.stringify(PROJECT_DELIVERABLES ? this.serializeInstallments() : []),
        }
        if (!payload.client_ids) delete payload.client_ids
        const employeeIds = this.assignedEmployee.map((e) => e.id)

        const res = await this.$store.dispatch('project/addProject', {
          project: payload,
          employee: employeeIds,
        })

        if (res?.code === 200) {
          this.toast?.success(res?.response || 'Project created.')
          this.$router.push({ name: 'ProjectList' })
        } else {
          this.toast?.error(res?.response || 'Failed to create project.')
        }
      } catch (err) {
        this.toast?.error(apiErrorMessage(err, 'Failed to create project.'))
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
.deliverable-row__hint { font-size: 10px; color: #8180F7; margin-top: 4px; }

/* Mobile: stack Delivery Type/#Milestone and each phase row's index/fields
   instead of squeezing them all into one horizontal row. */
@media (max-width: 600px) {
  .deliverable-card__type-row { flex-direction: column; align-items: stretch; }
  .deliverable-row { flex-direction: column; align-items: stretch; gap: 8px; }
  .deliverable-row__index-wrap { flex-direction: row; align-items: center; gap: 8px; }
  .deliverable-row__index-spacer { display: none; }
  .deliverable-row__index { width: auto; height: auto; padding: 3px 10px; }
}

.form-hint { font-size: 11px; color: #A3A3A4; margin-top: 4px; display: block; }

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

.upload-box {
  display: flex; align-items: center; gap: 10px;
  border: 1.5px dashed #DCDCDC; border-radius: 10px;
  padding: 14px 16px; cursor: pointer; background: #F9F9F9;
  transition: border-color .15s, background-color .15s;
}
.upload-box:hover, .upload-box--dragging { border-color: #573FE0; background: #F3F1FF; }
.upload-box__icon { font-size: 22px; color: #573FE0; flex-shrink: 0; }
.upload-box__text { font-size: 13px; color: #6E6E6F; }
.upload-box__text strong { color: #272727; font-weight: 600; }
.upload-box__file { display: flex; flex-direction: column; min-width: 0; }
.upload-box__filename { font-size: 13px; font-weight: 600; color: #272727; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.upload-box__filesize { font-size: 11px; color: #A3A3A4; }
.upload-box__remove {
  margin-left: auto; flex-shrink: 0; border: none; background: transparent;
  color: #A3A3A4; font-size: 16px; padding: 4px; border-radius: 6px; cursor: pointer;
  transition: background-color .15s, color .15s;
}
.upload-box__remove:hover { background: #FFDEDC; color: #BF0022; }

/* ── Footer actions: Discard (danger) far left, primary Continue/Submit
   far right, matching the Figma layout (crud.css's .form-actions default
   is justify-end, both on the right) ─────────────────────────────────────── */
.form-actions--wizard { justify-content: space-between; margin-top: 8px; }
.btn--discard { background: #DB3545; border-color: #DB3545; color: #F9F9F9; }
.btn--discard:hover { background: #BF0022; border-color: #BF0022; color: #F9F9F9; }
</style>
