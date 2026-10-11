<template>
  <div class="card p-4 approved-by">
    <div class="approved-by__header">
      <div class="approved-by__header-row">
        <p class="approved-by__title">{{ title }}</p>
        <slot name="action" />
      </div>
      <div class="approved-by__divider" />
    </div>

    <div v-if="rows.length" class="approved-by__list">
      <span
        v-for="(row, idx) in rows"
        :key="row.id ?? idx"
        class="approval-pill"
        :class="pillClass(row.status)"
      >
        <span class="approval-pill__avatar" :class="{ 'approval-pill__avatar--lg': row.status !== 'pending' }">
          <img v-if="row.photo" :src="row.photo" :alt="row.name" />
          <span v-else>{{ getInitials(row.name) }}</span>
        </span>

        <span v-if="row.status === 'pending'" class="approval-pill__name">{{ row.name }}</span>
        <span v-else class="approval-pill__body">
          <span class="approval-pill__name">{{ row.name }}</span>
          <span v-if="row.dateTime" class="approval-pill__meta">
            <span>{{ datePart(row.dateTime) }}</span>
            <span>{{ timePart(row.dateTime) }}</span>
          </span>
        </span>

        <i :class="statusIcon(row.status)" class="approval-pill__icon" />
      </span>
    </div>

    <p v-else class="text-muted text-sm">{{ emptyText }}</p>
  </div>
</template>

<script>
import { getInitials } from '@/utils/helpers'

// Reusable "who approved this and when" chip list — a wrapped row of
// pending/approved/rejected pills (avatar + name [+ date/time] + status
// icon). Status-driven styling so it can be reused wherever a report or
// request needs a per-approver sign-off view (EOD details today; purchase
// requisitions, leave, etc. later).
export default {
  name: 'ApprovedByTable',

  props: {
    title:     { type: String, default: 'Approved by' },
    rows:      { type: Array,  default: () => [] }, // [{ id, name, photo, dateTime, status: 'approved'|'pending'|'rejected' }]
    emptyText: { type: String, default: 'No approvals yet.' },
  },

  methods: {
    getInitials,

    pillClass(status) {
      return {
        'approval-pill--approved': status === 'approved',
        'approval-pill--rejected': status === 'rejected',
        'approval-pill--pending':  status !== 'approved' && status !== 'rejected',
      }
    },

    statusIcon(status) {
      if (status === 'approved') return 'ri-checkbox-circle-fill approval-pill__icon--approved'
      if (status === 'rejected') return 'ri-close-circle-fill approval-pill__icon--rejected'
      return 'ri-indeterminate-circle-line approval-pill__icon--pending'
    },

    // dateTime arrives pre-formatted as "26 Jul 2026, 04:28 PM" (DISPLAY_DATETIME)
    // — split on the comma to lay date/time out as two short lines, matching the design.
    datePart(dateTime) { return dateTime?.split(',')[0]?.trim() ?? '' },
    timePart(dateTime) { return dateTime?.split(',')[1]?.trim() ?? '' },
  },
}
</script>

<style scoped>
.approved-by__header { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
.approved-by__header-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.approved-by__title { margin: 0; font-size: 18px; font-weight: 500; color: #272727; }
.approved-by__divider { height: 1px; background: #DCDCDC; width: 100%; }

.approved-by__list { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 8px; }

.approval-pill {
  display: inline-flex; align-items: center; gap: 10px;
  border-radius: 999px; border: 1px solid transparent;
}

.approval-pill--pending  { background: #F9F9F9; border-color: #DCDCDC; padding: 6px; }
.approval-pill--approved { background: #EBFFED; border-color: #BAEFBF; padding: 6px 16px; }
.approval-pill--rejected { background: #FFDEDC; border-color: #FFC2C0; padding: 6px 16px; }

.approval-pill__avatar {
  width: 18px; height: 18px; border-radius: 50%; flex-shrink: 0; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  background: #573FE0; color: #fff; font-size: 8px; font-weight: 700;
}
.approval-pill__avatar--lg { width: 24px; height: 24px; font-size: 10px; }
.approval-pill__avatar img { width: 100%; height: 100%; object-fit: cover; }

/* Same neutral color as the Acknowledged by card's .eod-pill__name
   (EodDetails.vue) regardless of status — approved/pending/rejected is
   already conveyed by the pill background and icon, so the text itself
   stays consistent between the two adjacent side-column cards. */
.approval-pill__name { font-size: 12px; color: #3D3D3E; white-space: nowrap; font-weight: 500; }

.approval-pill__body { display: flex; flex-direction: column; gap: 2px; }
.approval-pill__meta { display: flex; gap: 10px; font-size: 10px; color: #3D3D3E; white-space: nowrap; }

.approval-pill__icon { font-size: 16px; flex-shrink: 0; }
.approval-pill__icon--approved { color: #008610; }
.approval-pill__icon--rejected { color: #BF0022; }
.approval-pill__icon--pending  { color: #A3A3A4; }
</style>
