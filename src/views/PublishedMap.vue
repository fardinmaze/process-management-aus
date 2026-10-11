<template>
  <div class="flex flex-col bg-white" style="height: calc(100vh - 3.5rem)">
    <div class="h-12 shrink-0 border-b border-slate-200 flex items-center gap-3 px-4 text-sm">
      <router-link to="/published" class="btn btn-sm no-underline">Back</router-link>
      <div class="font-semibold truncate">{{ map?.title }} <span class="text-slate-400 font-normal">v{{ map?.versionNo }}</span></div>
      <span v-if="map" class="text-xs text-slate-400">{{ map.code }} · owner {{ map.ownerName }} · published {{ fmtDate(map.publishedAt) }}</span>
      <div class="flex-1" />
      <button class="btn btn-sm" :disabled="exporting" @click="exportFile('png')">Export PNG</button>
      <button class="btn btn-sm" :disabled="exporting" @click="exportFile('pdf')">Export PDF</button>
    </div>
    <p v-if="error" class="p-6 text-red-600">{{ error }}</p>
    <div v-else class="flex flex-1 min-h-0">
      <div ref="canvasEl" class="flex-1 min-w-0 relative bg-slate-50">
        <VueFlow
          :id="VF_ID" v-model:nodes="nodes" v-model:edges="edges" :connection-mode="ConnectionMode.Loose"
          :nodes-draggable="false" :nodes-connectable="false" :elements-selectable="true" :min-zoom="0.2" :max-zoom="2"
        >
          <template v-for="t in NODE_TYPES" :key="t.type" #[`node-${t.type}`]="p"><ShapeNode v-bind="p" /></template>
          <template #node-section="p"><SectionNode v-bind="p" /></template>
          <Background :gap="20" pattern-color="#e2e8f0" />
          <Controls :show-interactive="false" />
        </VueFlow>
      </div>

      <aside class="w-80 shrink-0 border-l border-slate-200 overflow-y-auto p-4 text-sm">
        <template v-if="sel">
          <div class="text-[11px] uppercase font-bold text-slate-400 mb-1">{{ sel.type }} · {{ sectionTitle(sel.data.sectionId) }}</div>
          <h3 class="mt-0 mb-2">{{ sel.data.label || '(no label)' }}</h3>
          <p v-if="sel.data.description" class="mt-0 text-slate-600">{{ sel.data.description }}</p>
          <dl class="m-0 text-xs">
            <template v-if="sel.data.role"><dt class="font-semibold text-slate-500">Responsible role</dt><dd class="m-0 mb-2">{{ sel.data.role }}</dd></template>
            <template v-if="sel.data.system"><dt class="font-semibold text-slate-500">System</dt><dd class="m-0 mb-2">{{ sel.data.system }}</dd></template>
            <template v-if="sel.data.duration_minutes"><dt class="font-semibold text-slate-500">Duration</dt><dd class="m-0 mb-2">{{ sel.data.duration_minutes }} minutes</dd></template>
          </dl>
          <router-link v-if="sel.data.linked_map_id" :to="`/published/${sel.data.linked_map_id}`" class="text-xs">Open linked map</router-link>
          <div v-if="stepDocs.length" class="mt-2">
            <div class="font-semibold text-xs text-slate-500">Documents</div>
            <button v-for="a in stepDocs" :key="a.id" class="block bg-transparent border-0 p-0 text-brand-700 underline cursor-pointer text-xs mb-1" @click="download(a)">{{ a.attachTitle }}</button>
          </div>
        </template>
        <template v-else>
          <p class="mt-0 text-slate-500">Click a step to read its details.</p>
          <p v-if="map?.changeNote" class="text-xs text-slate-500">Change note: {{ map.changeNote }}</p>
          <div v-if="map?.attachments.length">
            <div class="font-semibold text-xs text-slate-500 mb-1">Documents</div>
            <button v-for="a in map.attachments" :key="a.id" class="block bg-transparent border-0 p-0 text-brand-700 underline cursor-pointer text-xs mb-1" @click="download(a)">{{ a.attachTitle }}</button>
          </div>
        </template>

        <form class="mt-6 pt-4 border-t border-slate-200" @submit.prevent="sendFeedback">
          <h4 class="mt-0 mb-1">Send feedback</h4>
          <p class="text-xs text-slate-500 mt-0">{{ sel ? 'About the selected step.' : 'About this map.' }} The owner is notified.</p>
          <textarea v-model="feedback" class="input mb-2" rows="3" placeholder="What is unclear or wrong?" required />
          <button class="btn btn-primary btn-sm">Send feedback</button>
        </form>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { ConnectionMode, VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'
import { call } from '@/api'
import { toast, errMsg } from '@/session'
import { NODE_TYPES, fmtDate } from '@/util'
import { buildFlow } from '@/graph'
import ShapeNode from '@/components/ShapeNode.vue'
import SectionNode from '@/components/SectionNode.vue'

const props = defineProps({ id: { type: [String, Number], required: true } })
const VF_ID = 'viewer'
const { onNodeClick, onPaneClick, fitView, getNodes } = useVueFlow(VF_ID)

const map = ref(null)
const nodes = ref([])
const edges = ref([])
const error = ref('')
const feedback = ref('')
const selectedId = ref(null)
const exporting = ref(false)
const canvasEl = ref(null)

const sel = computed(() => (selectedId.value ? getNodes.value.find((n) => n.id === selectedId.value) : null))
const sectionTitle = (sid) => map.value?.snapshot.sections.find((s) => s.id === sid)?.title || ''
const stepDocs = computed(() => (sel.value?.data.attachment_ids || []).map((id) => map.value.attachments.find((a) => a.id === id)).filter(Boolean))
onNodeClick(({ node }) => { if (node.type !== 'section') selectedId.value = node.id })
onPaneClick(() => { selectedId.value = null })

onMounted(async () => {
  try {
    map.value = await call(`published/map/detail/${props.id}`)
    const s = map.value.snapshot
    const flow = buildFlow({ sections: s.sections.map((x) => ({ ...x, status: 'APPROVED' })), nodes: s.nodes, edges: s.edges, editable: new Set() })
    nodes.value = flow.nodes
    edges.value = flow.edges
    await nextTick()
    setTimeout(() => fitView({ padding: 0.08 }), 50)
  } catch (e) { error.value = errMsg(e) }
})

async function sendFeedback() {
  try {
    await call('published/feedback/create', { mapId: Number(props.id), nodeId: sel.value?.id ?? null, body: feedback.value })
    feedback.value = ''
    toast('Thanks. The owner has been notified.')
  } catch (e) { toast(errMsg(e), 'error') }
}
async function download(a) {
  try { const f = await call(`attachment/download/${a.id}`); const l = document.createElement('a'); l.href = f.dataUrl; l.download = f.name; l.click() } catch (e) { toast(errMsg(e), 'error') }
}

// Client-side export (html-to-image + jsPDF). No server round-trip, nothing leaves the browser.
async function exportFile(kind) {
  exporting.value = true
  try {
    await fitView({ padding: 0.05 })
    await new Promise((r) => setTimeout(r, 250))
    const el = canvasEl.value
    const dataUrl = await toPng(el, { backgroundColor: '#ffffff', pixelRatio: 2, filter: (n) => !(n.classList && (n.classList.contains('vue-flow__controls') || n.classList.contains('vue-flow__minimap'))) })
    const base = `${map.value.code}-v${map.value.versionNo}`
    if (kind === 'png') {
      const a = document.createElement('a'); a.href = dataUrl; a.download = `${base}.png`; a.click()
    } else {
      const w = el.clientWidth, h = el.clientHeight
      const pdf = new jsPDF({ orientation: w >= h ? 'landscape' : 'portrait', unit: 'pt', format: 'a4' })
      const pw = pdf.internal.pageSize.getWidth() - 40, ph = pdf.internal.pageSize.getHeight() - 70
      const ratio = Math.min(pw / w, ph / h)
      pdf.setFontSize(12); pdf.text(`${map.value.title} (${map.value.code}, v${map.value.versionNo})`, 20, 28)
      pdf.addImage(dataUrl, 'PNG', 20, 40, w * ratio, h * ratio)
      pdf.save(`${base}.pdf`)
    }
    toast(`Exported ${kind.toUpperCase()}.`)
  } catch (e) { toast(`Export failed: ${errMsg(e)}`, 'error') } finally { exporting.value = false }
}
</script>
