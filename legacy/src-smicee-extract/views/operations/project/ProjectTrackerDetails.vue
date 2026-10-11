<template>
<div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Project Overview</h1>
        <p class="page-subtitle">Progress, financials and requisition/invoice summary</p>
      </div>
      <button type="button" class="btn btn--ghost" @click="goBack">
        <i class="ri-arrow-left-line" /> Back
      </button>
    </div>

    <div v-if="loading" class="page-loader text-muted">Loading…</div>
    <div v-else-if="error" class="empty-state">
      <i class="ri-error-warning-line" />
      <h3>Couldn't load this project</h3>
      <p>Please try again.</p>
    </div>

    <template v-else-if="details">
      <!-- Header card -->
      <div class="card p-5">
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <span class="flex-1 min-w-0 truncate text-[20px] font-semibold text-brand-600">{{ details.title }}</span>
          <span class="status-pill" :class="statusStyle(details.status)">{{ capitalize(details.status) }}</span>
        </div>
        <p class="text-[13px] leading-relaxed text-typo-600 mt-2 mb-0">{{ stripHtml(details.details) }}</p>

        <hr class="my-4 border-typo-100" />

        <div class="flex flex-col gap-2 text-[12px]">
          <div class="flex items-center justify-between gap-2">
            <span class="text-typo-500"><i class="ri-folder-line mr-1.5" />Project Category:</span>
            <span class="info-pill">{{ details.category?.title || 'N/A' }}</span>
          </div>
          <div class="flex items-center justify-between gap-2">
            <span class="text-typo-500"><i class="ri-calendar-line mr-1.5" />Start Date:</span>
            <span class="text-typo-700 font-medium">{{ formatDate(details.start_date) }}</span>
          </div>
          <div class="flex items-center justify-between gap-2">
            <span class="text-typo-500"><i class="ri-time-line mr-1.5" />Deadline:</span>
            <span class="text-typo-700 font-medium">{{ formatDate(details.deadline) }}</span>
          </div>
          <div class="flex items-center justify-between gap-2">
            <span class="text-typo-500"><i class="ri-user-line mr-1.5" />Project Lead:</span>
            <span v-if="projectLead" class="flex items-center gap-2">
              <img v-if="leadPhotoUrl" class="w-6 h-6 rounded-full object-cover" :src="leadPhotoUrl" :alt="projectLead.user_name" />
              <span class="text-typo-700 font-medium">{{ projectLead.user_name }}</span>
            </span>
            <span v-else class="text-typo-500">N/A</span>
          </div>
        </div>
      </div>

      <!-- Task stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Tasks" :value="Number(details.task) || 0" icon="ri-list-check-2" color="#573FE0" />
        <StatCard
          label="Resolved Tasks" :value="Number(details.resolved) || 0" icon="ri-checkbox-circle-line" color="#28A645"
          :trend="calculatePercentage(details.resolved, details.task)"
        />
        <StatCard label="Remaining Tasks" :value="Number(details.remaining) || 0" icon="ri-error-warning-line" color="#CE9700" />
      </div>

      <!-- Financial Summary -->
      <div class="card">
        <div class="card__header">
          <h3 class="card__title"><i class="ri-money-dollar-circle-line mr-1.5" />Financial Summary</h3>
        </div>
        <div class="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="mini-stat">
            <div class="mini-stat__icon" style="background:#E9EFFF;color:#573FE0"><i class="ri-file-text-line" /></div>
            <div class="min-w-0">
              <span class="mini-stat__label">PO Value</span>
              <span class="mini-stat__value">৳{{ formatNumber(details.po_value) }}</span>
            </div>
          </div>
          <div class="mini-stat">
            <div class="mini-stat__icon" style="background:#FFDEDC;color:#DB3545"><i class="ri-subtract-line" /></div>
            <div class="min-w-0">
              <span class="mini-stat__label">VAT ({{ details.po_vat || 0 }}%)</span>
              <span class="mini-stat__value text-accent-600">৳{{ formatNumber(vatAmount) }}</span>
            </div>
          </div>
          <div class="mini-stat">
            <div class="mini-stat__icon" style="background:#FFDEDC;color:#DB3545"><i class="ri-subtract-line" /></div>
            <div class="min-w-0">
              <span class="mini-stat__label">AIT ({{ details.po_ait || 0 }}%)</span>
              <span class="mini-stat__value text-accent-600">৳{{ formatNumber(aitAmount) }}</span>
            </div>
          </div>
          <div class="mini-stat">
            <div class="mini-stat__icon" style="background:#EBFFED;color:#28A645"><i class="ri-line-chart-line" /></div>
            <div class="min-w-0">
              <span class="mini-stat__label">Net Amount</span>
              <span class="mini-stat__value text-secondary-600">৳{{ formatNumber(netAmount) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Requisition Summary -->
      <div class="card">
        <button type="button" class="card__header card__header--btn" @click="openRequisitionModal">
          <h3 class="card__title"><i class="ri-shopping-cart-line mr-1.5" />Requisition Summary</h3>
          <i class="ri-arrow-right-s-line text-slate-400" />
        </button>
        <div class="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="mini-stat">
            <div class="mini-stat__icon" style="background:#E9EFFF;color:#573FE0"><i class="ri-money-dollar-circle-line" /></div>
            <div class="min-w-0">
              <span class="mini-stat__label">Total Budget</span>
              <span class="mini-stat__value">৳{{ formatNumber(details.budget) }}</span>
            </div>
          </div>
          <div class="mini-stat">
            <div class="mini-stat__icon" style="background:#CDEBFF;color:#0099FF"><i class="ri-arrow-down-line" /></div>
            <div class="min-w-0">
              <span class="mini-stat__label">Total Expense</span>
              <span class="mini-stat__value" style="color:#0099FF">৳{{ formatNumber(details.requisition?.total) }}</span>
            </div>
          </div>
          <div class="mini-stat">
            <div class="mini-stat__icon" style="background:#EBFFED;color:#28A645"><i class="ri-checkbox-circle-line" /></div>
            <div class="min-w-0">
              <span class="mini-stat__label">Total Paid</span>
              <span class="mini-stat__value text-secondary-600">৳{{ formatNumber(details.requisition?.paid) }}</span>
            </div>
          </div>
          <div class="mini-stat">
            <div class="mini-stat__icon" style="background:#FFDEDC;color:#DB3545"><i class="ri-time-line" /></div>
            <div class="min-w-0">
              <span class="mini-stat__label">Total Due</span>
              <span class="mini-stat__value text-accent-600">৳{{ formatNumber(details.requisition?.due) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Invoice Summary -->
      <div class="card">
        <button type="button" class="card__header card__header--btn" @click="openInvoiceModal">
          <h3 class="card__title"><i class="ri-file-list-3-line mr-1.5" />Invoice Summary</h3>
          <i class="ri-arrow-right-s-line text-slate-400" />
        </button>
        <div class="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div class="mini-stat">
            <div class="mini-stat__icon" style="background:#E9EFFF;color:#573FE0"><i class="ri-file-text-line" /></div>
            <div class="min-w-0">
              <span class="mini-stat__label">Total Invoice</span>
              <span class="mini-stat__value">৳{{ formatNumber(details.invoice?.total) }}</span>
            </div>
          </div>
          <div class="mini-stat">
            <div class="mini-stat__icon" style="background:#EBFFED;color:#28A645"><i class="ri-checkbox-circle-line" /></div>
            <div class="min-w-0">
              <span class="mini-stat__label">Total Paid</span>
              <span class="mini-stat__value text-secondary-600">৳{{ formatNumber(details.invoice?.paid) }}</span>
            </div>
          </div>
          <div class="mini-stat">
            <div class="mini-stat__icon" style="background:#FFDEDC;color:#DB3545"><i class="ri-time-line" /></div>
            <div class="min-w-0">
              <span class="mini-stat__label">Total Due</span>
              <span class="mini-stat__value text-accent-600">৳{{ formatNumber(details.invoice?.due) }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Requisition modal -->
    <teleport to="body">
      <div v-if="showRequisitionModal" class="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[1000] p-4 backdrop-blur-[2px]" @click.self="showRequisitionModal = false">
        <div class="bg-white rounded-[14px] w-full max-w-[900px] max-h-[85vh] shadow-2xl flex flex-col">
          <div class="flex items-center justify-between px-5 pt-[18px] pb-3.5 border-b border-slate-100 shrink-0">
            <h3 class="text-base font-bold text-slate-800 m-0">Requisitions</h3>
            <button class="bg-transparent border-none text-xl text-slate-400 cursor-pointer p-0.5 rounded-md leading-none flex hover:text-slate-800 hover:bg-slate-100" @click="showRequisitionModal = false">
              <i class="ri-close-line" />
            </button>
          </div>
          <div class="p-5 overflow-y-auto">
            <div v-if="!requisitionList.length" class="empty-state">
              <i class="ri-shopping-cart-line" />
              <h3>No requisitions</h3>
              <p>No requisitions have been raised for this project.</p>
            </div>
            <div v-else class="table-wrap">
              <table class="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Requisition ID</th>
                    <th>Raised By</th>
                    <th>Approved By</th>
                    <th>Status</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(r, idx) in requisitionList" :key="r.id ?? idx">
                    <td>{{ idx + 1 }}</td>
                    <td>
                      <span class="title-link">{{ r.requisition_id }}</span>
                    </td>
                    <td>{{ r.raised_by?.username ?? r.raised_by?.full_name ?? '—' }}</td>
                    <td>{{ r.approved_by?.full_name ?? 'N/A' }}</td>
                    <td><span class="badge" :class="`badge--${requisitionStatusColor(r.status)}`">{{ r.status }}</span></td>
                    <td>
                      <div class="flex flex-col text-[11px]">
                        <span class="font-semibold">Total: {{ formatNumber(r.grand_total) }}</span>
                        <span class="text-secondary-600">Paid: {{ formatNumber(r.paid_amount) }}</span>
                        <span class="text-accent-600">Due: {{ formatNumber(r.due_amount) }}</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </teleport>

    <!-- Invoice modal -->
    <teleport to="body">
      <div v-if="showInvoiceModal" class="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[1000] p-4 backdrop-blur-[2px]" @click.self="showInvoiceModal = false">
        <div class="bg-white rounded-[14px] w-full max-w-[900px] max-h-[85vh] shadow-2xl flex flex-col">
          <div class="flex items-center justify-between px-5 pt-[18px] pb-3.5 border-b border-slate-100 shrink-0">
            <h3 class="text-base font-bold text-slate-800 m-0">Invoices</h3>
            <button class="bg-transparent border-none text-xl text-slate-400 cursor-pointer p-0.5 rounded-md leading-none flex hover:text-slate-800 hover:bg-slate-100" @click="showInvoiceModal = false">
              <i class="ri-close-line" />
            </button>
          </div>
          <div class="p-5 overflow-y-auto">
            <div v-if="!invoiceList.length" class="empty-state">
              <i class="ri-file-list-3-line" />
              <h3>No invoices</h3>
              <p>No invoices have been raised for this project.</p>
            </div>
            <div v-else class="table-wrap">
              <table class="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Invoice ID</th>
                    <th>Invoice Date</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(inv, idx) in invoiceList" :key="inv.id ?? idx">
                    <td>{{ idx + 1 }}</td>
                    <td>
                      <span class="title-link">{{ inv.invoice_id }}</span>
                    </td>
                    <td>{{ formatDate(inv.invoice_date) }}</td>
                    <td>{{ formatDate(inv.due_date) }}</td>
                    <td><span class="badge" :class="`badge--${invoiceStatusColor(inv.status)}`">{{ inv.status }}</span></td>
                    <td>
                      <div class="flex flex-col text-[11px]">
                        <span class="font-semibold">Total: {{ formatNumber(inv.subtotal) }} {{ inv.currency }}</span>
                        <span class="text-secondary-600">Paid: {{ formatNumber(inv.paid_amount) }} {{ inv.currency }}</span>
                        <span class="text-accent-600">Due: {{ formatNumber(inv.due_amount) }} {{ inv.currency }}</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script>
import { formatDate, formatNumber, capitalize, stripHtml, goBack as goBackTo } from '@/utils/helpers'
import { API_HOST } from '@/utils/apiPaths'
import StatCard from '@/components/common/StatCard.vue'

// Same status colors as ProjectList.vue/ProjectEdit.vue.
const PROJECT_STATUS_STYLES = {
  APPROVED:  'bg-[#4b8dee] text-white',
  PENDING:   'bg-[#eaa14d] text-white',
  WORKING:   'bg-brand-400 text-white',
  POSTPONED: 'bg-[#ed5b48] text-white',
  PAUSED:    'bg-warning-300 text-warning-900',
  COMPLETED: 'bg-secondary-400 text-white',
}
const REQUISITION_STATUS_COLORS = {
  PENDING: 'info', APPROVED: 'success', DUE: 'warning',
  'PARTIALLY-PAID': 'info', REJECTED: 'danger',
}
const INVOICE_STATUS_COLORS = {
  'FULLY-PAID': 'success', DUE: 'warning', 'PARTIALLY-PAID': 'info',
}

// Ported from the legacy "Project Overview" page in task.txt — same
// `project/fetchProjectTrackingDetails` / `fetchRequisitionByProject` /
// `fetchInvoiceByProject` actions (all already in src/store/project.js),
// same PO VAT/AIT/Net Amount math. Restyled to this app's own design
// system (`.card`/`.card__header`, StatCard, the mini-stat tile pattern
// from CrmLeadList.vue, brand/typo/accent/secondary tokens) instead of the
// legacy gradient headers/custom colors. Requisition/Invoice summaries
// open a modal with the full list on click, matching the legacy behavior.
export default {
  name: 'ProjectTrackerDetailsView',
  components: { StatCard },

  data() {
    return {
      showRequisitionModal: false,
      showInvoiceModal: false,
    }
  },

  computed: {
    details() { return this.$store.getters['project/projectTrackingDetail'] },
    loading() { return this.$store.getters['project/trackingDetailLoading'] },
    error()   { return this.$store.getters['project/trackingDetailError'] },

    requisitionList() { return this.$store.getters['project/requisitionByProject'] || [] },
    invoiceList()     { return this.$store.getters['project/invoiceByProject'] || [] },

    projectLead() {
      return (this.details?.teammates || []).find((t) => t.project_lead) || null
    },

    leadPhotoUrl() {
      const photo = this.projectLead?.user_id?.additional_info?.photo
      if (!photo) return ''
      return photo.startsWith('http') ? photo : API_HOST + photo
    },

    basePrice() {
      if (!this.details?.po_value || !this.details?.val_type || !this.details?.ait_type) return 0
      const total = Number(this.details.po_value)
      const po_vat = Number(this.details.po_vat || 0)
      const po_ait = Number(this.details.po_ait || 0)
      let divisor = 1
      if (this.details.val_type === 'inclusive') divisor += po_vat / 100
      if (this.details.ait_type === 'inclusive') divisor += po_ait / 100
      return Math.round((total / divisor + Number.EPSILON) * 100) / 100
    },

    vatAmount() {
      if (!this.details?.po_vat || !this.details?.val_type || !this.details?.po_value) return 0
      return Math.round((this.basePrice * Number(this.details.po_vat) / 100 + Number.EPSILON) * 100) / 100
    },

    aitAmount() {
      if (!this.details?.po_ait || !this.details?.ait_type || !this.details?.po_value) return 0
      return Math.round((this.basePrice * Number(this.details.po_ait) / 100 + Number.EPSILON) * 100) / 100
    },

    netAmount() {
      if (!this.details?.po_value) return 0
      const poValue = Number(this.details.po_value)
      const vatRate = this.details.val_type === 'inclusive' ? Number(this.details.po_vat || 0) : 0
      const aitRate = this.details.ait_type === 'inclusive' ? Number(this.details.po_ait || 0) : 0
      const totalRate = vatRate + aitRate
      if (totalRate === 0) return Math.round((poValue + Number.EPSILON) * 100) / 100
      return Math.round((poValue / (1 + totalRate / 100) + Number.EPSILON) * 100) / 100
    },
  },

  created() {
    this.$store.dispatch('project/fetchProjectTrackingDetails', this.$route.params.id)
  },

  methods: {
    formatDate,
    formatNumber,
    capitalize,
    stripHtml,

    goBack() {
      goBackTo(this.$router, { name: 'ProjectTrackerList' })
    },

    statusStyle(status) { return PROJECT_STATUS_STYLES[status] ?? 'bg-typo-100 text-typo-700' },
    requisitionStatusColor(status) { return REQUISITION_STATUS_COLORS[status] ?? 'default' },
    invoiceStatusColor(status) { return INVOICE_STATUS_COLORS[status] ?? 'default' },

    calculatePercentage(value, total) {
      if (!total) return 0
      return Math.round((Number(value) / Number(total)) * 100)
    },

    openRequisitionModal() {
      this.showRequisitionModal = true
      this.$store.dispatch('project/fetchRequisitionByProject', this.$route.params.id)
    },

    openInvoiceModal() {
      this.showInvoiceModal = true
      this.$store.dispatch('project/fetchInvoiceByProject', this.$route.params.id)
    },
  },
}
</script>

<style scoped>
.status-pill {
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 6px 16px;
  border-radius: 36px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.info-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  border-radius: 36px;
  background: #F9F9F9;
  border: 1px solid #E9EFFF;
  color: #4010BD;
  white-space: nowrap;
}

/* Card header as a plain button (Requisition/Invoice summaries) — same
   look as .card__header, just clickable. */
.card__header--btn {
  width: 100%;
  appearance: none;
  background: transparent;
  border: none;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: background-color .15s;
}
.card__header--btn:hover { background: #F9F9F9; }

/* Mini stat tile — same pattern as CrmLeadList.vue's "mini stats" row. */
.mini-stat {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 12px 16px;
}
.mini-stat__icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}
.mini-stat__label { display: block; font-size: 11.5px; color: #64748b; font-weight: 500; }
.mini-stat__value { display: block; font-size: 16px; font-weight: 800; color: #272727; line-height: 1.3; }
</style>
