<template>
<div class="page">
    <div class="page-header">
        <div>
            <h1 class="page-title">Activity Log</h1>
            <p class="page-subtitle">Browse all system activities</p>
        </div>
    </div>

    <div class="card filters">
        <div class="filters__row justify-between">
            <SearchBox v-model="filters.search_term" :active="!!$route.query.search_term" @search="reload" @clear="reload" />
            <button type="button" class="btn btn--filter" @click="filtersOpen = !filtersOpen">
                <i class="ri-filter-3-line" /> Filter
            </button>
        </div>

        <div v-show="filtersOpen" class="filters__row_open">
            <DatePicker :model-value="filters.start_date" placeholder="Start date" @update:model-value="onStartDateChange" />
            <DatePicker :model-value="filters.end_date" placeholder="End date" @update:model-value="onEndDateChange" />
            <select v-model="selectedDepartment" class="form-select" @change="onDepartmentChange">
                <option value="">Select Department</option>
                <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
            </select>
            <select v-if="selectedDepartment" v-model="selectedDesignation" class="form-select" @change="onDesignationChange">
                <option value="">Select Designation</option>
                <option v-for="d in designations" :key="d.id" :value="d.id">{{ d.title }}</option>
            </select>
            <select v-if="selectedDesignation" v-model="filters.employee" class="form-select" @change="onEmployeeChange">
                <option value="">All Employees</option>
                <option v-for="e in employeeOptions" :key="e.id" :value="e.id">{{ e.full_name ?? e.username }}</option>
            </select>

            <button class="btn btn--ghost" @click="resetFilters">
                <i class="ri-filter-off-line" /> Reset
            </button>
        </div>

        <div class="mt-4">
            <div v-if="loading" class="page-loader text-muted">Loading…</div>

            <div v-else-if="list.length" class="table-wrap">
                <table class="table">
                    <thead>
                        <tr>
                            <th>#NO</th>
                            <th>App</th>
                            <th>Model</th>
                            <th style="max-width:400px">Activity</th>
                            <th>Timestamp</th>
                            <th>User</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(row, idx) in list" :key="row.id">
                            <td>{{ rowNumber(idx) }}</td>
                            <td>{{ row.app ?? '—' }}</td>
                            <td>{{ row.model ?? '—' }}</td>
                            <td style="max-width:400px">{{ row.activity ?? '—' }}</td>
                            <td>{{ formatDateTime(row.timestamp) }}</td>  
                            <td>{{ row.user?.full_name }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div v-else class="empty-state">
                <i class="ri-discuss-line" />
                <h3>No activity log</h3>
                <p>No activities to show.</p>
            </div>

            <div v-if="count > 0" class="pagination">
                <Pagination :page="page" :last-page="lastPage" :per-page="perPage" @update:page="goTo" @update:per-page="onPerPageChange" />
            </div>
        </div>
    </div>
</div>
</template>

<script>
import { formatDateTime, capitalize } from '@/utils/helpers'
import {
    DEFAULT_PAGE_SIZE
} from '@/utils/constants'
import DatePicker from '@/components/common/DatePicker.vue'
import SearchBox from '@/components/common/SearchBox.vue'
import Pagination from '@/components/common/Pagination.vue'

export default {
    name: 'TicketListView',
    components: {
        DatePicker,
        SearchBox,
        Pagination
    },

    data() {
        return {
            filtersOpen: false,
            filters: {
                search_term: this.$route.query.search_term || '',
                start_date: this.$route.query.start_date || '',
                end_date: this.$route.query.end_date || '',
                employee: this.$route.query.employee || '',
            },
            selectedDepartment: '',
            selectedDesignation: '',
        }
    },

    computed: {
        list() {
            return this.$store.getters['activityLog/activity']
        },
        count() {
            return this.$store.getters['activityLog/activityCount'] || 0
        },
        loading() {
            return this.$store.getters['activityLog/submitLoading']
        },
        page() {
            return Number(this.$route.query.page) || 1
        },
        perPage() {
            return Number(this.$route.query.per_page) || DEFAULT_PAGE_SIZE
        },
        lastPage() {
            return Math.max(1, Math.ceil(this.count / this.perPage))
        },

        departments() {
            return this.$store.getters['department/departments']
        },
        designations() {
            return this.$store.getters['department/designationByDepartment']
        },
        employeeOptions() {
            return this.$store.getters['department/employeeByDesignation']
        },
    },

    watch: {
        '$route.query': {
            immediate: true,
            handler() {
                this.fetchList()
            },
        },
    },

    created() {
        this.$store.dispatch('department/fetchDepartments')
    },

    methods: {
        formatDateTime,

        rowNumber(idx) {
            return String((this.page - 1) * this.perPage + idx + 1).padStart(2, '0')
        },

        statusLabel(status) {
            return capitalize(status)
        },

        fetchList() {
            this.$store.dispatch('activityLog/fetchActivity', {
                currentPage: this.page,
                perPage: this.perPage,
                search_term: this.filters.search_term,
                start_date: this.filters.start_date,
                end_date: this.filters.end_date,
                raised_by: this.filters.employee,
            })
        },

        pushQuery(query) {
            this.$router.push({
                query: {
                    ...this.$route.query,
                    ...query
                }
            })
        },

        reload() {
            this.pushQuery({
                page: 1,
                search_term: this.filters.search_term || undefined,
                start_date: this.filters.start_date || undefined,
                end_date: this.filters.end_date || undefined,
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

        // Department/designation only narrow the dropdowns below them — picking
        // one never touches the ticket list itself.
        onDepartmentChange() {
            this.selectedDesignation = ''
            this.filters.employee = ''
            if (this.selectedDepartment) {
                this.$store.dispatch('department/fetchDesignationByDepartment', this.selectedDepartment)
            }
        },

        onDesignationChange() {
            this.filters.employee = ''
            if (this.selectedDesignation) {
                this.$store.dispatch('department/fetchEmployeeByDesignation', this.selectedDesignation)
            }
        },

        onEmployeeChange() {
            this.reload()
        },

        resetFilters() {
            this.filters = {
                search_term: '',
                start_date: '',
                end_date: '',
                employee: '',
            }
            this.selectedDepartment = ''
            this.selectedDesignation = ''
            this.$router.push({
                query: {}
            })
        },

        goTo(p) {
            this.pushQuery({
                page: p
            })
        },

        onPerPageChange(size) {
            this.pushQuery({
                page: 1,
                per_page: size
            })
        },
    },
}
</script>

<style scoped></style>
