<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">EOD List</h1>
        <p class="page-subtitle">All employee end-of-day reports.</p>
      </div>
      
    </div>

    <div class="card filters">
      <div class="filters__row justify-between">
        <SearchBox v-model="filters.search_term" :active="!!$route.query.search_term" @search="reload" @clear="reload" />
        <!-- <router-link :to="{ name: 'EODCreate' }" class="btn btn--primary">
        <i class="ri-add-line" /> Submit New EOD
      </router-link> -->
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

        <select v-model="filters.department" class="form-select" @change="onDepartmentChange">
          <option value="">All Departments</option>
          <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
        </select>
        <select v-model="filters.designation" class="form-select" :disabled="!filters.department" @change="onDesignationChange">
          <option value="">All Designations</option>
         
          <option v-for="d in designationOptions" :key="d.id" :value="d.id">{{ d.title }}</option>
        </select>
        <select v-model="filters.employee" class="form-select" :disabled="!filters.designation" @change="onEmployeeChange">
          <option value="">All Employees</option>
          <option v-for="e in employeeOptions" :key="e.id" :value="e.id">{{ employeeName(e) }}</option>
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
          details-route-name="AdminEODDetails"
          @update:page="goTo"
          @update:per-page="onPerPageChange"
          @reload="fetchList"
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
  name: 'AdminEodListView',
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
        department:  this.$route.query.department   || '',
        designation: this.$route.query.designation  || '',
        employee:    this.$route.query.employee     || '',
      },
    }
  },

  computed: {
    list()    { return this.$store.getters['eod/allEod'] },
    count()   { return this.$store.getters['eod/allEodCount'] || 0 },
    loading() { return this.$store.getters['eod/eodLoading'] },
    page()    { return Number(this.$route.query.page) || 1 },
    perPage() { return Number(this.$route.query.per_page) || DEFAULT_PAGE_SIZE },
    lastPage(){ return Math.max(1, Math.ceil(this.count / this.perPage)) },

    departments()        { return this.$store.getters['department/departments'] },
    designationOptions()  { return this.$store.getters['department/designationByDepartment'] },
    employeeOptions()     { return this.$store.getters['department/employeeByDesignation'] },
  },

  watch: {
    '$route.query': {
      immediate: true,
      handler() { this.fetchList() },
    },
  },

  created() {
    this.$store.dispatch('employee/fetchOptimisedEmployeeList')
    this.$store.dispatch('department/fetchDepartments')

    // Deep-link support: rebuild the cascade if the page was loaded with
    // department/designation already present in the URL.
    if (this.filters.department) {
      this.$store.dispatch('department/fetchDesignationByDepartment', this.filters.department)
    }
    if (this.filters.designation) {
      this.$store.dispatch('department/fetchEmployeeByDesignation', this.filters.designation)
    }
  },

  methods: {
    employeeName(e) {
      return e?.full_name
        || [e?.first_name, e?.last_name].filter(Boolean).join(' ')
        || e?.username
        || 'Unknown'
    },

    fetchList() {
      this.$store.dispatch('eod/fetchAllEOD', {
        currentPage: this.page,
        perPage: this.perPage,
        start_date: this.filters.start_date,
        end_date: this.filters.end_date,
        status: this.filters.status,
        reported_by: this.filters.employee,
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
        department: this.filters.department || undefined,
        designation: this.filters.designation || undefined,
        employee: this.filters.employee || undefined,
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

    onDepartmentChange() {
      this.filters.designation = ''
      this.filters.employee = ''
      if (this.filters.department) {
        this.$store.dispatch('department/fetchDesignationByDepartment', this.filters.department)
      }
      this.reload()
    },

    onDesignationChange() {
      this.filters.employee = ''
      if (this.filters.designation) {
        this.$store.dispatch('department/fetchEmployeeByDesignation', this.filters.designation)
      }
      this.reload()
    },

    onEmployeeChange() {
      this.reload()
    },

    resetFilters() {
      this.filters = {
        search_term: '', start_date: '', end_date: '', status: '',
        department: '', designation: '', employee: '',
      }
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
