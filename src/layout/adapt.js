// Turns stored activities (draft or snapshot) into the items the layout understands.
// Works for drafts (role_id / system_id resolved against the libraries) and for snapshots (roleName / systemName already resolved).
export function toMapItems(activities, { roles = [], systems = [], sections = [] } = {}) {
  const role = (a) => a.roleName ?? roles.find((r) => r.id === a.role_id)?.name ?? ''
  const system = (a) => a.systemName ?? systems.find((s) => s.id === a.system_id)?.name ?? ''
  const section = (a) => sections.find((s) => s.id === a.sectionId)?.title ?? ''
  return activities.map((a) => ({
    id: a.id, kind: a.kind, label: a.label || '(no label)', role: role(a) || 'No role', roleSet: !!role(a), section: section(a), system: system(a),
    tasks: (a.tasks || []).map((t) => t.text).filter(Boolean), notes: a.notes || '', yes: a.yes || null, no: a.no || null, next: a.next || null,
  }))
}
