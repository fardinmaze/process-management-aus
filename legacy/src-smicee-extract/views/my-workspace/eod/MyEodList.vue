<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">My EOD</h1>
        <p class="page-subtitle">Your submitted end-of-day reports</p>
      </div>
    
    </div>

    <div class="card filters">
      <div class="filters__row justify-between">
        <SearchBox v-model="filters.search_term" :active="!!$route.query.search_term" @search="reload" @clear="reload" />
        <router-link :to="{ name: 'EODCreate' }" class="btn btn--primary">
          <i class="ri-add-line" /> Submit New EOD
        </router-link>
        <button type="button" class="btn btn--filter" @click="filtersOpen = !filtersOpen">
          <i class="ri-filter-3-line" /> Filter
        </button>
      </div>

      <div v-show="filtersOpen" class="filters__row_open">
        <DatePicker
          class=""
          :model-value="filters.start_date"
          placeholder="Start date"
          @update:model-value="onStartDateChange"
        />
        <DatePicker
          class=""
          :model-value="filters.end_date"
          placeholder="End date"
          @update:model-value="onEndDateChange"
        />
        <select v-model="filters.status" class="form-select" @change="reload">
          <option value="">All Statuses</option>
          <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
        </select>
        <button class="btn btn--ghost" @click="resetFilters">
          <i class="ri-filter-off-line" /> Reset
        </button>
      </div>

      <div class="pt-4">
        <EodTable
          :list="list"
          :count="count"
          :loading="loading"
          :page="page"
          :per-page="perPage"
          :last-page="lastPage"
          details-route-name="MyEodDetails"
          @update:page="goTo"
          @update:per-page="onPerPageChange"
          @reload="fetchList"
          read-only
        />
      </div>
    </div>
  </div>
</template>

<script>
import { DEFAULT_PAGE_SIZE }        from '@/utils/constants'
import DatePicker                   from '@/components/common/DatePicker.vue'
import SearchBox                    from '@/components/common/SearchBox.vue'
import EodTable                     from '@/views/common/eod/EodTable.vue'
import { EOD_STATUS_LABELS }    from '@/utils/constants'

export default {
  name: 'MyEodListView',
  components: { DatePicker, SearchBox, EodTable },

  data() {
    return {
      statuses: EOD_STATUS_LABELS,
      filtersOpen: false,
      filters: {
        search_term: this.$route.query.search_term || '',
        start_date:  this.$route.query.start_date   || '',
        end_date:    this.$route.query.end_date     || '',
        status:      this.$route.query.status       || '',
      },
    }
  },

  computed: {
    list()    { return this.$store.getters['eod/myEod'] },
    count()   { return this.$store.getters['eod/count'] || 0 },
    loading() { return this.$store.getters['eod/eodLoading'] },
    page()    { return Number(this.$route.query.page) || 1 },
    perPage() { return Number(this.$route.query.per_page) || DEFAULT_PAGE_SIZE },
    lastPage(){ return Math.max(1, Math.ceil(this.count / this.perPage)) },
  },

  watch: {
    '$route.query': {
      immediate: true,
      handler() { this.fetchList() },
    },
  },

  created() {
    this.$store.dispatch('employee/fetchOptimisedEmployeeList')
  },

  methods: {
    fetchList() {
      this.$store.dispatch('eod/fetchMyEOD', {
        currentPage: this.page,
        perPage: this.perPage,
        search_term: this.filters.search_term,
        start_date: this.filters.start_date,
        end_date: this.filters.end_date,
        status: this.filters.status,
      })
    },

    pushQuery(query) {
      this.$router.push({ query: { ...this.$route.query, ...query } })
    },

    reload() {
      this.pushQuery({
        page: 1,
        search_term: this.filters.search_term || undefined,
        start_date: this.filters.start_date || undefined,
        end_date: this.filters.end_date || undefined,
        status: this.filters.status || undefined,
      })
    },

    onStartDateChange(val) {
      this.filters.start_date = val
      this.reload()
    },

    onEndDateChange(val) {
      this.filters.end_date = val
      this.reload()
    },

    resetFilters() {
      this.filters = { search_term: '', start_date: '', end_date: '', status: '' }
      this.$router.push({ query: {} })
    },

    goTo(p) {
      this.pushQuery({ page: p })
    },

    onPerPageChange(size) {
      this.pushQuery({ page: 1, per_page: size })
    },
  },
}
</script>

<style scoped>

</style>
