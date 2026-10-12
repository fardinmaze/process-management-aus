<template>
  <div class="flex flex-col bg-white" style="height: calc(100vh - 3.5rem)">
    <div class="min-h-12 shrink-0 border-b border-slate-300 border-t-4 border-t-gold-500 flex flex-wrap items-center gap-x-3 gap-y-1 px-3 sm:px-4 py-1 text-sm">
      <router-link to="/published" class="btn btn-sm no-underline"><Icon name="back" :size="14" />Back</router-link>
      <div class="font-semibold truncate">{{ map?.title }} <span class="text-slate-500 font-normal">v{{ map?.versionNo }}</span></div>
      <span v-if="map" class="text-xs text-slate-500">{{ map.code }} · owner {{ map.ownerName }} · published {{ fmtDate(map.publishedAt) }}</span>
      <div class="flex-1" />
      <button v-if="tab === 'Map'" class="btn btn-sm" :disabled="exporting" @click="exportFile('png')"><Icon name="download" :size="14" />Export PNG</button>
      <button v-if="tab === 'Map'" class="btn btn-sm" :disabled="exporting" @click="exportFile('pdf')"><Icon name="download" :size="14" />Export PDF</button>
      <button v-else class="btn btn-sm" @click="printProcedure"><Icon name="printer" :size="14" />Print</button>
    </div>
    <p v-if="error" class="p-6 text-red-600">{{ error }}</p>
    <div v-else class="flex flex-col lg:flex-row flex-1 min-h-0 overflow-y-auto lg:overflow-hidden">
      <div class="h-[75vh] lg:h-auto lg:flex-1 shrink-0 lg:shrink min-w-0 flex flex-col">
        <div class="flex gap-1 border-b-4 border-brand-600 px-3 pt-2 shrink-0 bg-white" role="tablist">
          <button v-for="t in ['Map', 'Procedure']" :key="t" role="tab" :aria-selected="tab === t" class="tab" :class="tab === t ? 'tab-on' : ''" @click="tab = t"><Icon :name="t === 'Map' ? 'map' : 'list'" :size="15" class="mr-1.5" />{{ t }}</button>
        </div>

        <div v-show="tab === 'Map'" class="flex-1 min-h-0"><ProcessMap v-if="map" ref="mapRef" :items="items" :selected-id="selectedId" vf-id="viewer" @select="selectedId = $event" /></div>

        <div v-show="tab === 'Procedure'" id="procedure" class="flex-1 overflow-y-auto p-6">
          <template v-if="map">
            <p v-if="map.summary?.objective" class="mt-0 text-slate-700"><b>Objective:</b> {{ map.summary.objective }}</p>
            <div v-for="sec in map.snapshot.sections" :key="sec.id" class="mb-6">
              <h2 class="text-base font-bold mt-0 mb-2">{{ sec.title }}</h2>
              <p v-if="!stepsOf(sec.id).length" class="text-sm text-slate-500">No steps.</p>
              <ol class="pl-0 list-none m-0">
                <li v-for="a in stepsOf(sec.id)" :id="`step-${a.id}`" :key="a.id" class="proc-step" :class="{ 'proc-step--sel': selectedId === a.id }" @click="selectedId = a.id">
                  <div class="flex items-baseline gap-2">
                    <span class="text-xs font-bold text-slate-500 w-6 shrink-0">{{ indexOf(a.id) }}.</span>
                    <span v-if="a.kind === 'decision'" class="chip bg-gold-300 text-brand-900">Decision</span>
                    <span class="font-semibold">{{ a.label || '(no label)' }}</span>
                    <span class="text-xs text-slate-500">{{ a.roleName || 'No role' }}<span v-if="a.systemName"> · {{ a.systemName }}</span></span>
                  </div>
                  <ul v-if="a.tasks?.length" class="mt-1 mb-0 pl-9 text-sm text-slate-700"><li v-for="t in a.tasks" :key="t.id">{{ t.text }}</li></ul>
                  <p v-if="a.notes" class="mt-1 mb-0 pl-9 text-xs text-slate-500">{{ a.notes }}</p>
                  <p v-if="contactOf(a)" class="mt-1 mb-0 pl-9 text-xs text-slate-700">Contact: {{ contactOf(a).name }}<span v-if="contactOf(a).deskName"> · {{ contactOf(a).deskName }}</span><span v-if="contactOf(a).officialEmail || contactOf(a).email"> · {{ contactOf(a).officialEmail || contactOf(a).email }}</span></p>
                  <p v-if="a.kind === 'decision'" class="mt-1 mb-0 pl-9 text-xs text-slate-600">Yes: {{ targetText(a, 'yes') }} · No: {{ targetText(a, 'no') }}</p>
                  <p v-else-if="a.next" class="mt-1 mb-0 pl-9 text-xs text-slate-600">Then: {{ targetText(a, 'next') }}</p>
                </li>
              </ol>
            </div>
          </template>
        </div>
      </div>

      <aside class="w-full lg:w-80 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-300 lg:overflow-y-auto p-4 text-sm bg-[#F4F6F8]">
        <div>
        <template v-if="sel">
          <div class="text-xs uppercase font-bold text-brand-900 mb-1">{{ sel.kind }} · {{ sectionTitle(sel.sectionId) }}</div>
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
          <div v-if="selContact" class="mt-3 border border-slate-300 bg-white p-3">
            <h4 class="mt-0 mb-2 text-sm flex items-center gap-2"><Icon name="user" :size="15" />Contact person details</h4>
            <p v-if="selContact.source === 'lane'" class="text-xs text-slate-600 mt-0 mb-2">Lane contact: {{ sel.roleName }}</p>
            <dl class="m-0 text-xs grid grid-cols-[7.5rem_1fr] gap-x-2 gap-y-1">
              <dt class="font-semibold text-slate-600">Name</dt><dd class="m-0">{{ selContact.name || '-' }}</dd>
              <dt class="font-semibold text-slate-600">Email</dt><dd class="m-0 break-all"><a v-if="selContact.email" :href="`mailto:${selContact.email}`">{{ selContact.email }}</a><template v-else>-</template></dd>
              <dt class="font-semibold text-slate-600">Official email address</dt><dd class="m-0 break-all"><a v-if="selContact.officialEmail" :href="`mailto:${selContact.officialEmail}`">{{ selContact.officialEmail }}</a><template v-else>-</template></dd>
              <dt class="font-semibold text-slate-600">Desk name</dt><dd class="m-0">{{ selContact.deskName || '-' }}</dd>
            </dl>
          </div>
          <button class="btn btn-sm mt-3" @click="selectedId = null">Clear selection</button>
        </template>
        <template v-else>
          <p class="mt-0 text-slate-500">Click a step on the map or in the procedure to see its activity details and contact person.</p>
          <p v-if="map?.changeNote" class="text-xs text-slate-500">Change note: {{ map.changeNote }}</p>
          <div v-if="map?.attachments.length">
            <div class="font-semibold text-xs text-slate-500 mb-1">Documents</div>
            <button v-for="a in map.attachments" :key="a.id" class="block bg-transparent border-0 p-0 text-brand-700 underline cursor-pointer text-xs mb-1" @click="download(a)">{{ a.attachTitle }}</button>
          </div>
        </template>

        </div>
        <div class="mt-6 pt-4 border-t border-slate-300">
        <form @submit.prevent="sendFeedback">
          <h4 class="mt-0 mb-1 flex items-center gap-2"><Icon name="message" :size="16" />Send a response</h4>
          <p class="text-xs text-slate-500 mt-0">{{ sel ? 'About the selected step.' : 'About this map.' }} The owner is notified.</p>
          <textarea v-model="feedback" class="input mb-2" rows="3" placeholder="Write your response: what is unclear, wrong or missing?" aria-label="Your response" />
          <label class="label" for="resp-file">Attach a file (optional, up to 600 KB)</label>
          <input id="resp-file" ref="fileInput" type="file" class="input mb-2" @change="onFile">
          <p v-if="file" class="text-xs text-slate-600 mt-0 mb-2 flex items-center gap-1"><Icon name="file" :size="13" />{{ file.name }} ({{ Math.round(file.size / 1024) }} KB) <button type="button" class="bg-transparent border-0 p-0 text-brand-700 underline cursor-pointer text-xs" @click="clearFile">remove</button></p>
          <label class="flex items-center gap-2 text-xs mb-2"><input v-model="needsReply" type="checkbox"> I need a reply</label>
          <button class="btn btn-primary btn-sm"><Icon name="send" :size="13" />Send Response</button>
        </form>

        <div v-if="mine.length" class="mt-6 pt-4 border-t border-slate-300">
          <h4 class="mt-0 mb-2">My responses</h4>
          <div v-for="f in mine" :key="f.id" class="border border-slate-300 rounded p-2 mb-2 text-xs">
            <div class="text-slate-500">{{ f.activityId ? `On: ${labelOf(f.activityId)}` : 'On the map' }} · <span :class="f.status === 'RESOLVED' ? 'text-green-700' : 'text-amber-700'">{{ f.status === 'RESOLVED' ? 'Resolved' : 'Open' }}</span><span v-if="f.responseRequired"> · reply requested</span></div>
            <div class="mt-1">{{ f.body }}</div>
            <button v-for="a in f.attachments || []" :key="a.id" class="inline-flex items-center gap-1 bg-transparent border-0 p-0 mt-1 mr-3 text-brand-700 underline cursor-pointer text-xs" @click="download(a)"><Icon name="file" :size="13" />{{ a.name }}</button>
            <div v-for="r in f.replies" :key="r.id" class="mt-1 pl-2 border-l-2 border-brand-200 text-slate-700"><b>{{ r.authorName }}:</b> {{ r.body }}</div>
          </div>
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
const file = ref(null)
const fileInput = ref(null)
const selContact = computed(() => { const a = sel.value; if (!a) return null; if (a.contact?.name) return { ...a.contact, source: 'step' }; return a.roleContact?.name ? { ...a.roleContact, source: 'lane' } : null })
const contactOf = (a) => (a.contact?.name ? a.contact : a.roleContact?.name ? a.roleContact : null)

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

function onFile(e) {
  const f = e.target.files?.[0]
  if (!f) { file.value = null; return }
  if (f.size > 600 * 1024) { toast('That file is over the 600 KB demo limit.', 'error'); clearFile(); return }
  const rd = new FileReader()
  rd.onload = () => { file.value = { name: f.name, size: f.size, dataUrl: rd.result } }
  rd.readAsDataURL(f)
}
function clearFile() { file.value = null; if (fileInput.value) fileInput.value.value = '' }
async function sendFeedback() {
  if (!feedback.value.trim() && !file.value) { toast('Write a response or attach a file first.', 'error'); return }
  try {
    await call('published/feedback/create', { mapId: Number(props.id), activityId: selectedId.value, body: feedback.value, responseRequired: needsReply.value, file: file.value })
    feedback.value = ''
    needsReply.value = false
    clearFile()
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
.proc-step { padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 0; margin-bottom: 6px; cursor: pointer; background: #fff; }
.proc-step--sel { border-color: #005238; background: #E8F3EE; box-shadow: 0 0 0 2px #F9B000; }
@media print { .proc-step { break-inside: avoid; } }
</style>
