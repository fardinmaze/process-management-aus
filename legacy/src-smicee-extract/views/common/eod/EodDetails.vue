<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">EOD Details</h1>
        <p class="page-subtitle">{{ detail.eod_id }} &middot; {{ formatDate(detail.created_date) }}</p>
      </div>
      <div class="page-header__actions">
        <span class="badge" :class="`badge--${statusColor(detail.status)}`">{{ statusLabel(detail.status) }}</span>
        <button v-if="can('view_eod')" type="button" class="btn btn--ghost btn--sm" @click="statusModalOpen = true">
          <i class="ri-repeat-line" /> Change Status
        </button>
        <button type="button" class="btn btn--ghost" @click="goBack">
          <i class="ri-arrow-left-line" /> Back
        </button>
      </div>
    </div>

    <div v-if="loading" class="card page-loader text-muted">Loading…</div>

    <template v-else>
      <div class="eod-layout">
        <div class="eod-layout__main">
          <div class="eod-card">
            <div class="eod-card__meta">
              <div class="eod-meta-item">
                <p class="eod-meta-item__label">EOD ID</p>
                <p class="eod-meta-item__value">{{ detail.eod_id || '—' }}</p>
              </div>
              <div class="eod-meta-item">
                <p class="eod-meta-item__label">Reported Date</p>
                <p class="eod-meta-item__value">{{ formatDate(detail.created_date) }}</p>
              </div>
            </div>

            <div class="eod-card__divider" />

            <div class="eod-card__people">
              <div class="eod-people-col">
                <p class="eod-people-col__label">Reported by</p>
                <span v-if="detail.reported_by" class="eod-pill">
                  <span class="eod-pill__avatar">
                    <img v-if="photoUrl(detail.reported_by)" :src="photoUrl(detail.reported_by)" :alt="memberName(detail.reported_by)" />
                    <span v-else>{{ getInitials(memberName(detail.reported_by)) }}</span>
                  </span>
                  <span class="eod-pill__name">{{ memberName(detail.reported_by) }}</span>
                </span>
                <p v-else class="text-muted text-sm">—</p>
              </div>

              <div class="eod-people-col eod-people-col--refer">
                <p class="eod-people-col__label">Referred to</p>
                <MemberAssignPicker
                  label=""
                  pill
                  :can-remove = false
                  :assigned-members="detail.reported_to || []"
                  :available-members="availableMembers"
                  :assigning="referLoading"
                  @assign="assignMembers"
                  @unassign="unassignMember"
                />
              </div>
            </div>
          </div>

          <div class="eod-card__panels">
            <div class="eod_listed">
              <div class="card eod-panel">
                <div class="eod-panel__header">
                  <h3 class="eod-panel__title">
                    Completed Tasks <span class="eod-panel__count">{{ detail.completed_tasks?.length || 0 }}</span>
                  </h3>
                </div>
                <div v-if="detail.completed_tasks?.length" class="eod-list">
                  <div v-for="(task, idx) in detail.completed_tasks" :key="task.id ?? idx" class="eod-task">
                    <span class="eod-task__title">{{ idx + 1 }}. {{ task.title || task.subject || task.name }}</span>
                    <div v-if="task.subtasks?.length" class="eod-task__subtasks">
                      <div v-for="sub in task.subtasks" :key="sub.id" class="eod-task__subtask">
                        <i class="ri-corner-down-right-line" /> {{ sub.title }}
                      </div>
                    </div>
                  </div>
                </div>
                <p v-else class="text-muted text-sm">No completed tasks listed.</p>
              </div>

              <div class="card eod-panel">
                <div class="eod-panel__header">
                  <h3 class="eod-panel__title">
                    Completed Tickets <span class="eod-panel__count">{{ detail.completed_tickets?.length || 0 }}</span>
                  </h3>
                </div>
                <ol v-if="detail.completed_tickets?.length" class="eod-list eod-list--ordered">
                  <li v-for="(ticket, idx) in detail.completed_tickets" :key="ticket.id ?? idx" class="eod-ticket">
                    <span class="eod-ticket__link">
                      {{ ticket.subject || ticket.title }}
                    </span>
                  </li>
                </ol>
                <p v-else class="text-muted text-sm">No completed tickets listed.</p>
              </div>
            </div>

            <div class="card eod-panel eod-panel--editor">
              <div class="eod-panel__header">
                <h3 class="eod-panel__title">Report Details</h3>
              </div>
              <div v-if="detail.report" class="rich-text eod-report-body" v-html="detail.report" />
              <p v-else class="text-muted text-sm">—</p>
            </div>
          </div>
        </div>

        <div class="eod-layout__side">
          <button type="button" class="chat-trigger" @click="chatOpen = true">
            <span>Chat History</span>
            <i class="ri-arrow-left-double-line" />
          </button>

          <div class="card p-4 acknowledged-by">
            <div class="eod-panel__header">
              <h3 class="eod-panel__title">Acknowledged by</h3>
            </div>
            <div v-if="acknowledgedMembers.length" class="acknowledged-by__list">
              <span v-for="m in acknowledgedMembers" :key="m.id" class="eod-pill">
                <span class="eod-pill__avatar">
                  <img v-if="photoUrl(m)" :src="photoUrl(m)" :alt="memberName(m)" />
                  <span v-else>{{ getInitials(memberName(m)) }}</span>
                </span>
                <span class="eod-pill__name">{{ memberName(m) }}</span>
              </span>
            </div>
            <p v-else class="text-muted text-sm">Not yet acknowledged.</p>
          </div>

          <ApprovedByTable :rows="approvers" />
        </div>
      </div>
    </template>

    <ChangeStatusModal
      v-if="statusModalOpen"
      title="Change EOD Status"
      label = "Select new status"
      :current-status="detail.status"
      :status-list="statusList"
      :status-labels="statusLabels"
      :status-colors="statusColors"
      :loading="statusUpdating"
      @confirm="changeStatus"
      @cancel="statusModalOpen = false"
    />

    <RecordChatSidebar
      type="EOD"
      :record-id="id"
      v-if="chatOpen"
      :can-remove = false
      :reported-by="detail.reported_by"
      reported-by-label="Reported by"
      :assigned-members="detail.reported_to || []"
      :available-members="availableMembers"
      :assigning="referLoading"
      referred-to-label="Referred to"
      @close="chatOpen = false"
      @assign="assignMembers"
      @unassign="unassignMember"
    />
  </div>
</template>

<script>
import { formatDate, formatDateTime, getInitials, goBack as goBackTo } from '@/utils/helpers'
import { EOD_STATUS, EOD_STATUS_LABELS, EOD_STATUS_COLORS } from '@/utils/constants'
import { API_HOST }                                        from '@/utils/apiPaths'
import { can }                                              from '@/utils/permission'
import RecordChatSidebar     from '@/components/chat/RecordChatSidebar.vue'
import ChangeStatusModal     from '@/components/common/ChangeStatusModal.vue'
import MemberAssignPicker    from '@/components/common/MemberAssignPicker.vue'
import ApprovedByTable       from '@/components/common/ApprovedByTable.vue'

export default {
  name: 'EodDetailsView',
  components: { RecordChatSidebar, ChangeStatusModal, MemberAssignPicker, ApprovedByTable },
  inject: ['toast'],

  data() {
    return {
      id: this.$route.params.id,
      statusList: Object.values(EOD_STATUS),
      statusLabels: EOD_STATUS_LABELS,
      statusColors: EOD_STATUS_COLORS,
      statusModalOpen: false,
      statusUpdating: false,
      chatOpen: false,
    }
  },

  computed: {
    detail()           { return this.$store.getters['eod/eodDetail'] },
    replies()          { return this.$store.getters['eod/eodReply'] },
    loading()           { return this.$store.getters['eod/eodLoading'] },
    referLoading()      { return this.$store.getters['eod/eodReferLoading'] },
    availableMembers()  { return this.$store.getters['employee/employeeList'] ?? [] },

    // The existing "Referred to" list doubles as this page's "Acknowledged
    // by" card — there's no separate acknowledgement field from the API.
    acknowledgedMembers() { return this.detail.reported_to || [] },

    // Real, non-fabricated approval data: a referred member counts as
    // "approved" once they've replied on the thread (their acknowledgement),
    // timestamped with their most recent reply. Anyone who hasn't replied
    // yet shows as pending. Feeds the reusable ApprovedByTable component.
    approvers() {
      const members = this.detail.reported_to || []
      return members.map((m) => {
        const memberReplies = this.replies.filter((r) => r.replied_by?.id === m.id)
        const latest = memberReplies[memberReplies.length - 1]
        return {
          id: m.id,
          name: this.memberName(m),
          photo: this.photoUrl(m),
          dateTime: latest ? formatDateTime(latest.reply_date) : null,
          status: latest ? 'approved' : 'pending',
        }
      })
    },

  },

  created() {
    this.$store.dispatch('eod/fetchEODtDetail', this.id)
    this.$store.dispatch('eod/fetchEODReply', this.id)
    this.$store.dispatch('employee/fetchOptimisedEmployeeList')
  },

  methods: {
    formatDate,
    getInitials,
    can,

    goBack() {
      goBackTo(this.$router, { name: this.$route.meta?.breadcrumbParent || 'MyEODList' })
    },

    statusLabel(status) { return this.statusLabels[status] ?? status ?? '—' },
    statusColor(status) { return this.statusColors[status] ?? 'default' },

    memberName(m) {
      return m?.full_name
        || [m?.first_name, m?.last_name].filter(Boolean).join(' ')
        || m?.username
        || 'Unknown'
    },

    photoUrl(m) {
      const photo = m?.photo
      if (!photo) return null
      return photo.startsWith('http') ? photo : API_HOST + photo
    },

    async assignMembers(memberIds) {
      // Sequential, not Promise.all: each call re-fetches eodDetail
      // (detail: true), and firing those refetches concurrently would race.
      for (const memberId of memberIds) {
        await this.$store.dispatch('eod/EODAddRefer', { id: this.id, refer_id: memberId, detail: true })
      }
    },

    unassignMember(memberId) {
      this.$store.dispatch('eod/EODDeleteRefer', { id: this.id, refer_id: memberId, detail: true })
    },

    async changeStatus(status) {
      this.statusUpdating = true
      try {
        await this.$store.dispatch('eod/updateEODStatus', { id: this.id, status_for_change: status })
        this.toast?.success('EOD status updated.')
        this.statusModalOpen = false
      } catch {
        this.toast?.error('Failed to update EOD status.')
      } finally {
        this.statusUpdating = false
      }
    },
  },
}
</script>

<style scoped>
/* Report (main) / side column side by side; the side column sticks under
   the navbar and scrolls internally so it stays in view while the report
   scrolls. */
.eod-layout { display: flex; flex-direction: row; gap: 16px; align-items: flex-start; }
.eod-layout__main { display: flex; flex-direction: column; gap: 16px; flex: 1 1 70%; min-width: 0; }
.eod-layout__side { position: sticky; top: 80px; display: flex; flex-direction: column; gap: 16px; flex: 1 1 30%; min-width: 0; }

@media (max-width: 900px) {
  .eod-layout { flex-direction: column; }
  .eod-layout__main, .eod-layout__side { flex: 1 1 auto; width: 100%; }
  .eod-layout__side { position: static; }
}

/* ── EOD ID / Reported Date / people card ───────────────────────────────── */
.eod-card {
  background: #fff; border: 1px solid #DCDCDC; border-radius: 12px;
  padding: 12px 24px; display: flex; flex-direction: column; gap: 16px;
}

.eod-card__meta { display: flex; gap: 12px; }
.eod-meta-item { flex: 1 1 0%; display: flex; flex-direction: column; gap: 4px; }
.eod-meta-item__label { margin: 0; font-size: 12px; color: #121212; }
.eod-meta-item__value { margin: 0; font-size: 20px; font-weight: 500; color: #6E6E6F; }

.eod-card__divider { height: 1px; background: #DCDCDC; width: 100%; }

.eod-card__people { display: flex; align-items: flex-start; gap: 12px; @apply flex-col md:flex-row }
.eod-people-col { display: flex; flex-direction: column; gap: 6px; flex: 1 1 0%; min-width: 0; }
/* stretch (not flex-end) — the picker's root must span the full column
   width so its floating panel (anchored via `right: 0` on that root) can
   never extend past the card/viewport edge, regardless of how few chips
   are in it. Chips themselves still flow left inside that width. */
.eod-people-col--refer { align-items: stretch; }
.eod-people-col__label { margin: 0; font-size: 12px; color: #272727; }

.eod-pill {
  display: inline-flex; align-items: center; gap: 6px;
  background: #F9F9F9; border: 1px solid #DCDCDC; border-radius: 36px; padding: 6px;
  max-width: fit-content;
}
.eod-pill__avatar {
  width: 18px; height: 18px; border-radius: 50%; flex-shrink: 0; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  background: #573FE0; color: #fff; font-size: 9px; font-weight: 700;
}
.eod-pill__avatar img { width: 100%; height: 100%; object-fit: cover; }
.eod-pill__name { font-size: 12px; color: #3D3D3E; white-space: nowrap; }

/* ── Panels row: [Completed Tasks + Completed Tickets] 1/2 | Report Details 1/2 ── */
.eod-card__panels { display: flex; flex-direction: column; width: 100%; gap: 24px; align-items: stretch; }
@media (max-width: 1024px) { .eod-card__panels { flex-direction: column; } }

.eod_listed { display: flex; flex-direction: row; gap: 24px; flex: 1 1 0%; min-width: 0; }
@media (max-width: 600px) { .eod_listed { flex-direction: column; } }

.eod-panel { padding: 24px 16px 24px 16px; display: flex; flex-direction: column; gap: 20px; flex: 1 1 0%; min-width: 0; }
.eod-panel--editor { display: flex; flex: 1 1 0%; min-width: 0; }

.eod-panel__header { display: flex; flex-direction: column; gap: 12px; }
.eod-panel__title {
  margin: 0; display: flex; align-items: center; justify-content: space-between;
  font-size: 18px; font-weight: 500; color: #272727;
}
.eod-panel__count { font-size: 18px; font-weight: 500; color: #28A645; }

.eod-panel__header::after { content: ''; display: block; height: 1px; background: #DCDCDC; }

.eod-list { display: flex; flex-direction: column; gap: 0; flex: 1; overflow-y: auto; }

.eod-task { padding: 8px 12px; background: #EBFFED; border-bottom: 1px solid #DCDCDC; }
.eod-task:last-child { border-bottom: none; }
.eod-task__title { display: block; font-size: 14px; color: #008610; word-break: break-word; }

.eod-task__subtasks { margin-top: 4px; padding-left: 16px; display: flex; flex-direction: column; gap: 4px; }
.eod-task__subtask { font-size: 12px; color: #6E6E6F; display: flex; align-items: center; gap: 6px; }

.eod-list--ordered { list-style: none; counter-reset: eod-ticket; padding: 0; margin: 0; }
.eod-ticket {
  counter-increment: eod-ticket;
  padding: 8px 12px; background: #EBFFED; border-bottom: 1px solid #DCDCDC;
  font-size: 14px; color: #008610;
}
.eod-ticket:last-child { border-bottom: none; }
.eod-ticket::before { content: counter(eod-ticket) ". "; }
.eod-ticket__link { color: inherit; text-decoration: none; }
.eod-ticket__link:hover { text-decoration: underline; }

/* ── Report Details (read-only rich text) ───────────────────────────────── */
.eod-report-body {
  flex: 1; min-height: 220px; padding: 16px 12px;
  background: #F9F9F9; border: 1px solid #DCDCDC; border-radius: 8px;
  font-size: 12px; color: #555;
}
/* .rich-text base/p/ul/ol/li/heading rules now live globally in crud.css */

/* ── Side column: chat trigger + acknowledged by ────────────────────────── */
.chat-trigger {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  width: 100%; padding: 12px 24px; border-radius: 12px; cursor: pointer;
  background: #E9EFFF; border: 1.5px solid #CFD4FF; color: #573FE0;
  font-size: 18px; font-weight: 500; box-shadow: 2px 0 2px rgba(220, 220, 220, 0.24);
  transition: background-color .15s;
}
.chat-trigger:hover { background: #CFD4FF; }
.chat-trigger i { font-size: 24px; }

.acknowledged-by__list { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 16px; }
</style>
