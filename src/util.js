export const fmt = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
export const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '—')
export const uuid = (p) => `${p}_${crypto.randomUUID()}`

export const NODE_TYPES = [
  { type: 'start', label: 'Start' },
  { type: 'end', label: 'End' },
  { type: 'task', label: 'Task' },
  { type: 'decision', label: 'Decision' },
  { type: 'subprocess', label: 'Sub-process' },
  { type: 'document', label: 'Document' },
  { type: 'note', label: 'Note' },
]
