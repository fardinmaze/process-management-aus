<template>
<div class="page">
    <div class="page-header">
        <div>
            <h1 class="page-title">EOD Sheet</h1>
            <p class="page-subtitle"> Consolidated EOD submissions by employee</p>
        </div>

    </div>

    <div class="card filters">
        <!-- <div class="filters__row justify-end">
            <SearchBox v-model="filters.search_term" :active="!!$route.query.search_term" @search="reload" @clear="reload" />
            <button type="button" class="btn btn--filter" @click="filtersOpen = !filtersOpen">
                <i class="ri-filter-3-line" /> Filter
            </button>
        </div> -->

        <div v-show="filtersOpen" class="filters__row_open">

            <!-- Month -->
            <select v-model="filters.month" class="form-select" @change="reload">
                <option value="">All Months</option>

                <option v-for="month in months" :key="month.value" :value="month.value">
                    {{ month.label }}
                </option>
            </select>

            <!-- Year -->
            <select v-model="filters.year" class="form-select" @change="onYearChange">
                <option value="">All Years</option>
                <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
            </select>

            <button class="btn btn--ghost" @click="resetFilters">
                <i class="ri-filter-off-line" />
                Reset
            </button>

        </div>

        <div class="pt-4">
            <div v-if="loading" class="page-loader text-muted">Loading…</div>

            <div v-else-if="list.length" class="table-wrap">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Submission</th>

                            <th v-for="item in tableData[0]?.eod || []" :key="item.date" class="text-center">
                                {{ item.label }}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="employee in tableData" :key="employee.user_id.id">
                            <td>
                               <p class="title-link">{{ employee.user_id.full_name }}</p>
                            </td>
                            <td>
                                <span class="font-medium">
                                    {{ employee.submissionCount }} / {{ employee.totalDays }}
                                </span>
                            </td>

                            <td v-for="item in employee.eod" :key="item.date">
                                <i :class="item.submission ? 'ri-check-line text-success' : 'ri-close-line text-danger'" />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div v-else class="empty-state">
                <i class="ri-calendar-check-line" />
                <h3>Nothing to show yet</h3>
                <p>A per-employee EOD summary will appear here.</p>

            </div>

            <div v-if="count > 0" class="pagination">
                <Pagination :page="page" :last-page="lastPage" :per-page="perPage" @update:page="goTo" @update:per-page="onPerPageChange" />
            </div>
        </div>
    </div>
</div>
</template>

<script>
import {
    formatDate,
    capitalize
} from '@/utils/helpers'
import {
    DEFAULT_PAGE_SIZE
} from '@/utils/constants'

import Pagination from '@/components/common/Pagination.vue'
export default {
    name: 'AdminEODSheet',
    components: {
        Pagination
    },

    data() {
        const today = new Date()
        return {
            filtersOpen: false,

            months: [{
                    label: 'January',
                    value: 1
                },
                {
                    label: 'February',
                    value: 2
                },
                {
                    label: 'March',
                    value: 3
                },
                {
                    label: 'April',
                    value: 4
                },
                {
                    label: 'May',
                    value: 5
                },
                {
                    label: 'June',
                    value: 6
                },
                {
                    label: 'July',
                    value: 7
                },
                {
                    label: 'August',
                    value: 8
                },
                {
                    label: 'September',
                    value: 9
                },
                {
                    label: 'October',
                    value: 10
                },
                {
                    label: 'November',
                    value: 11
                },
                {
                    label: 'December',
                    value: 12
                },
            ],

            years: (() => {
                const current = today.getFullYear()
                const list = []
                for (let y = current; y >= current - 15; y--) list.push(y)
                return list
            })(),

            filters: {
                month: this.$route.query.month || today.getMonth() + 1,
                year: this.$route.query.year || today.getFullYear(),
            },

        }
    },

    computed: {
        list() {
            return this.$store.getters['eod/eodSheet']
        },
        count() {
            return this.$store.getters['eod/sheetCount'] || 0
        },
        loading() {
            return this.$store.getters['eod/eodLoading']
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
        tableData() {
            return this.list.map(employee => {
                const submittedCount = employee.eod.filter(item => item.submission).length

                return {
                    ...employee,
                    submissionCount: submittedCount,
                    totalDays: employee.eod.length,
                    eod: employee.eod.map(item => ({
                        ...item,
                        label: this.formatDate(item.date),
                    })),
                }
            })
        },

    },

    watch: {
        '$route.query': {
            immediate: true,
            handler() {
                this.fetchList()
                this.filtersOpen = true
            },
        },
    },

    created() {
        if (!this.$route.query.month && !this.$route.query.year) {
            this.reload()
        }

    },

    methods: {
        formatDate,
        capitalize,
        // Row number that keeps counting across pages instead of restarting at 1.
        rowNumber(idx) {
            return String((this.page - 1) * this.perPage + idx + 1).padStart(2, '0')
        },

        fetchList() {
            this.$store.dispatch('eod/fetchEODSheet', {
                currentPage: this.page,
                perPage: this.perPage,
                month: this.filters.month,
                year: this.filters.year,

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
                month: this.filters.month || undefined,
                year: this.filters.year || undefined,

            })
        },

        onMonthChange(val) {
            this.filters.month = val
            this.reload()
        },

        onYearChange() {
            this.reload()
        },

        resetFilters() {
  const today = new Date()

  this.filters = {
    month: today.getMonth() + 1,
    year: today.getFullYear(),
  }

  this.$router.push({
    query: {
      page: 1,
      month: this.filters.month,
      year: this.filters.year,
    },
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

<style scoped>
.table th,
.table td {
    text-align: center;
    white-space: nowrap;
}

.employee-cell {
    text-align: left;
    min-width: 220px;
}

.avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
    margin-right: 8px;
    vertical-align: middle;
}

.text-success {
    color: #16a34a;
    font-size: 18px;
}

.text-danger {
    color: #ef4444;
    font-size: 18px;
}
</style>
