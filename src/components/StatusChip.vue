<template>
  <span class="chip" :class="cls">{{ label }}</span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ status: { type: String, required: true } })

const COLORS = {
  PLANNING: 'bg-slate-100 text-slate-600',
  UNASSIGNED: 'bg-slate-100 text-slate-600',
  ASSIGNED: 'bg-sky-100 text-sky-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  SUBMITTED: 'bg-amber-100 text-amber-700',
  IN_REVIEW: 'bg-amber-100 text-amber-700',
  CHANGES_REQUESTED: 'bg-red-100 text-red-700',
  APPROVED: 'bg-green-100 text-green-700',
  PUBLISHED: 'bg-emerald-100 text-emerald-700',
  SUPERSEDED: 'bg-slate-200 text-slate-500',
  OPEN: 'bg-amber-100 text-amber-700',
  RESOLVED: 'bg-green-100 text-green-700',
  PENDING: 'bg-amber-100 text-amber-700',
  ACCEPTED: 'bg-green-100 text-green-700',
  EXPIRED: 'bg-slate-200 text-slate-500',
  REVOKED: 'bg-red-100 text-red-700',
}
const cls = computed(() => COLORS[props.status] || 'bg-slate-100 text-slate-600')
const label = computed(() => props.status.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase()))
</script>
