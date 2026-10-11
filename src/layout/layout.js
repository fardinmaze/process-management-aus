// Layout spike: turn an ordered activity list into swimlane positions.
// Pure functions, no Vue. Lanes = roles (order of first appearance), columns = sequence.
import dagre from '@dagrejs/dagre'
import { routeEdges } from './route.js'

export const GEOM = { colW: 220, laneH: 130, laneHeaderW: 120, nodeW: 160, nodeH: 60, decW: 160, decH: 92, termW: 80, termH: 40 }

// Flow rules (spec section 5): follows list order; a decision names yes/no targets (null = next item);
// an activity may carry `next: 'END'` or an id to jump (needed so a side branch can finish).
export function buildGraph(items) {
  const ids = items.map((i) => i.id)
  const idx = Object.fromEntries(ids.map((id, i) => [id, i]))
  const edges = []
  const warnings = []
  const add = (source, target, label = '') => edges.push({ id: `${source}->${target}${label ? `:${label}` : ''}`, source, target, label })
  if (items.length) add('START', items[0].id)
  items.forEach((it, i) => {
    const nextId = items[i + 1]?.id || 'END'
    if (it.kind === 'decision') {
      for (const [lab, t] of [['Yes', it.yes], ['No', it.no]]) {
        const target = t || nextId
        if (target !== 'END' && !(target in idx)) warnings.push(`${it.label}: ${lab} points to an unknown step.`)
        else add(it.id, target, lab)
      }
    } else if (it.next) {
      if (it.next !== 'END' && !(it.next in idx)) warnings.push(`${it.label}: jumps to an unknown step.`)
      else add(it.id, it.next)
    } else add(it.id, nextId)
  })
  // a target that sits earlier in the list than its source is a loop
  const back = edges.filter((e) => idx[e.target] !== undefined && idx[e.source] !== undefined && idx[e.target] <= idx[e.source])
  back.forEach((e) => warnings.push(`Loop: "${items[idx[e.source]].label}" goes back to "${items[idx[e.target]].label}".`))
  return { edges, loops: back.map((e) => e.id), warnings }
}

export function layout(items, roles, { allowLoops = true } = {}) {
  const { edges, loops, warnings } = buildGraph(items)
  const roleOrder = []
  items.forEach((i) => { if (i.role && !roleOrder.includes(i.role)) roleOrder.push(i.role) })
  const lane = (id) => {
    if (id === 'START') return Math.max(0, roleOrder.indexOf(items[0]?.role))
    if (id === 'END') return Math.max(0, roleOrder.indexOf(items[items.length - 1]?.role))
    return Math.max(0, roleOrder.indexOf(items.find((i) => i.id === id).role))
  }
  const usable = allowLoops ? edges : edges.filter((e) => !loops.includes(e.id))

  // 1. columns from dagre ranks (it breaks cycles itself), 2. fix collisions, 3. keep targets right of sources
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: 'LR', ranksep: 40, nodesep: 20, ranker: 'longest-path' })
  g.setDefaultEdgeLabel(() => ({}))
  const all = ['START', ...items.map((i) => i.id), 'END']
  all.forEach((id) => g.setNode(id, { width: 100, height: 50 }))
  edges.forEach((e) => g.setEdge(e.source, e.target))
  dagre.layout(g)
  const xs = [...new Set(all.map((id) => Math.round(g.node(id).x)))].sort((a, b) => a - b)
  const col = Object.fromEntries(all.map((id) => [id, xs.indexOf(Math.round(g.node(id).x))]))

  const fwd = edges.filter((e) => !loops.includes(e.id))
  for (let pass = 0; pass < all.length * 2; pass++) {
    let moved = false
    for (const e of fwd) if (col[e.target] <= col[e.source]) { col[e.target] = col[e.source] + 1; moved = true }
    const seen = {}
    for (const id of [...all].sort((a, b) => col[a] - col[b])) {
      const k = `${lane(id)}:${col[id]}`
      if (seen[k]) { col[id] += 1; moved = true } else seen[k] = id
    }
    if (!moved) break
  }

  const nodes = all.map((id) => {
    const it = items.find((i) => i.id === id)
    const kind = id === 'START' ? 'start' : id === 'END' ? 'end' : it.kind
    const w = kind === 'decision' ? GEOM.decW : kind === 'start' || kind === 'end' ? GEOM.termW : GEOM.nodeW
    const h = kind === 'decision' ? GEOM.decH : kind === 'start' || kind === 'end' ? GEOM.termH : GEOM.nodeH
    const cx = GEOM.laneHeaderW + 30 + col[id] * GEOM.colW + GEOM.nodeW / 2
    const cy = lane(id) * GEOM.laneH + GEOM.laneH / 2
    return { id, kind, w, h, x: cx - w / 2, y: cy - h / 2, lane: lane(id), col: col[id], item: it || null }
  })
  const maxCol = Math.max(...nodes.map((n) => n.col))
  const width = GEOM.laneHeaderW + 60 + (maxCol + 1) * GEOM.colW
  const lanes = roleOrder.map((r, i) => ({ id: `lane_${i}`, role: r, y: i * GEOM.laneH, h: GEOM.laneH, w: width }))
  return { nodes, edges: routeEdges(nodes, usable), lanes, width, height: roleOrder.length * GEOM.laneH, warnings, loops }
}

// Quality checks the spike reports: overlapping nodes, edges that run backwards, edge crossings.
export function metrics(res) {
  const { nodes, edges } = res
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]))
  let overlaps = 0
  for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
    const a = nodes[i]; const b = nodes[j]
    if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) overlaps++
  }
  const backwards = edges.filter((e) => byId[e.target].col <= byId[e.source].col).length
  // straight-line crossing approximation between centre points
  const seg = (e) => { const s = byId[e.source]; const t = byId[e.target]; return [s.x + s.w / 2, s.y + s.h / 2, t.x + t.w / 2, t.y + t.h / 2] }
  const ccw = (ax, ay, bx, by, cx, cy) => (cy - ay) * (bx - ax) > (by - ay) * (cx - ax)
  let crossings = 0
  for (let i = 0; i < edges.length; i++) for (let j = i + 1; j < edges.length; j++) {
    const a = edges[i]; const b = edges[j]
    if (a.source === b.source || a.target === b.target || a.source === b.target || a.target === b.source) continue
    const [x1, y1, x2, y2] = seg(a); const [x3, y3, x4, y4] = seg(b)
    if (ccw(x1, y1, x3, y3, x4, y4) !== ccw(x2, y2, x3, y3, x4, y4) && ccw(x1, y1, x2, y2, x3, y3) !== ccw(x1, y1, x2, y2, x4, y4)) crossings++
  }
  // a segment of a connector that passes through a step box (other than at its own two ends)
  let throughNodes = 0
  for (const e of edges) {
    for (let i = 1; i < e.points.length; i++) {
      const [x1, y1] = e.points[i - 1]; const [x2, y2] = e.points[i]
      const lox = Math.min(x1, x2); const hix = Math.max(x1, x2); const loy = Math.min(y1, y2); const hiy = Math.max(y1, y2)
      for (const n of nodes) { if (n.id === e.source || n.id === e.target) continue; if (lox < n.x + n.w && hix > n.x && loy < n.y + n.h && hiy > n.y) { throughNodes++; break } }
    }
  }
  return { overlaps, backwards, crossings, throughNodes, columns: Math.max(...nodes.map((n) => n.col)) + 1, lanes: res.lanes.length }
}
