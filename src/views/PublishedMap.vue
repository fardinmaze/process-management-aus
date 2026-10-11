<template>
  <div class="flex flex-col bg-white" style="height: calc(100vh - 3.5rem)">
    <div class="h-12 shrink-0 border-b border-slate-200 flex items-center gap-3 px-4 text-sm">
      <router-link to="/published" class="btn btn-sm no-underline">Back</router-link>
      <div class="font-semibold truncate">{{ map?.title }} <span class="text-slate-400 font-normal">v{{ map?.versionNo }}</span></div>
      <span v-if="map" class="text-xs text-slate-500">{{ map.code }} · owner {{ map.ownerName }} · published {{ fmtDate(map.publishedAt) }}</span>
      <div class="flex-1" />
      <button v-if="tab === 'Map'" class="btn btn-sm" :disabled="exporting" @click="exportFile('png')">Export PNG</button>
      <button v-if="tab === 'Map'" class="btn btn-sm" :disabled="exporting" @click="exportFile('pdf')">Export PDF</button>
      <button v-else class="btn btn-sm" @click="printProcedure">Print</button>
    </div>
    <p v-if="error" class="p-6 text-red-600">{{ error }}</p>
    <div v-else class="flex flex-1 min-h-0">
      <div class="flex-1 min-w-0 flex flex-col">
        <div class="flex gap-1 border-b border-slate-200 px-3 shrink-0" role="tablist">
          <button v-for="t in ['Map', 'Procedure']" :key="t" role="tab" :aria-selected="tab === t" class="px-4 py-2 text-sm bg-transparent border-0 border-b-2 cursor-pointer" :class="tab === t ? 'border-brand-600 text-brand-700 font-semibold' : 'border-transparent text-slate-500'" @click="tab = t">{{ t }}</button>
        </div>

        <div v-show="tab === 'Map'" class="flex-1 min-h-0"><ProcessMap v-if="map" ref="mapRef" :items="items" :selected-id="selectedId" vf-id="viewer" @select="selectedId = $event" /></div>

        <div v-show="tab === 'Procedure'" id="procedure" class="flex-1 overflow-y-auto p-6">
          <template v-if="map">
            <p v-if="map.summary?.objective" class="mt-0 text-slate-700"><b>Objective:</b> {{ map.summary.objective }}</p>
            <div v-for="sec in map.snapshot.sections" :key="sec.id" class="mb-6">
              <h2 class="text-base font-bold mt-0 mb-2">{{ sec.title }}</h2>
              <p v-if="!stepsOf(sec.id).length" class="text-sm text-slate-400">No steps.</p>
              <ol class="pl-0 list-none m-0">
                <li v-for="a in stepsOf(sec.id)" :id="`step-${a.id}`" :key="a.id" class="proc-step" :class="{ 'proc-step--sel': selectedId === a.id }" @click="selectedId = a.id">
                  <div class="flex items-baseline gap-2">
                    <span class="text-xs font-bold text-slate-400 w-6 shrink-0">{{ indexOf(a.id) }}.</span>
                    <span v-if="a.kind === 'decision'" class="chip bg-amber-100 text-amber-700">Decision</span>
                    <span class="font-semibold">{{ a.label || '(no label)' }}</span>
                    <span class="text-xs text-slate-500">{{ a.roleName || 'No role' }}<span v-if="a.systemName"> · {{ a.systemName }}</span></span>
                  </div>
                  <ul v-if="a.tasks?.length" class="mt-1 mb-0 pl-9 text-sm text-slate-700"><li v-for="t in a.tasks" :key="t.id">{{ t.text }}</li></ul>
                  <p v-if="a.notes" class="mt-1 mb-0 pl-9 text-xs text-slate-500">{{ a.notes }}</p>
                  <p v-if="a.kind === 'decision'" class="mt-1 mb-0 pl-9 text-xs text-slate-600">Yes: {{ targetText(a, 'yes') }} · No: {{ targetText(a, 'no') }}</p>
                  <p v-else-if="a.next" class="mt-1 mb-0 pl-9 text-xs text-slate-600">Then: {{ targetText(a, 'next') }}</p>
                </li>
              </ol>
            </div>
          </template>
        </div>
      </div>

      <aside class="w-80 shrink-0 border-l border-slate-200 overflow-y-auto p-4 text-sm">
        <template v-if="sel">
          <div class="text-[11px] uppercase font-bold text-slate-500 mb-1">{{ sel.kind }} · {{ sectionTitle(sel.sectionId) }}</div>
          <h3 class="mt-0 mb-2">{{ sel.label || '(no label)' }}</h3>
          <dl class="m-0 text-xs">
            <template v-if="sel.roleName"><dt class="font-semibold text-slate-500">Responsible role</dt><dd class="m-0 mb-2">{{ sel.roleName }}</dd></template>
            <template v-if="sel.systemName"><dt class="font-semibold text-slate-500">System</dt><dd class="m-0 mb-2">{{ sel.systemName }}</dd></template>
          </dl>
          <ul v-if="sel.tasks?.length" class="pl-4 mt-0 mb-2"><li v-for="t in sel.tasks" :key="t.id">{{ t.text }}</li></ul>
          <p v-if="sel.notes" class="mt-0 text-slate-600">{{ sel.notes }}</p>
          <div v-if="stepDocs.length" class="mt-2">
            <div class="font-semibold text-xs text-slate-500">Documents</div>
            <button v-for="a in stepDocs" :key="a.id" class="block bg-transparent border-0 p-0 text-brand-700 underline cursor-pointer text-xs mb-1" @click="download(a)">{{ a.attachTitle }}</button>
          </div>
          <button class="btn btn-sm mt-2" @click="selectedId = null">Clear selection</button>
        </template>
        <template v-else>
          <p class="mt-0 text-slate-500">Click a step on the map or in the procedure to read its details.</p>
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
          <label class="flex items-center gap-2 text-xs mb-2"><input v-model="needsReply" type="checkbox"> I need a response</label>
          <button class="btn btn-primary btn-sm">Send feedback</button>
        </form>

        <div v-if="mine.length" class="mt-6 pt-4 border-t border-slate-200">
          <h4 class="mt-0 mb-2">My feedback</h4>
          <div v-for="f in mine" :key="f.id" class="border border-slate-200 rounded-lg p-2 mb-2 text-xs">
            <div class="text-slate-500">{{ f.activityId ? `On: ${labelOf(f.activityId)}` : 'On the map' }} · <span :class="f.status === 'RESOLVED' ? 'text-green-700' : 'text-amber-700'">{{ f.status === 'RESOLVED' ? 'Resolved' : 'Open' }}</span><span v-if="f.responseRequired"> · response requested</span></div>
            <div class="mt-1">{{ f.body }}</div>
            <div v-for="r in f.replies" :key="r.id" class="mt-1 pl-2 border-l-2 border-brand-200 text-slate-700"><b>{{ r.authorName }}:</b> {{ r.body }}</div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'
import { call } from '@/api'
import { toast, errMsg } from '@/session'
import { fmtDate } from '@/util'
import { toMapItems } from '@/layout/adapt'
import ProcessMap from '@/components/ProcessMap.vue'

const props = defineProps({ id: { type: [String, Number], required: true } })
const map = ref(null)
const error = ref('')
const tab = ref('Map')
const feedback = ref('')
const needsReply = ref(false)
const selectedId = ref(null)
const exporting = ref(false)
const mapRef = ref(null)
const mine = ref([])

const acts = computed(() => map.value?.snapshot.activities || [])
const items = computed(() => (map.value ? toMapItems(acts.value, { sections: map.value.snapshot.sections }) : []))
const sel = computed(() => acts.value.find((a) => a.id === selectedId.value) || null)
const sectionTitle = (sid) => map.value?.snapshot.sections.find((s) => s.id === sid)?.title || ''
const stepsOf = (sid) => acts.value.filter((a) => a.sectionId === sid)
const indexOf = (aid) => acts.value.findIndex((a) => a.id === aid) + 1
const labelOf = (aid) => acts.value.find((a) => a.id === aid)?.label || 'a step'
const targetText = (a, key) => {
  const t = a[key]
  if (t === 'END') return 'the process ends'
  const i = t ? acts.value.findIndex((x) => x.id === t) : acts.value.findIndex((x) => x.id === a.id) + 1
  return acts.value[i] ? `go to ${i + 1}. ${acts.value[i].label || '(no label)'}` : 'the process ends'
}
const stepDocs = computed(() => (sel.value?.attachment_ids || []).map((id) => map.value.attachments.find((a) => a.id === id)).filter(Boolean))
watch(selectedId, (id) => { if (id && tab.value === 'Procedure') nextTick(() => document.getElementById(`step-${id}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })) })

async function loadMine() { mine.value = await call(`published/feedback/mine/${props.id}`) }
onMounted(async () => {
  try {
    map.value = await call(`published/map/detail/${props.id}`)
    await loadMine()
  } catch (e) { error.value = errMsg(e) }
})

async function sendFeedback() {
  try {
    await call('published/feedback/create', { mapId: Number(props.id), activityId: selectedId.value, body: feedback.value, responseRequired: needsReply.value })
    feedback.value = ''
    needsReply.value = false
    toast('Thanks. The owner has been notified.')
    await loadMine()
  } catch (e) { toast(errMsg(e), 'error') }
}
async function download(a) {
  try { const f = await call(`attachment/download/${a.id}`); const l = document.createElement('a'); l.href = f.dataUrl; l.download = f.name; l.click() } catch (e) { toast(errMsg(e), 'error') }
}
const printProcedure = () => window.print()

// Client-side export (html-to-image + jsPDF). No server round-trip, nothing leaves the browser.
async function exportFile(kind) {
  exporting.value = true
  try {
    const el = mapRef.value.root
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

<style scoped>
.proc-step { padding: 8px 10px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 6px; cursor: pointer; background: #fff; }
.proc-step--sel { border-color: #6366f1; background: #eef2ff; }
@media print { .proc-step { break-inside: avoid; } }
</style>
