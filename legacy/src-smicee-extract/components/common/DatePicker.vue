<template>
<div ref="root" class="dp">
    <button v-if="!inline" ref="trigger" type="button" class="form-select dp-trigger" @click="toggleOpen">
        <i class="ri-calendar-line dp-trigger__icon" />
        <span :class="{ 'dp-trigger__placeholder': !modelValue }">{{ displayLabel }}</span>
    </button>

    <!-- `inline` disables the teleport so the calendar renders in normal flow
         right where it's used (e.g. an always-visible page calendar) instead
         of as a floating popover — same markup/size either way. -->
    <Teleport to="body" :disabled="inline">
        <div v-if="inline || open" ref="popover" class="dp-popover" :class="{ 'dp-popover--inline': inline }" :style="popoverStyle">
            <div class="dp-header">
                <button type="button" class="dp-nav-btn" title="Previous month" @click="prevMonth">
                    <i class="ri-arrow-left-s-line" />
                </button>

                <div class="dp-dropdowns">
                    <div class="dp-dropdown">
                        <span>{{ monthNames[viewMonth] }}</span>
                        <i class="ri-arrow-down-s-line dp-dropdown__chevron" />
                        <select class="dp-dropdown__select" :value="viewMonth" @change="onMonthChange">
                            <option v-for="(m, idx) in monthNames" :key="m" :value="idx">{{ m }}</option>
                        </select>
                    </div>
                    <div class="dp-dropdown">
                        <span>{{ viewYear }}</span>
                        <i class="ri-arrow-down-s-line dp-dropdown__chevron" />
                        <select class="dp-dropdown__select" :value="viewYear" @change="onYearChange">
                            <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
                        </select>
                    </div>
                </div>

                <button type="button" class="dp-nav-btn" title="Next month" @click="nextMonth">
                    <i class="ri-arrow-right-s-line" />
                </button>
            </div>

            <div class="dp-weekdays">
                <span v-for="d in weekDays" :key="d">{{ d }}</span>
            </div>

            <div class="dp-grid">
                <button v-for="cell in cells" :key="cell.iso" type="button" class="dp-day" :class="{
              'dp-day--muted':    !cell.inMonth || cell.disabled,
              'dp-day--today':    cell.iso === todayIso,
              'dp-day--selected': cell.iso === modelValue,
              'dp-day--marked':   cell.marked,
            }" :title="cell.marked ? cell.markedLabel : ''" :aria-disabled="!cell.inMonth || cell.disabled" @click="selectDay(cell)">
                    {{ cell.day }}
                </button>
            </div>
        </div>
    </Teleport>
</div>
</template>

<script>
import dayjs from 'dayjs'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export default {
    name: 'DatePicker',

    props: {
        modelValue: {
            type: String,
            default: ''
        },
        placeholder: {
            type: String,
            default: 'Select date'
        },
        // ISO date string ('YYYY-MM-DD'); days strictly before it render muted
        // and can't be picked. Empty string (default) disables no days.
        min: {
            type: String,
            default: ''
        },
        // Renders the calendar body in normal document flow (no trigger button,
        // no popover/teleport) — same markup, size, and styling as the popover,
        // for pages that show an always-visible month calendar.
        inline: {
            type: Boolean,
            default: false
        },
        // ISO date strings ('YYYY-MM-DD') to mark distinctly from `modelValue`
        // (e.g. holiday days on an inline calendar).
        highlightedDates: {
            type: Array,
            default: () => []
        },
        // Optional iso -> tooltip text map for marked days.
        markedLabels: {
            type: Object,
            default: () => ({})
        },
        // Weekday numbers (0=Sunday..6=Saturday) that can't be picked, e.g.
        // the org's configured weekend days.
        disabledWeekdays: {
            type: Array,
            default: () => []
        },
        // ISO date strings ('YYYY-MM-DD') that can't be picked, e.g. HR
        // holiday dates.
        disabledDates: {
            type: Array,
            default: () => []
        },
    },
    emits: ['update:modelValue'],

    data() {
        const base = this.modelValue ? dayjs(this.modelValue) : dayjs()
        return {
            open: false,
            viewYear: base.year(),
            viewMonth: base.month(),
            monthNames: MONTH_NAMES,
            weekDays: WEEK_DAYS,
            popoverStyle: {},
        }
    },

    computed: {
        todayIso() {
            return dayjs().format('YYYY-MM-DD')
        },

        displayLabel() {
            return this.modelValue ? dayjs(this.modelValue).format('DD MMM YYYY') : this.placeholder
        },

        yearOptions() {
            const current = dayjs().year()
            const years = []
            for (let y = current + 5; y >= current - 90; y--) years.push(y)
            return years
        },

        // Full weeks (leading/trailing days from adjacent months included, dimmed)
        cells() {
            const startOfMonth = dayjs().year(this.viewYear).month(this.viewMonth).date(1)
            const daysInMonth = startOfMonth.daysInMonth()
            const leading = startOfMonth.day()
            const totalCells = Math.ceil((leading + daysInMonth) / 7) * 7

            const cells = []
            for (let i = 0; i < totalCells; i++) {
                const date = startOfMonth.add(i - leading, 'day')
                const iso = date.format('YYYY-MM-DD')
                cells.push({
                    day: date.date(),
                    iso,
                    inMonth: date.month() === this.viewMonth,
                    disabled: (this.min ? iso < this.min : false)
                        || this.disabledWeekdays.includes(date.day())
                        || this.disabledDates.includes(iso),
                    marked: this.highlightedDates.includes(iso),
                    markedLabel: this.markedLabels[iso] ?? ''
                })
            }
            return cells
        },
    },

    watch: {
        modelValue(val) {
            if (!val) return
            const d = dayjs(val)
            this.viewYear = d.year()
            this.viewMonth = d.month()
        },
    },

    mounted() {
        document.addEventListener('mousedown', this.handleClickOutside)
    },
    beforeUnmount() {
        document.removeEventListener('mousedown', this.handleClickOutside)
    },

    methods: {
        toggleOpen() {
            if (this.open) {
                this.open = false
                return
            }
            const rect = this.$refs.trigger.getBoundingClientRect()
            this.popoverStyle = {
                position: 'absolute',
                top: `${rect.bottom + window.scrollY + 6}px`,
                left: `${rect.left + window.scrollX}px`,
            }
            this.open = true
        },

        handleClickOutside(e) {
            if (!this.open) return
            if (this.$refs.root ?.contains(e.target)) return
            if (this.$refs.popover ?.contains(e.target)) return
            this.open = false
        },

        prevMonth() {
            const d = dayjs().year(this.viewYear).month(this.viewMonth).subtract(1, 'month')
            this.viewYear = d.year()
            this.viewMonth = d.month()
        },
        nextMonth() {
            const d = dayjs().year(this.viewYear).month(this.viewMonth).add(1, 'month')
            this.viewYear = d.year()
            this.viewMonth = d.month()
        },
        onMonthChange(e) {
            this.viewMonth = Number(e.target.value)
        },
        onYearChange(e) {
            this.viewYear = Number(e.target.value)
        },

        selectDay(cell) {
            if (!cell.inMonth || cell.disabled) return
            this.$emit('update:modelValue', cell.iso)
            this.open = false
        },
    },
}
</script>

<style scoped>
.dp {
    position: relative;
    display: inline-flex;
}

.dp-trigger {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 168px;
    text-align: left;
    background-image: none !important;
    padding-right: 12px !important;
}

.dp-trigger__icon {
    color: #A3A3A4;
    flex-shrink: 0;
}

.dp-trigger__placeholder {
    color: #A3A3A4;
}

.dp-popover {
    z-index: 1100;
    width: 288px;
    background: #fff;
    border: 1px solid #DCDCDC;
    border-radius: 10px;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.dp-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.dp-nav-btn {
    width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    border-radius: 6px;
    cursor: pointer;
    color: #272727;
    transition: background-color .15s;
}

.dp-nav-btn:hover {
    background: #F9F9F9;
}

.dp-dropdowns {
    display: flex;
    align-items: center;
    gap: 6px;
}

.dp-dropdown {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 32px;
    padding: 0 4px 0 8px;
    border: 1px solid #DCDCDC;
    border-radius: 8px;
    background: #fff;
    box-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
    font-size: 14px;
    font-weight: 500;
    color: #272727;
    cursor: pointer;
}

.dp-dropdown__chevron {
    font-size: 12px;
    color: #6E6E6F;
}

.dp-dropdown__select {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
}

.dp-weekdays {
    display: grid;
    grid-template-columns: repeat(7, 32px);
    justify-content: space-between;
}

.dp-weekdays span {
    height: 21px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: #A3A3A4;
}

.dp-grid {
    display: grid;
    grid-template-columns: repeat(7, 32px);
    row-gap: 8px;
    justify-content: space-between;
}

.dp-day {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: none;
    background: transparent;
    font-size: 14px;
    color: #272727;
    cursor: pointer;
    transition: background-color .15s;
}

.dp-day:hover:not(.dp-day--muted) {
    background: #F9F9F9;
}

.dp-day--muted {
    opacity: 0.4;
    cursor: default;
}

.dp-day--today {
    background: #121212;
    color: #F9F9F9;
    @apply hover:border hover:border-[#121212] hover:text-[#121212];
}

.dp-day--selected:not(.dp-day--today) {
    border: 1px solid #4010BD;
    color: #573FE0;
}

.dp-day--marked:not(.dp-day--today) {
    @apply bg-accent-50 text-accent-600;
    font-weight: 600;
}

.dp-day--marked.dp-day--today {
    @apply bg-accent-600 text-white hover:bg-accent-50 hover:text-accent-600 hover:font-[600];
}

/* Embedded in normal flow instead of floating — same box, no shadow needed
   since it now sits inside the page's own card/border. Flex/grid items get
   their own stacking context from z-index even without `position` set, so
   the popover's z-index: 500 (meant to float above everything) would still
   lift this above the fixed topbar/sidebar (z-[210]/z-[200]) on scroll —
   reset it back to the normal flow's stacking order. */
.dp-popover--inline {
    z-index: auto;
    box-shadow: none;
}
</style>
