<template>
  <div class="frame" :class="{ 'frame--locked': !data.editable, 'frame--mine': data.editable }">
    <div class="frame__head">
      <span class="frame__title">{{ data.title }}</span>
      <span class="frame__meta">{{ data.assigneeName || 'Unassigned' }}</span>
      <span class="frame__status" :class="`st-${data.status}`">{{ statusLabel }}</span>
      <span v-if="!data.editable" class="frame__lock" title="Read-only for you">Locked</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ data: { type: Object, required: true } })
const statusLabel = computed(() => props.data.status.replace(/_/g, ' ').toLowerCase())
</script>

<style scoped>
.frame { width: 100%; height: 100%; border: 2px dashed #a5b4fc; background: rgba(238, 242, 255, .45); border-radius: 14px; pointer-events: none; }
.frame--locked { border-color: #cbd5e1; background: rgba(241, 245, 249, .7); }
.frame--mine { border-style: solid; border-color: #6366f1; background: rgba(238, 242, 255, .6); }
.frame__head { display: flex; align-items: center; gap: 10px; padding: 8px 14px; font-size: 12px; }
.frame__title { font-weight: 700; color: #1e1b4b; font-size: 13px; }
.frame--locked .frame__title { color: #475569; }
.frame__meta { color: #64748b; }
.frame__status { padding: 1px 8px; border-radius: 999px; background: #e2e8f0; color: #334155; font-size: 10px; font-weight: 600; text-transform: capitalize; }
.st-APPROVED { background: #dcfce7; color: #166534; }
.st-SUBMITTED { background: #fef3c7; color: #92400e; }
.st-CHANGES_REQUESTED { background: #fee2e2; color: #991b1b; }
.st-IN_PROGRESS { background: #dbeafe; color: #1e40af; }
.frame__lock { margin-left: auto; font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: .05em; }
</style>
