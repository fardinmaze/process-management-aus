<template>
<div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">My Projects</h1>
        <p class="page-subtitle">Projects you're part of</p>
      </div>
    </div>

    <div class="card p-4">
      <div class="tx-tabs" role="tablist">
        <button
          v-for="tab in STATUS_TABS" :key="tab.value" type="button" role="tab"
          class="tx-tab"
          :class="tabActiveClass(tab.value)"
          :aria-selected="activeStatusTab === tab.value"
          @click="selectStatusTab(tab.value)"
        >
          {{ tab.label }}
          <span v-if="activeStatusTab === tab.value" class="tx-tab__count">{{ count }}</span>
        </button>
      </div>

      <div class="toolbar-row">
        <SearchBox v-model="filters.search" :active="!!$route.query.search_term" @search="reload" @clear="reload" />
        <div class="toolbar-row__actions">
          <button type="button" class="btn btn--filter" @click="filtersOpen = !filtersOpen">
            <i class="ri-filter-3-line" /> Filter
          </button>
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
      </div>

      <div v-show="filtersOpen" class="filters__row_open">
        <DatePicker :model-value="filters.created_at" placeholder="Project Created Date" @update:model-value="onCreatedAtChange" />
        <select v-model="filters.team_lead" class="form-select" @change="reload">
          <option value="">All Team Leads</option>
          <option v-for="t in teamLeadOptions" :key="t.id" :value="t.id">{{ t.full_name ?? t.username }}</option>
        </select>
        <select v-model="filters.client" class="form-select" @change="reload">
          <option value="">All Clients</option>
          <option v-for="c in clientOptions" :key="c.user?.id ?? c.id" :value="c.user?.id ?? c.id">{{ c.company_name ?? c.user?.full_name }}</option>
        </select>
        <button class="btn btn--ghost" @click="resetFilters">
          <i class="ri-filter-off-line" /> Reset
        </button>
      </div>

      <hr class="project-card__divider toolbar-divider" />

      <div v-if="loading" class="page-loader text-muted">Loading…</div>

      <div v-else-if="list.length && viewMode === 'grid'" class="project-grid">
        <div v-for="row in list" :key="row.id" class="project-card">
          <div class="flex flex-col gap-2.5">
            <div class="flex items-center gap-3">
              <router-link :to="{ name: 'MyProjectDetails', params: { id: row.id } }" class="flex-1 min-w-0 truncate text-[18px] font-semibold text-brand-600 no-underline" :title="row.title">{{ row.title }}</router-link>
              <span class="status-pill status-pill--static shrink-0" :class="statusStyle(row.status)">{{ capitalize(row.status) }}</span>
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
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in list" :key="row.id">
              <td>{{ rowNumber(idx) }}</td>
              <td>
                <router-link :to="{ name: 'MyProjectDetails', params: { id: row.id } }" class="title-link">{{ row.title }}</router-link>
                <div class="flex items-center gap-1 mt-1 text-[11px] text-brand-700">
                  {{ row.reference_id }}
                  <button type="button" class="copy-btn" title="Copy Reference ID" @click="copyReferenceId(row)">
                    <i class="ri-file-copy-line" />
                  </button>
                </div>
              </td>
              <td>
                <span class="status-pill status-pill--static" :class="statusStyle(row.status)">{{ capitalize(row.status) }}</span>
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
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty-state">
        <i class="ri-folder-line" />
        <h3>No projects yet</h3>
        <p>Projects you're assigned to will appear here.</p>
      </div>

      <div v-if="count > 0" class="pagination">
        <Pagination :page="page" :last-page="lastPage" :per-page="perPage" @update:page="goTo" @update:per-page="onPerPageChange" />
      </div>
    </div>
  </div>
</template>

<script>
import { formatDate, capitalize, stripHtml } from '@/utils/helpers'
import { DEFAULT_PAGE_SIZE } from '@/utils/constants'
import DatePicker  from '@/components/common/DatePicker.vue'
import Pagination  from '@/components/common/Pagination.vue'
import SearchBox   from '@/components/common/SearchBox.vue'

// Real project status vocabulary (matches the legacy project module, see
// task.txt) — colors below come from the "Category Color Tone" Figma
// reference used on the main Projects list.
const PROJECT_STATUSES = ['APPROVED', 'PENDING', 'WORKING', 'POSTPONED', 'PAUSED', 'COMPLETED']
const PROJECT_STATUS_STYLES = {
  APPROVED:  'bg-[#4b8dee] text-white',
  PENDING:   'bg-[#eaa14d] text-white',
  WORKING:   'bg-brand-400 text-white',
  POSTPONED: 'bg-[#ed5b48] text-white',
  PAUSED:    'bg-warning-300 text-warning-900',
  COMPLETED: 'bg-secondary-400 text-white',
}

// Tab bar above the toolbar card, defaulting to "All".
const STATUS_TABS = [
  { value: 'ALL', label: 'All' },
  ...PROJECT_STATUSES.map((s) => ({ value: s, label: capitalize(s) })),
]

// "My Projects" — same card/table design and status colors as the main
// Projects list (operations/project/ProjectList.vue), but wired to
// `project/fetchMyProject` (the legacy My Projects script in task.txt)
// instead of `fetchPaginatedProject`, and read-only: no edit/delete and no
// status-change here, and per that legacy script the filter row only ever
// had Project Created Date, Team Lead and Client (no Project Type).
export default {
  name: 'MyProjectsView',
  components: { DatePicker, Pagination, SearchBox },
  inject: ['toast'],

  data() {
    return {
      filtersOpen: false,
      filters: {
        search:     this.$route.query.search_term || '',
        created_at: this.$route.query.created_at  || '',
        team_lead:  this.$route.query.team_lead    || '',
        client:     this.$route.query.client       || '',
      },
      viewMode: 'grid',
      STATUS_TABS,
    }
  },

  computed: {
    list()    { return this.$store.getters['project/myProject'] || [] },
    count()   { return this.$store.getters['project/count'] || 0 },
    loading() { return this.$store.getters['project/submitLoading'] },

    teamLeadOptions() { return this.$store.getters['project/projectTeamLead'] || [] },
    clientOptions()   { return this.$store.getters['client/clientWithoutPg'] || [] },

    page()     { return Number(this.$route.query.page) || 1 },
    perPage()  { return Number(this.$route.query.per_page) || DEFAULT_PAGE_SIZE },
    lastPage() { return Math.max(1, Math.ceil(this.count / this.perPage)) },

    activeStatusTab() { return this.$route.query.project_status || 'ALL' },
  },

  watch: {
    '$route.query': {
      immediate: true,
      handler() { this.fetchList() },
    },
  },

  created() {
    this.$store.dispatch('project/fetchProjectTeamLeadList')
    this.$store.dispatch('client/fetchClientWithoutPg')
  },

  methods: {
    formatDate,
    capitalize,
    stripHtml,

    fetchList() {
      this.$store.dispatch('project/fetchMyProject', {
        perPage:        this.perPage,
        currentPage:    this.page,
        project_status: this.activeStatusTab === 'ALL' ? undefined : this.activeStatusTab,
        created_at:     this.filters.created_at || undefined,
        team_lead:      this.filters.team_lead  || undefined,
        client:         this.filters.client     || undefined,
        search_term:    this.filters.search     || undefined,
      })
    },

    selectStatusTab(tab) {
      this.pushQuery({ page: 1, project_status: tab === 'ALL' ? undefined : tab })
    },

    rowNumber(idx) {
      return String((this.page - 1) * this.perPage + idx + 1).padStart(2, '0')
    },

    statusStyle(status) { return PROJECT_STATUS_STYLES[status] ?? 'bg-typo-100 text-typo-700' },

    tabActiveClass(tab) {
      return this.activeStatusTab === tab ? 'tx-tab--active' : ''
    },

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
      this.pushQuery({
        page:        1,
        search_term: this.filters.search     || undefined,
        created_at:  this.filters.created_at || undefined,
        team_lead:   this.filters.team_lead  || undefined,
        client:      this.filters.client     || undefined,
      })
    },

    onCreatedAtChange(val) {
      this.filters.created_at = val
      this.reload()
    },

    resetFilters() {
      this.filters = { search: '', created_at: '', team_lead: '', client: '' }
      this.$router.push({ query: {} })
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
  },
}
</script>

<style scoped>
/* Underline-style tab bar, matching finance-v2/reports/Reports.vue's .tx-tabs. */
.tx-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 16px;
}
.tx-tab {
  appearance: none;
  border: 0;
  background: transparent;
  padding: 9px 14px;
  margin-bottom: -1px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: color 0.15s ease, border-color 0.15s ease;
}
.tx-tab:hover { color: #334155; }
.tx-tab--active { color: #573FE0; border-bottom-color: #573FE0; }

.tx-tab__count {
  font-size: 0.68rem;
  font-weight: 700;
  line-height: 1;
  background: #f1f5f9;
  color: #64748b;
  border-radius: 9999px;
  padding: 3px 7px;
  min-width: 18px;
  text-align: center;
}
.tx-tab--active .tx-tab__count { background: #e9efff; color: #573fe0; }

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

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  height: 32px;
  padding: 6px 12px;
  border-radius: 36px;
  border: none;
  font-size: 12px;
  white-space: nowrap;
}
/* Read-only here (no status-change modal), so no pointer cursor or chevron. */
.status-pill--static { cursor: default; }

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
.toolbar-row__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
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
