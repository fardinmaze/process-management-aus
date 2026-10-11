// Converts between the stored graph JSON (per section) and Vue Flow nodes/edges.
import { MarkerType } from '@vue-flow/core'

export const secNodeId = (id) => `sec_${id}`
export const NODE_DEFAULTS = { label: '', description: '', role: '', system: '', duration_minutes: null, attachment_ids: [], linked_map_id: null }

// sections: [{id,title,assigneeName,status,frame}], nodes/edges carry sectionId.
// editable: Set of section ids the current user may edit. commentCounts: { nodeId: openCount }
export function buildFlow({ sections, nodes, edges, editable = new Set(), commentCounts = {} }) {
  const nodeSection = {}
  nodes.forEach((n) => { nodeSection[n.id] = n.sectionId })
  // A step that another section connects to must not be deletable (server enforces this too).
  const referenced = new Set(edges.filter((e) => nodeSection[e.target] !== undefined && nodeSection[e.target] !== e.sectionId).map((e) => e.target))

  const out = []
  for (const s of sections) {
    out.push({
      id: secNodeId(s.id), type: 'section', position: { x: s.frame.x, y: s.frame.y }, zIndex: 0,
      style: { width: `${s.frame.width}px`, height: `${s.frame.height}px` },
      draggable: false, selectable: false, connectable: false, deletable: false, focusable: false,
      data: { title: s.title, assigneeName: s.assigneeName, status: s.status, editable: editable.has(s.id), sectionId: s.id },
    })
  }
  for (const n of nodes) {
    const ed = editable.has(n.sectionId)
    out.push({
      id: n.id, type: n.type, position: { ...n.position }, parentNode: secNodeId(n.sectionId), extent: 'parent', zIndex: 2,
      draggable: ed, deletable: ed && !referenced.has(n.id), selectable: true,
      data: { ...NODE_DEFAULTS, ...n.data, sectionId: n.sectionId, ui: { readonly: !ed, lockedByRef: ed && referenced.has(n.id), commentCount: commentCounts[n.id] || 0 } },
    })
  }
  const flowEdges = edges.map((e) => {
    const ed = editable.has(e.sectionId)
    return {
      id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle || undefined, targetHandle: e.targetHandle || undefined, label: e.label || '',
      type: 'smoothstep', markerEnd: MarkerType.ArrowClosed, deletable: ed, updatable: false, selectable: true, zIndex: 3,
      style: { stroke: ed ? '#4f46e5' : '#94a3b8', strokeWidth: 1.75 }, labelBgPadding: [6, 3], labelBgBorderRadius: 4,
      data: { sectionId: e.sectionId },
    }
  })
  return { nodes: out, edges: flowEdges }
}

// Flow state -> stored graph for one section.
export function graphOfSection(sectionId, flowNodes, flowEdges) {
  const mine = flowNodes.filter((n) => n.parentNode === secNodeId(sectionId))
  const ids = new Set(mine.map((n) => n.id))
  return {
    schema_version: 1,
    nodes: mine.map((n) => ({
      id: n.id, type: n.type, position: { x: Math.round(n.position.x), y: Math.round(n.position.y) },
      data: {
        label: n.data.label || '', description: n.data.description || '', role: n.data.role || '', system: n.data.system || '',
        duration_minutes: n.data.duration_minutes ?? null, attachment_ids: n.data.attachment_ids || [], linked_map_id: n.data.linked_map_id ?? null,
      },
    })),
    edges: flowEdges.filter((e) => ids.has(e.source)).map((e) => ({
      id: e.id, source: e.source, target: e.target, label: typeof e.label === 'string' ? e.label : '',
      sourceHandle: e.sourceHandle || null, targetHandle: e.targetHandle || null,
    })),
  }
}
