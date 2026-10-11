<template>
<div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Archived Projects</h1>
        <p class="page-subtitle">Projects that have been archived</p>
      </div>
    </div>

    <div class="card p-4">
      <div class="toolbar-row">
        <SearchBox v-model="filters.search" :active="!!$route.query.search_term" @search="reload" @clear="reload" />
        <div class="view-toggle">
          <button
            type="button" class="view-toggle__btn" :class="{ 'view-toggle__btn--active': viewMode === 'list' }"
            title="List view" @click="viewMode = 'list'"
          ><i class="ri-list-unordered" /></button>
          <button
            type="button" class="view-toggle__btn" :class="{ 'view-toggle__btn--active': viewMode === 'grid' }"
            title="Grid view" @click="viewMode = 'grid'"
          ><i class="ri-grid-fill" /></button>
        </div>
      </div>

      <hr class="project-card__divider toolbar-divider" />

      <div v-if="loading" class="page-loader text-muted">Loading…</div>

      <div v-else-if="list.length && viewMode === 'grid'" class="project-grid">
        <div v-for="row in list" :key="row.id" class="project-card">
          <div class="flex flex-col gap-2.5">
            <div class="flex items-center gap-3">
              <router-link :to="{ name: 'ProjectDetails', params: { id: row.id }, query: { from: 'archived' } }" class="flex-1 min-w-0 truncate text-[18px] font-semibold text-brand-600 no-underline" :title="row.title">{{ row.title }}</router-link>
              <div class="flex items-center gap-2 shrink-0">
                <span class="status-select-wrap" :class="[statusStyle(row.status), { 'status-select-wrap--disabled': statusSaving }]">
                  <select
                    class="status-select"
                    :value="row.status" :disabled="statusSaving"
                    @change="handleStatusSelect(row, $event.target.value)"
                  >
                    <option v-for="s in MODAL_STATUS_LIST" :key="s" :value="s">{{ capitalize(s) }}</option>
                  </select>
                  <i class="ri-arrow-down-s-line status-select__icon" />
                </span>
                <!-- <router-link :to="{ name: 'ProjectEdit', params: { id: row.id } }" class="icon-btn icon-btn--edit" title="Edit" />
                <button type="button" class="icon-btn icon-btn--delete" title="Delete" @click="confirmDelete(row)" /> -->
              </div>
            </div>

            <hr class="project-card__divider" />

            <div class="flex flex-col gap-1.5">
              <span class="text-[15px] text-typo-400">Project Description</span>
              <p class="project-card__details text-[12px] leading-relaxed line-clamp-3 m-0" :class="row.details ? 'text-typo-600' : 'text-typo-300 italic'">
                {{ row.details ? stripHtml(row.details) : 'No description provided.' }}
              </p>
            </div>
          </div>

          <hr class="project-card__divider" />

          <div class="flex flex-col gap-2 text-[12px]">
            <div class="flex items-center justify-between gap-2">
              <span class="text-typo-500">Project Type:</span>
              <span class="info-pill">{{ row.category?.title ?? '—' }}</span>
            </div>
            <div class="flex items-center justify-between gap-2">
              <span class="text-typo-500">Team Lead:</span>
              <span class="info-pill">{{ teamLeadName(row) }}</span>
            </div>
            <div class="flex items-center justify-between gap-2">
              <span class="text-typo-500">Reference ID:</span>
              <span class="flex items-center gap-1.5">
                <span class="font-medium text-brand-700">{{ row.reference_id }}</span>
                <button type="button" class="copy-btn" title="Copy Reference ID" @click="copyReferenceId(row)">
                  <i class="ri-file-copy-line" />
                </button>
              </span>
            </div>
            <div class="flex items-center justify-between gap-2">
              <span class="text-typo-500">Starting Date:</span>
              <span class="text-typo-600">{{ formatDate(row.start_date) }}</span>
            </div>

            <div class="flex flex-col gap-1.5 mt-1">
              <span class="text-typo-500">Project Progress:</span>
              <div class="progress-bar">
                <div class="progress-bar__todo" :style="{ flexBasis: (100 - progressPercent(row)) + '%' }">To-do</div>
                <div class="progress-bar__done" :style="{ flexBasis: progressPercent(row) + '%' }">Completed</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="list.length && viewMode === 'list'" class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>#NO</th>
              <th>Project</th>
              <th>Status</th>
              <th>Project Type</th>
              <th>Team Lead</th>
              <th>Starting Date</th>
              <th>Progress</th>
              <th style="width:90px">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in list" :key="row.id">
              <td>{{ rowNumber(idx) }}</td>
              <td>
                <router-link :to="{ name: 'ProjectDetails', params: { id: row.id }, query: { from: 'archived' } }" class="title-link">{{ row.title }}</router-link>
                <div class="flex items-center gap-1 mt-1 text-[11px] text-brand-700">
                  {{ row.reference_id }}
                  <button type="button" class="copy-btn" title="Copy Reference ID" @click="copyReferenceId(row)">
                    <i class="ri-file-copy-line" />
                  </button>
                </div>
              </td>
              <td>
                <span class="status-select-wrap" :class="[statusStyle(row.status), { 'status-select-wrap--disabled': statusSaving }]">
                  <select
                    class="status-select"
                    :value="row.status" :disabled="statusSaving"
                    @change="handleStatusSelect(row, $event.target.value)"
                  >
                    <option v-for="s in MODAL_STATUS_LIST" :key="s" :value="s">{{ capitalize(s) }}</option>
                  </select>
                  <i class="ri-arrow-down-s-line status-select__icon" />
                </span>
              </td>
              <td>{{ row.category?.title ?? '—' }}</td>
              <td>{{ teamLeadName(row) }}</td>
              <td>{{ formatDate(row.start_date) }}</td>
              <td>
                <div class="progress-bar progress-bar--labeled" style="width:110px">
                  <div class="progress-bar__todo" :style="{ flexBasis: (100 - progressPercent(row)) + '%' }" />
                  <div class="progress-bar__done" :style="{ flexBasis: progressPercent(row) + '%' }" />
                  <span class="progress-bar__label">{{ progressPercent(row) }}%</span>
                </div>
              </td>
              <td>
                <div class="action-btns">
                  <router-link :to="{ name: 'ProjectEdit', params: { id: row.id } }" class="icon-btn icon-btn--edit" title="Edit" />
                  <button type="button" class="icon-btn icon-btn--delete" title="Delete" @click="confirmDelete(row)" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty-state">
        <i class="ri-archive-line" />
        <h3>No archived projects</h3>
        <p>Projects you archive will show up here.</p>
      </div>

      <div v-if="count > 0" class="pagination">
        <Pagination :page="page" :last-page="lastPage" :per-page="perPage" @update:page="goTo" @update:per-page="onPerPageChange" />
      </div>
    </div>

    <ConfirmModal
      v-if="deleteTarget"
      title="Delete Project"
      message="Are you sure you want to delete this project? This action cannot be undone."
      confirm-label="Delete"
      confirm-variant="danger"
      :loading="deleting"
      @confirm="doDelete"
      @cancel="deleteTarget = null"
    />
  </div>
</template>

<script>
import { formatDate, capitalize, stripHtml, apiErrorMessage } from '@/utils/helpers'
import { DEFAULT_PAGE_SIZE } from '@/utils/constants'
import Pagination        from '@/components/common/Pagination.vue'
import SearchBox          from '@/components/common/SearchBox.vue'
import ConfirmModal       from '@/components/common/ConfirmModal.vue'

// Same status vocabulary/colors as the main Projects list — an archived
// project still carries its original status, and this page (per the legacy
// script in task.txt) lets you filter/inspect it by that status.
const PROJECT_STATUSES = ['APPROVED', 'PENDING', 'WORKING', 'POSTPONED', 'PAUSED', 'COMPLETED']
const PROJECT_STATUS_STYLES = {
  APPROVED:  'bg-[#4b8dee] text-white',
  PENDING:   'bg-[#eaa14d] text-white',
  WORKING:   'bg-brand-400 text-white',
  POSTPONED: 'bg-[#ed5b48] text-white',
  PAUSED:    'bg-warning-300 text-warning-900',
  COMPLETED: 'bg-secondary-400 text-white',
}
const MODAL_STATUS_LIST = [...PROJECT_STATUSES, 'ARCHIVED']

// Wired to the ported `project` store's *archived* actions/getters —
// fetchPaginatedArchivedProject / projectArchivedPaginated /
// projectArchivedCount — mirroring the legacy Archived Projects script in
// task.txt. That script only ever filtered by search term (no
// date/team-lead/client/type filter row and, here, no status tab bar since
// this page always means project_status=ARCHIVED), so this page keeps just
// the search box next to the view toggle. Delete and status-change reuse
// the same `project/deleteProject` / `project/updateProjectStatus` actions
// as the main list, with `from_archived: true` so they re-fetch this
// archived list afterwards instead of the main paginated one.
export default {
  name: 'ArchivedProjectListView',
  components: { Pagination, SearchBox, ConfirmModal },
  inject: ['toast'],

  data() {
    return {
      filters: {
        search: this.$route.query.search_term || '',
      },
      viewMode: 'grid',
      MODAL_STATUS_LIST,
      deleteTarget: null,
      deleting:     false,
      statusSaving: false,
    }
  },

  computed: {
    list()    { return this.$store.getters['project/projectArchivedPaginated'] || [] },
    count()   { return this.$store.getters['project/projectArchivedCount'] || 0 },
    loading() { return this.$store.getters['project/submitLoading'] },

    page()     { return Number(this.$route.query.page) || 1 },
    perPage()  { return Number(this.$route.query.per_page) || DEFAULT_PAGE_SIZE },
    lastPage() { return Math.max(1, Math.ceil(this.count / this.perPage)) },
  },

  watch: {
    '$route.query': {
      immediate: true,
      handler() { this.fetchList() },
    },
  },

  methods: {
    formatDate,
    capitalize,
    stripHtml,

    // project_status is always ARCHIVED here — this page has no status tab
    // bar, unlike the main Projects list.
    fetchList() {
      this.$store.dispatch('project/fetchPaginatedArchivedProject', {
        perPage:        this.perPage,
        currentPage:    this.page,
        project_status: 'ARCHIVED',
        search_term:    this.filters.search || undefined,
      })
    },

    rowNumber(idx) {
      return String((this.page - 1) * this.perPage + idx + 1).padStart(2, '0')
    },

    statusStyle(status) { return PROJECT_STATUS_STYLES[status] ?? 'bg-typo-100 text-typo-700' },

    // Matches the legacy `projectDoneTaskPercentage` computed in task.txt.
    progressPercent(row) {
      const total = Number(row.task) || 0
      if (!total) return 0
      const remaining = Number(row.remaining) || 0
      return Math.max(0, Math.min(100, Math.floor(((total - remaining) / total) * 100)))
    },

    teamLeadName(row) {
      const lead = (row.teammates || []).find((t) => t.project_lead)
      return lead?.user_name || '—'
    },

    pushQuery(query) {
      this.$router.push({ query: { ...this.$route.query, ...query } })
    },

    reload() {
      this.pushQuery({ page: 1, search_term: this.filters.search || undefined })
    },

    goTo(p) {
      this.pushQuery({ page: p })
    },

    onPerPageChange(size) {
      this.pushQuery({ page: 1, per_page: size })
    },

    async copyReferenceId(row) {
      try {
        await navigator.clipboard.writeText(row.reference_id)
        this.toast?.success('Reference ID copied.')
      } catch {
        this.toast?.error('Could not copy reference ID.')
      }
    },

    confirmDelete(row) {
      this.deleteTarget = row
    },

    async doDelete() {
      this.deleting = true
      try {
        const res = await this.$store.dispatch('project/deleteProject', {
          id:             this.deleteTarget.id,
          page:           this.page,
          perPage:        this.perPage,
          project_status: 'ARCHIVED',
          search_term:    this.filters.search || undefined,
          from_archived:  true,
        })
        if (this.isOk(res)) {
          this.toast?.success(res?.response || 'Project deleted.')
          this.deleteTarget = null
        } else {
          this.toast?.error(res?.response || 'Failed to delete project.')
        }
      } catch (err) {
        this.toast?.error(apiErrorMessage(err, 'Failed to delete project.'))
      } finally {
        this.deleting = false
      }
    },

    // ── Status change ───────────────────────────────────────────────────
    // Inline status <select> in both the grid and table views — no modal.
    async handleStatusSelect(row, newStatus) {
      if (newStatus === row.status) return
      this.statusSaving = true
      try {
        const res = await this.$store.dispatch('project/updateProjectStatus', {
          id:                row.id,
          status_for_change: newStatus,
          page:              this.page,
          perPage:           this.perPage,
          project_status:    'ARCHIVED',
          search_term:       this.filters.search || undefined,
          from_archived:     true,
        })
        if (this.isOk(res)) {
          this.toast?.success(res?.response || 'Status updated.')
        } else {
          this.toast?.error(res?.response || 'Failed to update status.')
        }
      } catch (err) {
        this.toast?.error(apiErrorMessage(err, 'Failed to update status.'))
      } finally {
        this.statusSaving = false
      }
    },

    isOk(res) { return res?.code === 200 },
  },
}
</script>

<style scoped>
.project-grid {
  display: grid;
  /* min(320px, 100%) instead of a bare 320px — at narrow viewports (375px
     and below, after the layout's own page/card padding) a hard 320px
     column minimum doesn't fit and forces the whole page into horizontal
     scroll; capping it to 100% lets the column shrink to fill one column
     instead of overflowing. */
  grid-template-columns: repeat(auto-fill, minmax(min(320px, 100%), 1fr));
  gap: 16px;
}

.project-card {
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: #fff;
  border: 1px solid #F9F9F9;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 2px 2px 6px rgba(220, 220, 220, 0.24);
}

.project-card__divider {
  border: none;
  border-top: 1.5px solid #F9F9F9;
  margin: 0;
}

/* Reserve space for a full 3-line clamp so cards with a short, missing, or
   long description all end up the same height in the grid. */
.project-card__details { min-height: 57px; }

/* Inline status-change control (both grid and table views) instead of a
   modal — a real <select> for the interaction, fully de-chromed
   (appearance: none) with our own chevron icon drawn on top, since a
   native <select>'s own arrow ignores author padding in most browsers and
   was sitting flush against the pill's edge no matter how much
   padding-right we gave the element itself. */
.status-select-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  border-radius: 36px;
}
.status-select-wrap--disabled { opacity: .6; }
.status-select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background: transparent;
  color: inherit;
  border: none;
  border-radius: 36px;
  padding: 6px 26px 6px 12px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.3;
  cursor: pointer;
  white-space: nowrap;
}
.status-select option { color: #272727; background: #fff; font-weight: 500; }
.status-select__icon {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 13px;
  pointer-events: none;
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

.copy-btn {
  display: inline-flex;
  align-items: center;
  background: transparent;
  border: none;
  padding: 0;
  color: #888889;
  cursor: pointer;
  transition: color .15s;
}
.copy-btn:hover { color: #573FE0; }

.progress-bar {
  display: flex;
  align-items: stretch;
  width: 100%;
  height: 18px;
  overflow: hidden;
  border-radius: 2px;
}
.progress-bar__todo,
.progress-bar__done {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  white-space: nowrap;
  overflow: hidden;
  min-width: 0;
}
.progress-bar__todo { background: #DCDCDC; color: #555555; }
.progress-bar__done { background: #6B61EF; color: #F9F9F9; }

.progress-bar--labeled { position: relative; }
.progress-bar__label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 600;
  color: #272727;
  text-shadow: 0 0 3px #fff, 0 0 3px #fff;
  pointer-events: none;
}

.toolbar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}
.toolbar-divider { margin: 16px 0; }

.view-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #F9F9F9;
  border: 1px solid #DCDCDC;
  border-radius: 6px;
  padding: 2px;
}
.view-toggle__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  background: transparent;
  border-radius: 4px;
  color: #6E6E6F;
  cursor: pointer;
  transition: background-color .15s, color .15s;
}
.view-toggle__btn:not(.view-toggle__btn--active):hover { color: #573FE0; }
.view-toggle__btn--active { background: #573FE0; color: #fff; }
.view-toggle__btn--active:hover { color: #fff; }
</style>
