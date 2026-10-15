<template>
  <div>
    <div v-if="loading" class="page-loader text-muted">Loading…</div>

    <div v-else-if="list.length" class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>#NO</th>
            <th>EOD ID</th>
            <th>Report</th>
            <th>Status</th>
            <th>Approved By</th>
            <th>Reported To</th>
            <th style="width:100px">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in list" :key="row.id">
            <td>{{ rowNumber(idx) }}</td>

            <td>
            
              <div class="space-y-1 min-w-[80px]">
                  <router-link :to="{ name: detailsRouteName, params: { id: row.id } }" class="title-link "># {{ row.eod_id }}</router-link>
                <p class="text-typo-600 text-[12px] font-medium">{{ row.reported_by.full_name }}</p>
              <p class="text-muted text-sm">{{ formatDate(row.created_date) }}</p>
              </div>
            </td>
            <td>
              {{ truncate(stripHtml(row.report)) }}
            </td>
            <td>
              <select
                v-if="canManage"
                class="form-select form-select--sm table-status"
                :class="`badge--${statusColor(row.status)}`"
                :value="row.status"
                @change="changeStatus(row, $event.target.value)"
              >
                <option v-for="s in statuses" :key="s" :value="s">{{ statusLabel(s) }}</option>
              </select>
              <span  v-else :class="`text--${statusColor(row.status)}`" class="flex items-center justify-center">
                {{ statusLabel(row.status) }}
              </span>
            </td>

            <td><p>{{ row.status_updated_by?.full_name ?? '-' }}</p></td>
            <td>
              <AvatarStack :members="row.reported_to" />
            </td>
            <td>
              <div class="action-btns">
                <router-link :to="{ name: detailsRouteName, params: { id: row.id } }" class="icon-btn icon-btn--view" title="View">
                  <!-- <i class="ri-eye-line" /> -->
                </router-link>
                <button class="icon-btn icon-btn--chat" title="Reply" @click="openReply(row)">
             
                </button>
                <button v-if="canManage" class="icon-btn icon-btn--delete" title="Delete" @click="confirmDelete(row)">
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="empty-state">
      <i class="ri-file-edit-line" />
      <h3>No EOD reports yet</h3>
      <p>Submit your first end-of-day report.</p>
      <router-link :to="{ name: 'EODCreate' }" class="btn btn--primary">Submit EOD</router-link>
    </div>

    <div v-if="count > 0" class="pagination">
      <Pagination
        :page="page"
        :last-page="lastPage"
        :per-page="perPage"
        @update:page="$emit('update:page', $event)"
        @update:per-page="$emit('update:per-page', $event)"
      />
    </div>

    <ConfirmModal
      v-if="deleteTarget"
      title="Delete EOD"
      message="Are you sure you want to delete this EOD report? This action cannot be undone."
      confirm-label="Delete"
      confirm-variant="danger"
      :loading="deleting"
      @confirm="doDelete"
      @cancel="deleteTarget = null"
    />

    <RecordChatSidebar
      type="EOD"
      :record-id="replyTarget.id"
      v-if="replyTarget"
      :reported-by="reportedBy"
      :assigned-members="assignedMembers"
      :available-members="availableMembers"
      :assigning="referLoading"
      @close="replyTarget = null"
      @assign="assignMember"
      @unassign="unassignMember"
    />
  </div>
</template>

<script>
// Shared table for MyEodList.vue and AdminEODList.vue — same columns/row
// markup for both, they only differ in which store action feeds `list`
// and in their own filter rows. Delete and status-change require the
// `view_eod` permission; without it the status cell falls back to a
// read-only badge and the delete button is hidden.
import { formatDate, truncate, stripHtml }         from '@/utils/helpers'
import { EOD_STATUS_LABELS, EOD_STATUS_COLORS }    from '@/utils/constants'
import { can }                                      from '@/utils/permission'
import ConfirmModal   from '@/components/common/ConfirmModal.vue'
import RecordChatSidebar from '@/components/chat/RecordChatSidebar.vue'
import Pagination     from '@/components/common/Pagination.vue'
import AvatarStack    from '@/components/common/AvatarStack.vue'

export default {
  name: 'EodTable',
  components: { ConfirmModal, RecordChatSidebar, Pagination, AvatarStack },
  inject: ['toast'],

  props: {
    list:     { type: Array,   default: () => [] },
    count:    { type: Number,  default: 0 },
    loading:  { type: Boolean, default: false },
    page:     { type: Number,  required: true },
    perPage:  { type: Number,  required: true },
    lastPage: { type: Number,  required: true },
    detailsRouteName: { type: String, required: true },
    readOnly: {
        type: Boolean,
        default: false
    },
  },

  emits: ['update:page', 'update:per-page', 'reload'],

  data() {
    return {
      statuses:     EOD_STATUS_LABELS,
      deleteTarget: null,
      deleting:     false,
      replyTarget:  null,
    }
  },

  computed: {
    canManage()        { return  !this.readOnly && can('view_eod') },
    referLoading()      { return this.$store.getters['eod/eodReferLoading'] },
    assignedMembers()   { return this.$store.getters['eod/eodDetail']?.reported_to ?? [] },
    reportedBy()        { return this.$store.getters['eod/eodDetail']?.reported_by ?? null },
    availableMembers()  { return this.$store.getters['employee/employeeList'] ?? [] },
  },

  methods: {
    formatDate,
    truncate,
    stripHtml,

    statusLabel(status) { return EOD_STATUS_LABELS[status] ?? status },
    statusColor(status) { return EOD_STATUS_COLORS[status] ?? 'default' },

    // Row number that keeps counting across pages instead of restarting at 1.
    rowNumber(idx) {
      return String((this.page - 1) * this.perPage + idx + 1).padStart(2, '0')
    },

    async changeStatus(row, status) {
      try {
        await this.$store.dispatch('eod/updateEODStatus', {
          id: row.id,
          status_for_change: status,
        })
        this.toast?.success('EOD status updated.')
        this.$emit('reload')
      } catch {
        /* keep previous value on failure */
      }
    },

    confirmDelete(row) {
      this.deleteTarget = row
    },

    async doDelete() {
      this.deleting = true
      try {
        await this.$store.dispatch('eod/deleteEOD', { delete: this.deleteTarget.id })
        this.deleteTarget = null
        this.$emit('reload')
      } finally {
        this.deleting = false
      }
    },

    openReply(row) {
      this.replyTarget = row
      this.$store.dispatch('eod/fetchEODtDetail', row.id)
    },

    async assignMember(memberIds) {
      if (!this.replyTarget) return
      // Sequential, not Promise.all: each call re-fetches eodDetail (detail: true),
      // and firing those refetches concurrently would race.
      for (const memberId of memberIds) {
        await this.$store.dispatch('eod/EODAddRefer', { id: this.replyTarget.id, refer_id: memberId, detail: true })
      }
    },

    unassignMember(memberId) {
      if (!this.replyTarget) return
      this.$store.dispatch('eod/EODDeleteRefer', { id: this.replyTarget.id, refer_id: memberId, detail: true })
    },
  },
}
</script>
