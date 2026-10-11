// Orthogonal edge routing on the lane/column grid.
// Vertical runs only happen in the gutters between columns, and long horizontal runs only happen in the free
// channel at the top or bottom of a lane, so a connector never has to cross a step box.
import { GEOM } from './layout.js'

const GUT = 14 // distance from a node edge to its gutter track
const TRACK = 8 // spacing between parallel tracks in a gutter
const CHAN = 11 // channel distance from the lane border

export function routeEdges(nodes, edges) {
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]))
  const blocked = (lane, c1, c2) => nodes.some((n) => n.lane === lane && n.col > c1 && n.col < c2)
  const outN = {}; const inN = {}
  return edges.map((e) => {
    const s = byId[e.source]; const t = byId[e.target]
    const k = (outN[s.id] = (outN[s.id] ?? -1) + 1)
    const j = (inN[t.id] = (inN[t.id] ?? -1) + 1)
    const sx = s.x + s.w; const sy = s.y + s.h / 2
    const tx = t.x; const ty = t.y + t.h / 2
    const gx1 = sx + GUT + TRACK * k
    const gx2 = tx - GUT - TRACK * j
    const forward = t.col > s.col
    let pts
    if (forward && s.lane === t.lane && !blocked(s.lane, s.col, t.col)) pts = [[sx, sy], [tx, ty]]
    else if (forward && s.lane !== t.lane && !blocked(t.lane, s.col, t.col)) pts = [[sx, sy], [gx1, sy], [gx1, ty], [tx, ty]] // drop in right after the source, run along the target lane
    else if (forward && s.lane !== t.lane && !blocked(s.lane, s.col, t.col)) pts = [[sx, sy], [gx2, sy], [gx2, ty], [tx, ty]] // run along the source lane, drop in just before the target
    else {
      // channel route: above the lane for upward or same-lane jumps, below for downward moves and loops
      const down = !forward || t.lane > s.lane
      const laneTop = s.lane * GEOM.laneH
      const cy = down ? laneTop + GEOM.laneH - CHAN - TRACK * k : laneTop + CHAN + TRACK * k
      pts = [[sx, sy], [gx1, sy], [gx1, cy], [gx2, cy], [gx2, ty], [tx, ty]]
    }
    pts = pts.filter((p, i) => i === 0 || p[0] !== pts[i - 1][0] || p[1] !== pts[i - 1][1])
    // label sits on the first vertical run (or the middle of a straight line)
    let label = [(pts[0][0] + pts[pts.length - 1][0]) / 2, pts[0][1]]
    for (let i = 1; i < pts.length; i++) if (pts[i][0] === pts[i - 1][0] && pts[i][1] !== pts[i - 1][1]) { label = [pts[i][0], (pts[i][1] + pts[i - 1][1]) / 2]; break }
    if (pts.length === 2) label = [pts[0][0] + 22, pts[0][1] - 9]
    return { ...e, points: pts, label: e.label, labelPos: label }
  })
}

// Rounded orthogonal path through the points.
export function pathOf(points, r = 8) {
  if (points.length < 2) return ''
  let d = `M ${points[0][0]} ${points[0][1]}`
  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i - 1]; const [cx, cy] = points[i]; const [nx, ny] = points[i + 1]
    const l1 = Math.hypot(cx - px, cy - py); const l2 = Math.hypot(nx - cx, ny - cy)
    const rr = Math.min(r, l1 / 2, l2 / 2)
    const ax = cx - ((cx - px) / l1) * rr; const ay = cy - ((cy - py) / l1) * rr
    const bx = cx + ((nx - cx) / l2) * rr; const by = cy + ((ny - cy) / l2) * rr
    d += ` L ${ax} ${ay} Q ${cx} ${cy} ${bx} ${by}`
  }
  const last = points[points.length - 1]
  return d + ` L ${last[0]} ${last[1]}`
}
