<template>
  <div class="shape" :class="[`shape--${type}`, { 'shape--selected': selected, 'shape--readonly': data.ui?.readonly }]" :title="data.ui?.lockedByRef ? 'Other sections connect to this step, so it cannot be deleted.' : ''">
    <!-- Closed shape palette: start | end | task | decision | subprocess | document | note -->
    <svg v-if="type === 'decision'" class="shape__bg" viewBox="0 0 150 90" preserveAspectRatio="none" aria-hidden="true">
      <polygon points="75,2 148,45 75,88 2,45" fill="#fff7ed" stroke="#f59e0b" stroke-width="2" />
    </svg>
    <div class="shape__body">
      <div v-if="type === 'subprocess'" class="shape__tag">Sub-process</div>
      <div v-if="type === 'document'" class="shape__tag">Document</div>
      <div class="shape__label">{{ data.label || placeholder }}</div>
      <div v-if="data.role && type !== 'note'" class="shape__meta">{{ data.role }}</div>
    </div>
    <span v-if="data.ui?.commentCount" class="shape__badge" aria-label="Open comments">{{ data.ui.commentCount }}</span>

    <!-- loose connection mode: every handle can start or end a connection. Only editable steps may START one. -->
    <Handle id="t" type="source" :position="Position.Top" :connectable-start="!data.ui?.readonly" :connectable-end="true" />
    <Handle id="r" type="source" :position="Position.Right" :connectable-start="!data.ui?.readonly" :connectable-end="true" />
    <Handle id="b" type="source" :position="Position.Bottom" :connectable-start="!data.ui?.readonly" :connectable-end="true" />
    <Handle id="l" type="source" :position="Position.Left" :connectable-start="!data.ui?.readonly" :connectable-end="true" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'

const props = defineProps({ id: String, type: String, data: { type: Object, required: true }, selected: Boolean })
const placeholder = computed(() => ({ start: 'Start', end: 'End', task: 'New task', decision: 'Decision?', subprocess: 'Linked process', document: 'Document', note: 'Note' }[props.type] || ''))
</script>

<style scoped>
.shape { position: relative; width: 150px; min-height: 52px; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 12px; background: #fff; border: 2px solid #94a3b8; border-radius: 8px; padding: 6px 10px; color: #0f172a; }
.shape--selected { box-shadow: 0 0 0 3px #c7d2fe; }
.shape--readonly { opacity: .92; }
.shape__body { position: relative; z-index: 1; max-width: 100%; }
.shape__label { font-weight: 600; word-break: break-word; }
.shape__meta { font-size: 10px; color: #64748b; margin-top: 2px; }
.shape__tag { font-size: 9px; text-transform: uppercase; letter-spacing: .05em; color: #6366f1; }
.shape--start { border-radius: 999px; border-color: #16a34a; background: #f0fdf4; }
.shape--end { border-radius: 999px; border-color: #dc2626; background: #fef2f2; }
.shape--task { border-color: #3b82f6; background: #eff6ff; }
.shape--decision { width: 150px; min-height: 90px; border: 0; background: transparent; border-radius: 0; }
.shape__bg { position: absolute; inset: 0; width: 100%; height: 100%; }
.shape--subprocess { border-color: #8b5cf6; background: #f5f3ff; border-style: double; border-width: 5px; }
.shape--document { border-color: #0891b2; background: #ecfeff; border-radius: 4px 4px 14px 4px; }
.shape--note { border-color: #eab308; background: #fef9c3; border-style: dashed; font-weight: 400; }
.shape__badge { position: absolute; top: -8px; right: -8px; z-index: 2; min-width: 18px; height: 18px; border-radius: 9px; background: #f59e0b; color: #fff; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
:deep(.vue-flow__handle) { width: 9px; height: 9px; background: #6366f1; border: 2px solid #fff; }
.shape--readonly :deep(.vue-flow__handle) { background: #94a3b8; }
</style>
