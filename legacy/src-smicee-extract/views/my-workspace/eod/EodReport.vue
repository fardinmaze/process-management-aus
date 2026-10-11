<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Submit EOD</h1>
        <p class="page-subtitle">End-of-day report for today</p>
      </div>
      <button type="button" class="btn btn--ghost" @click="goBack">
        <i class="ri-arrow-left-line" /> Back
      </button>
    </div>

    <form class="eod-card" @submit.prevent="submit">
      <div class="eod-card__people">
        <div class="eod-people-col">
          <p class="eod-people-col__label">Reported by</p>
          <span class="eod-pill">
            <span class="eod-pill__avatar">
              <img v-if="currentUserPhoto" :src="currentUserPhoto" :alt="currentUserName" />
              <span v-else>{{ getInitials(currentUserName) }}</span>
            </span>
            <span class="eod-pill__name">{{ currentUserName }}</span>
          </span>
        </div>

        <div class="eod-people-col eod-people-col--refer">
          <p class="eod-people-col__label">Referred to <span class="required">*</span></p>
          <MultiSelect v-model="reportedTo" :options="employeeList" pill placeholder="Search or add a member" />
        </div>
      </div>

      <div class="eod-card__divider" />

      <div class="eod-card__panels">
       <div class="eod_listed">
         <div class="card eod-panel">
          <div class="eod-panel__header">
            <h3 class="eod-panel__title">
              Completed Tasks <span class="eod-panel__count">{{ completeTasks.length }}</span>
            </h3>
          </div>
          <div v-if="completeTasks.length" class="eod-list">
            <div v-for="(task, idx) in completeTasks" :key="task.id" class="eod-task">
              <span class="eod-task__title">{{ idx + 1 }}. {{ task.title }}</span>
              <div v-if="task.subtasks?.length" class="eod-task__subtasks">
                <div v-for="sub in task.subtasks" :key="sub.id" class="eod-task__subtask">
                  <i class="ri-corner-down-right-line" /> {{ sub.title }}
                </div>
              </div>
            </div>
          </div>
          <p v-else class="text-muted text-sm">You haven't completed any tasks yet.</p>
        </div>

        <div class="card eod-panel">
          <div class="eod-panel__header">
            <h3 class="eod-panel__title">
              Completed Tickets <span class="eod-panel__count">{{ completeTickets.length }}</span>
            </h3>
          </div>
          <ol v-if="completeTickets.length" class="eod-list eod-list--ordered">
            <li v-for="ticket in completeTickets" :key="ticket.id" class="eod-ticket">
              <span class="eod-ticket__link">
                {{ ticket.subject }}
              </span>
            </li>
          </ol>
          <p v-else class="text-muted text-sm">You haven't completed any tickets yet.</p>
        </div>

       </div>
        <div class="card eod-panel eod-panel--editor">
          <div class="eod-panel__header">
            <h3 class="eod-panel__title">Report Details <span class="required">*</span></h3>
          </div>
          <BalloonEditor v-model="report" class="eod-editor" />
        </div>
      </div>

      <div class="eod-card__actions">
        <button type="submit" class="btn btn--submit" :disabled="submitting || !canSubmit">
          <i v-if="submitting" class="ri-loader-4-line spinning" />
          <i v-else class="ri-check-line" />
          {{ submitting ? 'Submitting…' : 'Submit' }}
        </button>
        <button type="button" class="btn btn--draft" :disabled="savingDraft || submitting" @click="saveDraft">
          <i v-if="savingDraft" class="ri-loader-4-line spinning" />
          <i v-else class="ri-save-line" />
          {{ savingDraft ? 'Saving…' : 'Save as Draft' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script>
import { Ckeditor } from '@ckeditor/ckeditor5-vue'
import { ClassicEditor, Essentials, Bold, Italic, Paragraph, Link, List, BlockQuote } from 'ckeditor5'
import 'ckeditor5/ckeditor5.css'
import 'ckeditor5/ckeditor5-content.css'
import MultiSelect     from '@/components/common/MultiSelect.vue'
import { TICKET_PRIORITY_COLORS } from '@/utils/constants'
import { getInitials, goBack as goBackTo } from '@/utils/helpers'
import { API_HOST }    from '@/utils/apiPaths'
import BalloonEditor from '@/components/common/BalloonEditor.vue'
export default {
  name: 'EodReportView',
  inject: ['toast'],
  components: { MultiSelect, Ckeditor,BalloonEditor },

  data() {
    return {
      description: '',
      report: '',
      reportedTo: [],
      submitting: false,
      savingDraft: false,
      editor: ClassicEditor,
      editorConfig: {
        licenseKey: 'GPL',
        plugins: [Essentials, Bold, Italic, Paragraph, Link, List, BlockQuote],
        toolbar: ['undo', 'redo', '|', 'bold', 'italic', 'link', '|', 'bulletedList', 'numberedList', '|', 'blockQuote'],
      },
    }
  },

  computed: {
    draft()          { return this.$store.getters['eod/myDraft'] },
    employeeList()   { return this.$store.getters['employee/employeeList'] ?? [] },
    completeTasks()  { return this.$store.getters['eod/myCompleteTask'] ?? [] },
    completeTickets(){ return this.$store.getters['eod/myCompleteTickets'] ?? [] },
    draftId()        { return this.draft?.id ?? null },
    canSubmit()      { return this.report.trim().length > 0 && this.reportedTo.length > 0 },

    currentUser()      { return this.$store.getters['auth/user'] ?? {} },
    currentUserName()  {
      return this.currentUser.full_name
        || [this.currentUser.first_name, this.currentUser.last_name].filter(Boolean).join(' ')
        || this.currentUser.username
        || 'You'
    },
    currentUserPhoto() {
      const photo = this.currentUser.photo
      if (!photo) return null
      return photo.startsWith('http') ? photo : API_HOST + photo
    },
  },

  async created() {
    this.$store.dispatch('employee/fetchOptimisedEmployeeList')
    this.$store.dispatch('eod/fetchEODCompleteTask')
    await this.$store.dispatch('eod/fetchMyDraft')
    if (this.draft?.report) this.report = this.draft.report
  },

  methods: {
    getInitials,

    goBack() {
      goBackTo(this.$router, { name: 'MyEODList' })
    },

    priorityColor(priority) {
      return TICKET_PRIORITY_COLORS[priority] ?? 'default'
    },

    resetForm() {
      this.report = ''
      this.reportedTo = []
    },

    async saveDraft() {
      this.savingDraft = true
      try {
        if (this.draftId) {
          await this.$store.dispatch('eod/updateEODDraft', { id: this.draftId, report: this.report })
        } else {
          await this.$store.dispatch('eod/addEODDraft', { report: this.report })
        }
        this.toast?.success('Draft saved.')
      } finally {
        this.savingDraft = false
      }
    },

    async submit() {
      if (!this.canSubmit) return
      this.submitting = true
      try {
        await this.$store.dispatch('eod/addEOD', {
          report: this.report,
          reported_to: this.reportedTo.map((m) => m.id),
        })
        if (this.draftId) {
          await this.$store.dispatch('eod/deleteEODDraft', { id: this.draftId })
        }
        this.toast?.success('EOD submitted successfully.')
        this.resetForm()
        this.$router.push({ name: 'MyEODList' })
      } finally {
        this.submitting = false
      }
    },
  },
}
</script>

<style scoped>
/* ── Outer card ──────────────────────────────────────────────────────────── */
.eod-card {
  background: #fff; border: 1px solid #DCDCDC; border-radius: 12px;
  padding: 12px 24px 32px; display: flex; flex-direction: column; gap: 24px;
}

.eod-card__people { display: flex; align-items: flex-start; gap: 12px; @apply flex-col lg:flex-row}

/* width: 100% (not just flex: 1) — below the `lg` breakpoint `.eod-card__people`
   switches to flex-col, where it's the CROSS axis (not the main axis) that
   sizes this item, and its `align-items: flex-start` shrink-wraps children
   to content size there. An explicit width beats that shrink-wrap on any
   axis, so this stays full-width in both the row (desktop) and column
   (mobile) layouts — required so the "Referred to" picker's floating panel
   (see below) anchors to the real card width, not a tiny shrink-wrapped box. */
.eod-people-col { display: flex; flex-direction: column; gap: 6px; flex: 1 1 0%; min-width: 0; width: 100%; }
/* stretch (not flex-start/flex-end) — the picker's root must span the full
   column width so its floating panel (anchored via `right: 0` on that root)
   can never extend past the card/viewport edge, regardless of how few
   chips are in it. Chips themselves still flow left inside that width. */
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
.eod-pill__name { font-size: 10px; color: #3D3D3E; white-space: nowrap; }

.eod-card__divider { height: 1px; background: #DCDCDC; width: 100%; }

/* ── Panels row: [Completed Tasks + Completed Tickets] 1/2 | Report Details 1/2 ── */
.eod-card__panels { @apply flex flex-row w-full gap-6 items-stretch }
@media (max-width: 1024px) { .eod-card__panels { @apply flex-col } }

.eod_listed { @apply flex flex-row gap-6; flex: 1 1 0%; min-width: 0; }
@media (max-width: 600px) { .eod_listed { @apply flex-col } }

.eod-panel { padding: 24px 16px 24px 16px; display: flex; flex-direction: column; gap: 20px; flex: 1 1 0%; min-width: 0; }
.eod-panel--editor { display: flex; flex: 1 1 0%; min-width: 0; }

.eod-panel__header { display: flex; flex-direction: column; gap: 12px; }
.eod-panel__title {
  margin: 0; display: flex; align-items: center; justify-content: space-between;
  font-size: 18px; font-weight: 500; color: #272727;
}
.eod-panel__title .required { font-size: 14px; }
.eod-panel__count { font-size: 18px; font-weight: 500; color: #28A645; }

.eod-panel__header::after { content: ''; display: block; height: 1px; background: #DCDCDC; }

.eod-list { display: flex; flex-direction: column; gap: 0; flex: 1; overflow-y: auto; }

.eod-task {
  padding: 8px 12px; background: #EBFFED; border-bottom: 1px solid #DCDCDC;
}
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

/* ── Report Details editor ──────────────────────────────────────────────── */
.eod-editor { display: flex; flex-direction: column; flex: 1; min-height: 0; }
.eod-editor :deep(.ck-editor) { display: flex; flex-direction: column; flex: 1; min-height: 0; }
.eod-editor :deep(.ck-editor__editable) {
  min-height: 220px; background: #F9F9F9; border: 1px solid #DCDCDC !important; border-radius: 8px;
}

/* ── Actions ─────────────────────────────────────────────────────────────── */
.eod-card__actions { display: flex; align-items: center; gap: 8px; align-self: flex-end; }
.btn--draft { background: #E9EFFF; color: #573FE0; }
.btn--draft:hover:not(:disabled) { background: #CFD4FF; }
</style>
