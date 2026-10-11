<template>
  <div class="flex flex-col bg-white" style="height: calc(100vh - 3.5rem)">
    <!-- Top bar -->
    <div class="h-12 shrink-0 border-b border-slate-200 flex items-center gap-2 px-3 text-sm">
      <router-link :to="`/maps/${id}`" class="btn btn-sm no-underline">Back</router-link>
      <div class="font-semibold truncate max-w-[22rem]">{{ ver?.map.title }} <span class="text-slate-400 font-normal">v{{ ver?.versionNo }}</span></div>
      <StatusChip v-if="ver" :status="ver.status" />
      <div class="flex-1" />
      <span class="text-xs" :class="saveClass" role="status">{{ saveLabel }}</span>
      <button class="btn btn-sm" :disabled="!canUndo" title="Undo (Ctrl+Z)" @click="undo">Undo</button>
      <button class="btn btn-sm" :disabled="!canRedo" title="Redo (Ctrl+Y)" @click="redo">Redo</button>
      <button class="btn btn-sm" @click="fitView({ padding: 0.1 })">Fit view</button>
      <button v-for="s in mySections.filter((x) => x.status === 'IN_PROGRESS')" :key="s.id" class="btn btn-sm btn-primary" :disabled="submitting" @click="submitSection(s)">
        Submit “{{ s.title }}”
      </button>
    </div>

    <div v-if="conflict" class="bg-red-50 border-b border-red-200 text-red-700 text-sm px-4 py-2 flex items-center gap-3">
      {{ conflict }} <button class="btn btn-sm" @click="reload">Reload latest</button>
    </div>
    <div v-else-if="ver && !mySections.length" class="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs px-4 py-1.5">
      {{ readOnlyReason }}
    </div>

    <div class="flex flex-1 min-h-0">
      <!-- Shape library -->
      <aside class="w-44 shrink-0 border-r border-slate-200 p-3 overflow-y-auto">
        <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Shape library</div>
        <div v-if="!mySections.length" class="text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-2 mb-3">
          {{ drawHint }}
          <router-link :to="`/maps/${id}`" class="block mt-1 font-semibold">Go to the map overview</router-link>
        </div>
        <template v-else>
          <label class="label" for="active">Add to section</label>
          <select id="active" v-model="activeSectionId" class="input mb-3">
            <option v-for="s in mySections" :key="s.id" :value="s.id">{{ s.title }}</option>
          </select>
          <p class="text-[11px] text-slate-500 mt-0 mb-2">Drag a shape onto your section, or click it to add.</p>
        </template>
        <div
          v-for="t in NODE_TYPES"
          :key="t.type"
          class="palette-item"
          :class="{ 'palette-item--off': !activeEditable }"
          :draggable="activeEditable"
          role="button"
          :tabindex="activeEditable ? 0 : -1"
          :aria-disabled="!activeEditable"
          @dragstart="onPaletteDrag($event, t.type)"
          @click="activeEditable && addShape(t.type)"
          @keydown.enter="activeEditable && addShape(t.type)"
        >
          <span class="palette-icon" :class="`pi-${t.type}`" aria-hidden="true" />{{ t.label }}
        </div>
        <p class="text-[11px] text-slate-400 mt-3">To connect steps, drag from a dot on one step to a dot on another. Connections may point at steps in other sections.</p>
      </aside>

      <!-- Canvas -->
      <div class="flex-1 min-w-0 relative" @dragover.prevent="onDragOver" @drop.prevent="onDrop">
        <VueFlow
          :id="VF_ID"
          v-model:nodes="nodes"
          v-model:edges="edges"
          :connection-mode="ConnectionMode.Loose"
          :snap-to-grid="true"
          :snap-grid="[10, 10]"
          :min-zoom="0.2"
          :max-zoom="2"
          :delete-key-code="['Delete', 'Backspace']"
          :is-valid-connection="isValidConnection"
          :nodes-draggable="true"
          :elevate-nodes-on-select="false"
          class="bg-slate-50"
        >
          <template v-for="t in NODE_TYPES" :key="t.type" #[`node-${t.type}`]="p"><ShapeNode v-bind="p" /></template>
          <template #node-section="p"><SectionNode v-bind="p" /></template>
          <Background :gap="20" pattern-color="#e2e8f0" />
          <Controls :show-interactive="false" />
        </VueFlow>
        <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-white/70 text-slate-500">Loading canvas…</div>
      </div>

      <!-- Right panel -->
      <aside class="w-80 shrink-0 border-l border-slate-200 flex flex-col">
        <div class="flex border-b border-slate-200">
          <button v-for="t in PANEL_TABS" :key="t" class="flex-1 py-2 text-xs bg-transparent border-0 border-b-2 cursor-pointer"
                  :class="panelTab === t ? 'border-brand-600 text-brand-700 font-semibold' : 'border-transparent text-slate-500'" @click="panelTab = t">{{ t }}</button>
        </div>
        <div class="flex-1 overflow-y-auto p-3 text-sm">
          <!-- Details -->
          <template v-if="panelTab === 'Details'">
            <template v-if="selNode">
              <div class="text-[11px] uppercase font-bold text-slate-400 mb-2">{{ selNode.type }} · {{ sectionName(selNode.data.sectionId) }}</div>
              <label class="label" for="lb">Label</label>
              <input id="lb" class="input mb-3" :value="selNode.data.label" :disabled="selReadonly" @input="patch({ label: $event.target.value })">
              <template v-if="selNode.type !== 'note'">
                <label class="label" for="ds">Description</label>
                <textarea id="ds" class="input mb-3" rows="3" :value="selNode.data.description" :disabled="selReadonly" @input="patch({ description: $event.target.value })" />
                <label class="label" for="ro">Responsible role</label>
                <input id="ro" class="input mb-3" :value="selNode.data.role" :disabled="selReadonly" placeholder="e.g. HR Coordinator" @input="patch({ role: $event.target.value })">
                <label class="label" for="sy">System</label>
                <input id="sy" class="input mb-3" :value="selNode.data.system" :disabled="selReadonly" placeholder="e.g. Workday" @input="patch({ system: $event.target.value })">
                <label class="label" for="du">Duration (minutes)</label>
                <input id="du" class="input mb-3" type="number" min="0" :value="selNode.data.duration_minutes" :disabled="selReadonly" @input="patch({ duration_minutes: $event.target.value === '' ? null : Number($event.target.value) })">
              </template>
              <template v-if="selNode.type === 'subprocess'">
                <label class="label" for="lm">Linked published map</label>
                <select id="lm" class="input mb-3" :value="selNode.data.linked_map_id ?? ''" :disabled="selReadonly" @change="patch({ linked_map_id: $event.target.value ? Number($event.target.value) : null })">
                  <option value="">None</option>
                  <option v-for="m in publishedMaps" :key="m.id" :value="m.id">{{ m.title }}</option>
                </select>
                <router-link v-if="selNode.data.linked_map_id" :to="`/published/${selNode.data.linked_map_id}`" class="text-xs">Open linked map</router-link>
              </template>
              <template v-if="selNode.type === 'document'">
                <div class="label">Linked documents</div>
                <p v-if="!attachments.length" class="text-xs text-slate-400">Upload a document in the Documents tab first.</p>
                <label v-for="a in attachments" :key="a.id" class="flex items-center gap-2 text-xs mb-1">
                  <input type="checkbox" :disabled="selReadonly" :checked="(selNode.data.attachment_ids || []).includes(a.id)" @change="toggleAttachment(a.id, $event.target.checked)"> {{ a.attachTitle }}
                </label>
              </template>
              <p v-if="selNode.data.ui?.lockedByRef" class="text-xs text-amber-700 bg-amber-50 rounded p-2">Other sections connect to this step, so it cannot be deleted.</p>
              <p v-if="selReadonly" class="text-xs text-slate-400">Read-only: this section is not assigned to you or is not open for editing.</p>
              <button v-if="!selReadonly && selNode.deletable" class="btn btn-sm btn-danger mt-2" @click="removeSelected">Delete step</button>
            </template>
            <template v-else-if="selEdge">
              <div class="text-[11px] uppercase font-bold text-slate-400 mb-2">Connection</div>
              <label class="label" for="el">Label (for example “Yes” / “No”)</label>
              <input id="el" class="input mb-3" :value="selEdge.label" :disabled="!selEdge.deletable" @input="patchEdge($event.target.value)">
              <button v-if="selEdge.deletable" class="btn btn-sm btn-danger" @click="removeEdgeSelected">Delete connection</button>
              <p v-else class="text-xs text-slate-400">Read-only.</p>
            </template>
            <template v-else>
              <p class="text-slate-500 mt-0">Select a step or connection to see its details.</p>
              <div v-for="s in ver?.sections || []" :key="s.id" class="border border-slate-200 rounded-lg p-2 mb-2">
                <div class="font-semibold text-xs">{{ s.title }} <StatusChip :status="s.status" /></div>
                <div class="text-[11px] text-slate-500">{{ s.assigneeName || 'Unassigned' }}<span v-if="s.openedBy && s.openedBy.id !== me.id"> · {{ s.openedBy.name }} has it open</span></div>
              </div>
            </template>
          </template>

          <!-- Comments -->
          <template v-if="panelTab === 'Comments'">
            <form v-if="canComment" class="mb-3" @submit.prevent="postComment">
              <div class="text-[11px] text-slate-500 mb-1">On: {{ selNode ? `selected step (${selNode.data.label || selNode.type})` : 'the whole map' }}</div>
              <textarea v-model="commentBody" class="input mb-2" rows="2" placeholder="Write a comment…" required />
              <select v-if="canRevision" v-model="commentKind" class="input mb-2"><option value="COMMENT">Comment</option><option value="REVISION">Revision (blocks submit)</option></select>
              <button class="btn btn-sm btn-primary">Post</button>
            </form>
            <label class="flex items-center gap-2 text-xs mb-2"><input v-model="onlySelected" type="checkbox" :disabled="!selNode"> Only the selected step</label>
            <p v-if="!shownComments.length" class="text-xs text-slate-400">No comments.</p>
            <div v-for="c in shownComments" :key="c.id" class="border border-slate-200 rounded-lg p-2 mb-2 cursor-pointer" @click="focusNode(c.nodeId)">
              <div class="text-[11px] text-slate-500"><strong>{{ c.authorName }}</strong> · {{ c.kind.toLowerCase() }} · <StatusChip :status="c.status" /></div>
              <div class="text-xs mt-1">{{ c.body }}</div>
              <button v-if="c.status === 'OPEN'" class="btn btn-sm mt-1" @click.stop="resolveComment(c)">Resolve</button>
            </div>
          </template>

          <!-- Documents -->
          <template v-if="panelTab === 'Documents'">
            <form v-if="canAttach" class="mb-3" @submit.prevent="upload">
              <div class="text-[11px] text-slate-500 mb-1">Attach to: {{ selNode ? 'the selected step' : 'the whole map' }}</div>
              <input ref="fileInput" type="file" class="input mb-2" required aria-label="File">
              <input v-model="docTitle" class="input mb-2" placeholder="Title (optional)">
              <button class="btn btn-sm btn-primary">Upload</button>
            </form>
            <p v-if="!attachments.length" class="text-xs text-slate-400">No documents yet.</p>
            <div v-for="a in attachments" :key="a.id" class="border border-slate-200 rounded-lg p-2 mb-2 text-xs">
              <button class="bg-transparent border-0 p-0 text-brand-700 underline cursor-pointer text-xs" @click="download(a)">{{ a.attachTitle }}</button>
              <div class="text-slate-500">{{ a.category }} · {{ a.nodeId ? 'step' : 'map' }} · {{ a.uploaderName }}</div>
            </div>
          </template>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { ConnectionMode, VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { call } from '@/api'
import { session, hasRole, toast, errMsg } from '@/session'
import { NODE_TYPES, uuid } from '@/util'
import { NODE_DEFAULTS, buildFlow, graphOfSection, secNodeId } from '@/graph'
import ShapeNode from '@/components/ShapeNode.vue'
import SectionNode from '@/components/SectionNode.vue'
import StatusChip from '@/components/StatusChip.vue'

const props = defineProps({ id: { type: [String, Number], required: true } })
const VF_ID = 'canvas'
const PANEL_TABS = ['Details', 'Comments', 'Documents']
const AUTOSAVE_MS = 1200
const POLL_MS = 30000

const { screenToFlowCoordinate, onNodesInitialized, onConnect, addEdges, addNodes, onNodeClick, onEdgeClick, onPaneClick, updateNodeData, removeNodes, removeEdges, fitView, getNodes, getEdges, setNodes, setEdges } = useVueFlow(VF_ID)

const me = computed(() => session.user)
const ver = ref(null)
const nodes = ref([])
const edges = ref([])
const loading = ref(true)
const conflict = ref('')
const comments = ref([])
const attachments = ref([])
const publishedMaps = ref([])
const panelTab = ref('Details')
const selectedNodeId = ref(null)
const selectedEdgeId = ref(null)
const activeSectionId = ref(null)
const commentBody = ref('')
const commentKind = ref('COMMENT')
const onlySelected = ref(false)
const docTitle = ref('')
const fileInput = ref(null)
const submitting = ref(false)

// ── permissions (UI convenience only; the server re-checks everything) ──
const editableSet = computed(() => {
  const s = new Set()
  if (!ver.value || ver.value.status !== 'IN_PROGRESS' || !hasRole('CONTRIBUTOR', 'OWNER')) return s
  for (const sec of ver.value.sections) if (sec.assigneeId === me.value.id && ['ASSIGNED', 'IN_PROGRESS', 'CHANGES_REQUESTED'].includes(sec.status)) s.add(sec.id)
  return s
})
const mySections = computed(() => (ver.value?.sections || []).filter((s) => editableSet.value.has(s.id)))
const activeEditable = computed(() => editableSet.value.has(activeSectionId.value))
const drawHint = computed(() => {
  const st = ver.value?.status
  if (st === 'PLANNING') return 'Drawing opens when the map is kicked off. Assign sections, then kick off from the overview.'
  if (st === 'IN_REVIEW') return 'This map is in review and locked.'
  if (st === 'CHANGES_REQUESTED') return 'Waiting for the owner to reopen sections.'
  if (st !== 'IN_PROGRESS') return `This version is ${st?.toLowerCase().replace('_', ' ')} and read-only.`
  const owner = hasRole('ADMIN', 'OWNER')
  return owner
    ? 'You have no section of your own, so you cannot draw. Owners may assign a section to themselves: do that on the overview. Admins cannot draw.'
    : 'No section is assigned to you (or yours is already submitted or approved), so every frame is read-only.'
})
const readOnlyReason = computed(() => drawHint.value)
const isOwner = computed(() => ver.value && (hasRole('ADMIN') || (hasRole('OWNER') && ver.value.map.ownerId === me.value.id)))
const canAttach = computed(() => ver.value && (isOwner.value || ver.value.map.team?.some((t) => t.id === me.value.id) || editableSet.value.size > 0))
const canComment = computed(() => ver.value && (isOwner.value || editableSet.value.size > 0 || (hasRole('APPROVER') && ver.value.status === 'IN_REVIEW') || canAttach.value))
const canRevision = computed(() => isOwner.value || (hasRole('APPROVER') && ver.value?.status === 'IN_REVIEW'))

// fit once the nodes have been measured (fitView before that sees zero-size nodes)
let fitted = false
onNodesInitialized(() => { if (!fitted && getNodes.value.length) { fitted = true; fitView({ padding: 0.06 }) } })

// ── selection ──
const selNode = computed(() => (selectedNodeId.value ? getNodes.value.find((n) => n.id === selectedNodeId.value) : null))
const selEdge = computed(() => (selectedEdgeId.value ? getEdges.value.find((e) => e.id === selectedEdgeId.value) : null))
const selReadonly = computed(() => !selNode.value || !!selNode.value.data.ui?.readonly)
const sectionName = (sid) => ver.value?.sections.find((s) => s.id === sid)?.title || ''
onNodeClick(({ node }) => { if (node.type === 'section') return; selectedNodeId.value = node.id; selectedEdgeId.value = null; panelTab.value = 'Details' })
onEdgeClick(({ edge }) => { selectedEdgeId.value = edge.id; selectedNodeId.value = null; panelTab.value = 'Details' })
onPaneClick(() => { selectedNodeId.value = null; selectedEdgeId.value = null })

// ── building the flow ──
const revisions = {} // sectionId -> revision we loaded
let lastSaved = {} // sectionId -> JSON of graph as last saved/loaded
let sig = ''

const commentCounts = () => {
  const c = {}
  comments.value.filter((x) => x.nodeId && x.status === 'OPEN').forEach((x) => { c[x.nodeId] = (c[x.nodeId] || 0) + 1 })
  return c
}
function applyVersion(v, { keepSelection = false } = {}) {
  ver.value = v
  const secs = v.sections
  const snapNodes = secs.flatMap((s) => s.graph.nodes.map((n) => ({ ...n, sectionId: s.id })))
  const snapEdges = secs.flatMap((s) => s.graph.edges.map((e) => ({ ...e, sectionId: s.id })))
  const flow = buildFlow({ sections: secs, nodes: snapNodes, edges: snapEdges, editable: editableSet.value, commentCounts: commentCounts() })
  nodes.value = flow.nodes
  edges.value = flow.edges
  secs.forEach((s) => { revisions[s.id] = s.revision; lastSaved[s.id] = JSON.stringify(s.graph) })
  lastSaved = { ...lastSaved }
  sig = signature(v)
  if (!keepSelection) { selectedNodeId.value = null; selectedEdgeId.value = null }
  if (!mySections.value.some((s) => s.id === activeSectionId.value)) activeSectionId.value = mySections.value[0]?.id ?? null
  history = []; histIdx = -1; pushHistory(currentSnap())
  saveState.value = 'saved'
}
const signature = (v) => v.status + '|' + v.sections.map((s) => `${s.id}:${s.revision}:${s.status}:${s.assigneeId}`).join(',')

// ── history (undo / redo), snapshots of my editable sections only ──
let history = []
let histIdx = -1
let applying = false
const currentSnap = () => JSON.stringify([...editableSet.value].sort().map((sid) => [sid, graphOfSection(sid, getNodes.value, getEdges.value)]))
function pushHistory(s) { history = history.slice(0, histIdx + 1); history.push(s); if (history.length > 100) history.shift(); histIdx = history.length - 1 }
const canUndo = computed(() => histVersion.value >= 0 && histIdx > 0)
const canRedo = computed(() => histVersion.value >= 0 && histIdx < history.length - 1)
const histVersion = ref(0)
function applySnap(s) {
  applying = true
  const parsed = new Map(JSON.parse(s))
  const keep = getNodes.value.filter((n) => !(n.parentNode && parsed.has(Number(n.parentNode.replace('sec_', '')))))
  const keepEdges = getEdges.value.filter((e) => !parsed.has(e.data?.sectionId))
  const secs = ver.value.sections
  const mineNodes = [...parsed].flatMap(([sid, g]) => g.nodes.map((n) => ({ ...n, sectionId: sid })))
  const mineEdges = [...parsed].flatMap(([sid, g]) => g.edges.map((e) => ({ ...e, sectionId: sid })))
  const otherNodes = keep.filter((n) => n.type !== 'section')
  const flowMine = buildFlow({ sections: secs, nodes: mineNodes, edges: mineEdges, editable: editableSet.value, commentCounts: commentCounts() })
  const sectionNodes = getNodes.value.filter((n) => n.type === 'section')
  nodes.value = [...sectionNodes, ...otherNodes, ...flowMine.nodes.filter((n) => n.type !== 'section')]
  edges.value = [...keepEdges, ...flowMine.edges]
  selectedNodeId.value = null; selectedEdgeId.value = null
  nextTick(() => { applying = false; histVersion.value++; scheduleSave() })
}
function undo() { if (histIdx > 0) { histIdx--; applySnap(history[histIdx]) } }
function redo() { if (histIdx < history.length - 1) { histIdx++; applySnap(history[histIdx]) } }

// ── autosave with revision conflict handling ──
const saveState = ref('saved') // saved | dirty | saving | error | conflict
let saveTimer = null
let saving = false
const dirtySections = () => [...editableSet.value].filter((sid) => JSON.stringify(graphOfSection(sid, getNodes.value, getEdges.value)) !== lastSaved[sid])
function scheduleSave() {
  if (conflict.value) return
  if (!dirtySections().length) { if (saveState.value !== 'saving') saveState.value = 'saved'; return }
  saveState.value = 'dirty'
  clearTimeout(saveTimer)
  saveTimer = setTimeout(flushSave, AUTOSAVE_MS)
}
async function flushSave() {
  clearTimeout(saveTimer)
  if (saving || conflict.value) return
  const todo = dirtySections()
  if (!todo.length) { saveState.value = 'saved'; return }
  saving = true
  saveState.value = 'saving'
  try {
    for (const sid of todo) {
      const graph = graphOfSection(sid, getNodes.value, getEdges.value)
      const r = await call(`section/save/${sid}`, { graph, revision: revisions[sid] })
      revisions[sid] = r.revision
      lastSaved[sid] = JSON.stringify(graph)
      const sec = ver.value.sections.find((s) => s.id === sid)
      if (sec) { sec.status = r.status; sec.revision = r.revision }
    }
    lastSaved = { ...lastSaved }
    sig = signature(ver.value)
    saveState.value = 'saved'
    savedAt.value = new Date()
  } catch (e) {
    if (e.code === 409) { conflict.value = e.message; saveState.value = 'conflict' } else { saveState.value = 'error'; toast(errMsg(e), 'error') }
  } finally {
    saving = false
    if (!conflict.value && dirtySections().length) scheduleSave()
  }
}
const savedAt = ref(null)
const saveLabel = computed(() => ({
  saved: savedAt.value ? `Saved ${savedAt.value.toLocaleTimeString()}` : 'All changes saved',
  dirty: 'Unsaved changes…', saving: 'Saving…', error: 'Save failed. Retrying on next change', conflict: 'Not saved: conflict',
}[saveState.value]))
const saveClass = computed(() => ({ saved: 'text-green-600', dirty: 'text-amber-600', saving: 'text-slate-500', error: 'text-red-600', conflict: 'text-red-600' }[saveState.value]))

// react to edits (deep): push history + schedule save
let watchTimer = null
watch([nodes, edges], () => {
  if (applying || loading.value) return
  clearTimeout(watchTimer)
  watchTimer = setTimeout(() => {
    if (!editableSet.value.size) return
    const s = currentSnap()
    if (s !== history[histIdx]) { pushHistory(s); histVersion.value++ }
    scheduleSave()
  }, 350)
}, { deep: true })

// ── editing actions ──
const isValidConnection = (c) => {
  const src = getNodes.value.find((n) => n.id === c.source)
  return !!src && editableSet.value.has(src.data.sectionId) && c.source !== c.target
}
onConnect((c) => {
  if (!isValidConnection(c)) return
  addEdges([{ id: uuid('e'), source: c.source, target: c.target, sourceHandle: c.sourceHandle, targetHandle: c.targetHandle, label: '' }])
  // restyle the new edge through a rebuild-free patch
  nextTick(() => setEdges(getEdges.value.map((e) => (e.style ? e : { ...e, type: 'smoothstep', markerEnd: 'arrowclosed', deletable: true, selectable: true, zIndex: 3, style: { stroke: '#4f46e5', strokeWidth: 1.75 }, data: { sectionId: getNodes.value.find((n) => n.id === e.source)?.data.sectionId } }))))
})
const SHAPE_W = 150
const SHAPE_H = 60
function addShape(type, sectionId = activeSectionId.value, at = null) {
  const sid = sectionId
  const sec = ver.value.sections.find((s) => s.id === sid)
  if (!sec || !editableSet.value.has(sid)) return
  const count = getNodes.value.filter((n) => n.parentNode === secNodeId(sid)).length
  const pos = at || { x: 30 + (count % 5) * 180, y: 60 + Math.min(Math.floor(count / 5), 3) * 100 }
  const id = uuid('n')
  addNodes([{
    id, type, position: pos, parentNode: secNodeId(sid), extent: 'parent', zIndex: 2, draggable: true, deletable: true, selectable: true,
    data: { ...NODE_DEFAULTS, label: type === 'start' ? 'Start' : type === 'end' ? 'End' : '', sectionId: sid, ui: { readonly: false, lockedByRef: false, commentCount: 0 } },
  }])
  selectedNodeId.value = id; selectedEdgeId.value = null; panelTab.value = 'Details'
}
// ── drag & drop from the shape library ──
function onPaletteDrag(e, type) {
  e.dataTransfer.setData('application/x-process-shape', type)
  e.dataTransfer.effectAllowed = 'copy'
}
function onDragOver(e) { e.dataTransfer.dropEffect = 'copy' }
function onDrop(e) {
  const type = e.dataTransfer.getData('application/x-process-shape')
  if (!type) return
  const pt = screenToFlowCoordinate({ x: e.clientX, y: e.clientY })
  const frame = mySections.value.map((s) => s).find((s) => pt.x >= s.frame.x && pt.x <= s.frame.x + s.frame.width && pt.y >= s.frame.y && pt.y <= s.frame.y + s.frame.height)
  if (!frame) { toast(mySections.value.length ? 'Drop the shape inside one of your own (highlighted) sections.' : drawHint.value, 'error'); return }
  const x = Math.min(Math.max(pt.x - frame.frame.x - SHAPE_W / 2, 10), frame.frame.width - SHAPE_W - 10)
  const y = Math.min(Math.max(pt.y - frame.frame.y - SHAPE_H / 2, 40), frame.frame.height - SHAPE_H - 10)
  addShape(type, frame.id, { x: Math.round(x / 10) * 10, y: Math.round(y / 10) * 10 })
  activeSectionId.value = frame.id
}
const patch = (p) => { if (selNode.value && !selReadonly.value) updateNodeData(selNode.value.id, p) }
const patchEdge = (label) => { setEdges(getEdges.value.map((e) => (e.id === selectedEdgeId.value ? { ...e, label } : e))) }
function toggleAttachment(aid, on) {
  const cur = new Set(selNode.value.data.attachment_ids || [])
  on ? cur.add(aid) : cur.delete(aid)
  patch({ attachment_ids: [...cur] })
}
function removeSelected() { const id = selectedNodeId.value; selectedNodeId.value = null; removeNodes([id]) }
function removeEdgeSelected() { const id = selectedEdgeId.value; selectedEdgeId.value = null; removeEdges([id]) }
function focusNode(nid) { if (nid && getNodes.value.some((n) => n.id === nid)) { selectedNodeId.value = nid; setNodes(getNodes.value.map((n) => ({ ...n, selected: n.id === nid }))) } }

async function submitSection(s) {
  submitting.value = true
  try {
    await flushSave()
    if (conflict.value) return
    await call(`section/submit/${s.id}`)
    toast(`"${s.title}" submitted for review.`)
    await reload()
  } catch (e) { toast(errMsg(e), 'error') } finally { submitting.value = false }
}

// ── comments & documents ──
const shownComments = computed(() => comments.value.filter((c) => c.versionId === ver.value?.id && (!onlySelected.value || !selNode.value || c.nodeId === selNode.value.id)))
async function loadSide() {
  [comments.value, attachments.value] = await Promise.all([call(`comment/list/${props.id}`), call(`attachment/list/${props.id}`)])
}
async function postComment() {
  try {
    await call('comment/create', { mapId: Number(props.id), versionId: ver.value.id, sectionId: selNode.value?.data.sectionId ?? null, nodeId: selNode.value?.id ?? null, kind: commentKind.value, body: commentBody.value })
    commentBody.value = ''
    await loadSide()
    refreshBadges()
  } catch (e) { toast(errMsg(e), 'error') }
}
async function resolveComment(c) {
  try { await call(`comment/resolve/${c.id}`); await loadSide(); refreshBadges() } catch (e) { toast(errMsg(e), 'error') }
}
function refreshBadges() {
  const c = commentCounts()
  setNodes(getNodes.value.map((n) => (n.type === 'section' ? n : { ...n, data: { ...n.data, ui: { ...n.data.ui, commentCount: c[n.id] || 0 } } })))
}
const readFile = (f) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f) })
async function upload() {
  const f = fileInput.value.files[0]
  if (!f) return
  try {
    await call('attachment/upload', { mapId: Number(props.id), versionId: ver.value.id, sectionId: selNode.value?.data.sectionId ?? null, nodeId: selNode.value?.id ?? null, ogTitle: f.name, attachTitle: docTitle.value || f.name, category: 'General', dataUrl: await readFile(f), size: f.size })
    docTitle.value = ''
    fileInput.value.value = ''
    toast('Document uploaded.')
    await loadSide()
  } catch (e) { toast(errMsg(e), 'error') }
}
async function download(a) {
  try { const f = await call(`attachment/download/${a.id}`); const l = document.createElement('a'); l.href = f.dataUrl; l.download = f.name; l.click() } catch (e) { toast(errMsg(e), 'error') }
}

// ── load, poll, presence ──
async function fetchVersion() {
  const m = await call(`map/detail/${props.id}`)
  const vid = m.openVersion?.id ?? m.versions[0].id
  const v = await call(`version/detail/${vid}`)
  v.map = { ...v.map, team: m.team }
  return v
}
async function reload() {
  conflict.value = ''
  loading.value = true
  const v = await fetchVersion()
  ver.value = v // editableSet depends on ver
  await loadSide()
  applyVersion(v)
  await nextTick()
  loading.value = false
  announcePresence()
}
function announcePresence() { editableSet.value.forEach((sid) => call(`section/open/${sid}`).catch(() => {})) }
let pollTimer = null
async function poll() {
  if (saving || conflict.value || dirtySections().length || document.hidden) return
  try {
    const v = await fetchVersion()
    if (signature(v) !== sig) {
      ver.value = v
      await loadSide()
      applyVersion(v, { keepSelection: true })
      if (v.status !== 'IN_PROGRESS') toast('The version moved on. Canvas refreshed.')
    }
    announcePresence()
  } catch { /* transient */ }
}
onBeforeRouteLeave(async () => { await flushSave(); if (conflict.value) return window.confirm('Your latest changes could not be saved. Leave anyway?') })
function onKey(e) {
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo() }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo() }
}
function onLeave(e) { if (saveState.value === 'dirty' || saveState.value === 'saving') { e.preventDefault(); e.returnValue = '' } }

onMounted(async () => {
  try {
    publishedMaps.value = await call('published/map/list')
    await reload()
  } catch (e) { toast(errMsg(e), 'error'); loading.value = false }
  pollTimer = setInterval(poll, POLL_MS)
  window.addEventListener('keydown', onKey)
  window.addEventListener('beforeunload', onLeave)
})
onBeforeUnmount(() => {
  clearInterval(pollTimer)
  clearTimeout(saveTimer)
  clearTimeout(watchTimer)
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('beforeunload', onLeave)
  if (dirtySections().length) flushSave()
})
</script>

<style scoped>
.palette-item { display: flex; align-items: center; gap: 8px; padding: 6px 8px; margin-bottom: 6px; border: 1px solid #cbd5e1; border-radius: 8px; background: #fff; font-size: 12px; cursor: grab; user-select: none; }
.palette-item:hover { border-color: #6366f1; background: #eef2ff; }
.palette-item--off { opacity: .45; cursor: not-allowed; }
.palette-item--off:hover { border-color: #cbd5e1; background: #fff; }
.palette-icon { width: 18px; height: 12px; border: 2px solid #64748b; display: inline-block; flex: none; }
.pi-start, .pi-end { border-radius: 999px; border-color: #16a34a; }
.pi-end { border-color: #dc2626; }
.pi-task { border-radius: 3px; border-color: #3b82f6; }
.pi-decision { transform: rotate(45deg) scale(.7); border-color: #f59e0b; width: 14px; height: 14px; }
.pi-subprocess { border-style: double; border-width: 3px; border-color: #8b5cf6; border-radius: 3px; }
.pi-document { border-color: #0891b2; border-radius: 2px 2px 7px 2px; }
.pi-note { border-style: dashed; border-color: #eab308; background: #fef9c3; }
</style>
