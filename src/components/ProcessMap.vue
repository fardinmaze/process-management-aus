<template>
  <div ref="root" class="relative w-full h-full bg-[#F4F6F8]">
    <div v-if="!items.length" class="absolute inset-0 flex items-center justify-center text-sm text-slate-500 p-6 text-center">
      The map appears here as soon as someone adds an activity.
    </div>
    <VueFlow
      v-else :id="vfId" :key="signature" :nodes="flow.nodes" :edges="flow.edges" :nodes-draggable="false" :nodes-connectable="false"
      :elements-selectable="true" :min-zoom="0.15" :max-zoom="1.6" :zoom-on-double-click="false" @init="onInit" @node-click="onPick" @pane-click="emit('select', null)"
    >
      <Background :gap="20" pattern-color="#e2e8f0" />
      <Controls :show-interactive="false" />
      <template #node-lane="{ data }">
        <div class="lane" :style="{ width: `${data.w}px`, height: `${data.h}px` }"><div class="lane__head" :style="{ width: `${data.headW}px` }">{{ data.role }}</div></div>
      </template>
      <template #node-step="{ data }">
        <div class="step" :class="[`step--${data.kind}`, { 'step--selected': data.selected, 'step--norole': data.kind === 'activity' && !data.roleSet }]" :style="{ width: `${data.w}px`, height: `${data.h}px` }">
          <svg v-if="data.kind === 'decision'" class="step__bg" viewBox="0 0 160 92" preserveAspectRatio="none" aria-hidden="true"><polygon points="80,2 158,46 80,90 2,46" fill="#FFF3B8" :stroke="data.selected ? '#0B2A4A' : '#E6BC00'" stroke-width="2" /></svg>
          <div class="step__body">
            <div v-if="data.section" class="step__sec">{{ data.section }}</div>
            <div class="step__label">{{ data.label }}</div>
            <div v-if="data.system" class="step__sys">{{ data.system }}</div>
          </div>
          <span v-if="data.badge" class="step__badge" :aria-label="`${data.badge} open comments`">{{ data.badge }}</span>
          <Handle id="l" type="target" :position="Position.Left" />
          <Handle id="r" type="source" :position="Position.Right" />
        </div>
      </template>
      <template #edge-routed="p">
        <BaseEdge :id="p.id" :path="p.data.path" :marker-end="p.markerEnd" :style="p.style" :label="p.label" :label-x="p.data.labelX" :label-y="p.data.labelY" :label-bg-padding="[4, 2]" :label-bg-border-radius="4" :label-style="{ fontSize: '11px', fontWeight: 600 }" />
      </template>
    </VueFlow>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { BaseEdge, MarkerType, Position, VueFlow, Handle } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { GEOM, layout } from '@/layout/layout'
import { pathOf } from '@/layout/route'

const props = defineProps({
  items: { type: Array, required: true },
  selectedId: { type: String, default: null },
  badges: { type: Object, default: () => ({}) },
  vfId: { type: String, default: 'process-map' },
})
const emit = defineEmits(['select'])
const root = ref(null)
defineExpose({ root })

const res = computed(() => layout(props.items, null, { allowLoops: true }))
// re-fit when the shape of the map changes, not on every keystroke in a label
const signature = computed(() => res.value.nodes.map((n) => `${n.id}:${n.lane}:${n.col}`).join('|'))

const flow = computed(() => {
  const r = res.value
  const byId = Object.fromEntries(r.nodes.map((n) => [n.id, n]))
  const nodes = [
    ...r.lanes.map((l) => ({ id: l.id, type: 'lane', position: { x: 0, y: l.y }, zIndex: -1, draggable: false, selectable: false, focusable: false, data: { role: l.role, w: l.w, h: l.h, headW: GEOM.laneHeaderW } })),
    ...r.nodes.map((n) => ({
      id: n.id, type: 'step', position: { x: n.x, y: n.y }, draggable: false, zIndex: 2,
      data: { kind: n.kind, w: n.w, h: n.h, label: n.kind === 'start' ? 'Start' : n.kind === 'end' ? 'End' : n.item.label, section: n.item?.section, system: n.item?.system, roleSet: n.item?.roleSet, selected: n.id === props.selectedId, badge: props.badges[n.id] || 0 },
    })),
  ]
  const edges = r.edges.map((e) => {
    const back = byId[e.target].col <= byId[e.source].col
    return {
      id: e.id, source: e.source, target: e.target, sourceHandle: 'r', targetHandle: 'l', label: e.label, type: 'routed', zIndex: 3, selectable: false,
      markerEnd: MarkerType.ArrowClosed, style: { stroke: back ? '#dc2626' : '#0067B1', strokeWidth: 1.75, strokeDasharray: back ? '6 4' : undefined },
      data: { path: pathOf(e.points), labelX: e.labelPos[0], labelY: e.labelPos[1] },
    }
  })
  return { nodes, edges }
})
// Show the start of the process at a readable size (not below 70%); the reader pans or zooms for the rest.
let flowInst = null
// when a step is picked in the outline, bring it into view on the map
watch(() => props.selectedId, (id) => {
  const n = id && res.value.nodes.find((x) => x.id === id)
  const el = root.value
  if (!n || !flowInst || !el) return
  const { x, y, zoom } = flowInst.getViewport()
  const left = n.x * zoom + x; const right = (n.x + n.w) * zoom + x
  if (left < 0 || right > el.clientWidth) flowInst.setCenter(n.x + n.w / 2, n.y + n.h / 2, { zoom, duration: 300 })
})
function onInit(inst) {
  flowInst = inst
  const el = root.value
  if (!el) return inst.fitView({ padding: 0.1 })
  const { width, height } = res.value
  const cw = el.clientWidth; const ch = el.clientHeight
  const zoom = Math.min(1, Math.max(0.7, Math.min(cw / (width + 40), ch / (height + 40))))
  inst.setViewport({ x: width * zoom + 40 <= cw ? (cw - width * zoom) / 2 : 12, y: Math.max(12, (ch - height * zoom) / 2), zoom })
}
function onPick({ node }) { emit('select', node.type === 'step' && !['START', 'END'].includes(node.id) ? node.id : null) }
</script>

<style scoped>
.lane { border-top: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1; background: repeating-linear-gradient(90deg, transparent 0 219px, #f1f5f9 219px 220px); }
.lane__head { height: 100%; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 13px; font-weight: 700; color: #0B2A4A; background: #EAF3FA; border-right: 1px solid #A6CDE9; padding: 0 8px; }
.step { position: relative; display: flex; align-items: center; justify-content: center; text-align: center; background: #fff; border: 2px solid #0067B1; border-radius: 4px; padding: 4px 8px; font-size: 13px; color: #1a1f24; cursor: pointer; }
.step--selected { box-shadow: 0 0 0 4px #FFD200; border-color: #0B2A4A; }
.step--norole { border-style: dashed; border-color: #CE9700; }
.step--start, .step--end { border-radius: 999px; font-weight: 700; cursor: default; }
.step--start { background: #f0fdf4; border-color: #16a34a; }
.step--end { background: #fef2f2; border-color: #dc2626; }
.step--decision { background: transparent; border: 0; border-radius: 0; box-shadow: none; }
.step__bg { position: absolute; inset: 0; width: 100%; height: 100%; }
.step__body { position: relative; z-index: 1; }
.step__label { font-weight: 600; line-height: 1.2; }
.step__sec { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #0067B1; }
.step__sys { font-size: 11px; color: #475569; }
.step__badge { position: absolute; top: -8px; right: -8px; z-index: 2; min-width: 18px; height: 18px; border-radius: 9px; background: #FFD200; color: #0B2A4A; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
:deep(.vue-flow__handle) { width: 6px; height: 6px; min-width: 0; min-height: 0; background: #94a3b8; border: 0; }
</style>
