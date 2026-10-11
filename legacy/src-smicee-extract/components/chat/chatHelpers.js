import dayjs from 'dayjs'
import { API_HOST } from '@/utils/apiPaths'
import { memberPhotoUrl } from '@/utils/helpers'

// Employee/user-account rows keep the photo either top-level or nested under
// `additional_info` depending on the serializer — check both.
export const personPhoto = (p) => memberPhotoUrl({ photo: p?.photo || p?.additional_info?.photo || null })

export const otherUser = (channel, myId) =>
  (channel?.members || []).find((m) => m.user !== myId)?.user

// Record channels (§2a): one per Leave / EOD / Requisition / Ticket / Budget
// request, keyed by `channel_type` (= `record.type`). `api` is the V1API key
// of the get-or-create endpoint, `noun` matches the backend's error wording.
export const RECORD_TYPES = {
  LEAVE:          { label: 'Leave',          api: 'chat_channel_leave',          noun: 'leave' },
  EOD:            { label: 'EOD',            api: 'chat_channel_eod',            noun: 'EOD' },
  REQUISITION:    { label: 'Requisition',    api: 'chat_channel_requisition',    noun: 'requisition' },
  TICKET:         { label: 'Ticket',         api: 'chat_channel_ticket',         noun: 'ticket' },
  BUDGET_REQUEST: { label: 'Budget request', api: 'chat_channel_budget_request', noun: 'budget request' },
}
export const isRecordChannel = (channel) => !!RECORD_TYPES[channel?.channel_type]

// Display name for a channel from the viewer's perspective: the other
// participant for a 1:1, otherwise the channel's own name.
export function channelTitle(channel, myId) {
  if (!channel) return ''
  if (channel.channel_type === 'INDIVIDUAL') {
    const other = (channel.members || []).find((m) => m.user !== myId)
    return other?.user_name || 'Direct message'
  }
  if (channel.name) return channel.name
  if (isRecordChannel(channel)) return `${RECORD_TYPES[channel.channel_type].label} #${channel.record?.id ?? ''}`
  return channel.channel_type === 'PROJECT' ? `Project #${channel.project}` : 'Group'
}

export function messagePreview(message) {
  if (!message) return ''
  // A file/photo can carry a caption — show it, marked with a clip.
  if (message.message_type === 'IMAGE') return message.content ? `📎 ${message.content}` : 'Sent a photo'
  if (message.message_type === 'FILE') return message.content ? `📎 ${message.content}` : `Sent ${message.attachment?.file_name || 'a file'}`
  return message.content || ''
}

// Extension -> remix icon + the owning app's colour (Shared Contents design).
const FILE_ICONS = [
  { ext: ['pdf'],                                     cls: 'ri-file-pdf-2-fill',   color: '#E5252A' },
  { ext: ['doc', 'docx', 'rtf'],                      cls: 'ri-file-word-2-fill',  color: '#2B7CD3' },
  { ext: ['xls', 'xlsx', 'csv'],                      cls: 'ri-file-excel-2-fill', color: '#1F7244' },
  { ext: ['ppt', 'pptx'],                             cls: 'ri-file-ppt-2-fill',   color: '#D24726' },
  { ext: ['zip', 'rar', '7z'],                        cls: 'ri-file-zip-fill',     color: '#A46B04' },
  { ext: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'], cls: 'ri-image-fill',       color: '#6B61EF' },
]
const DEFAULT_FILE_ICON = { cls: 'ri-file-text-fill', color: '#888889' }

export function fileIcon(name = '', type) {
  if (type === 'IMAGE') return FILE_ICONS[FILE_ICONS.length - 1]
  const ext = name.split('.').pop()?.toLowerCase()
  return FILE_ICONS.find((i) => i.ext.includes(ext)) || DEFAULT_FILE_ICON
}

// "10:10 AM" for today, "Yesterday", otherwise "12 Jul".
export function listTime(iso) {
  if (!iso) return ''
  const d = dayjs(iso)
  if (d.isSame(dayjs(), 'day')) return d.format('hh:mm A')
  if (d.isSame(dayjs().subtract(1, 'day'), 'day')) return 'Yesterday'
  return d.format('DD MMM')
}

export const metaTime = (iso) => dayjs(iso).format('DD MMM YYYY - hh:mm A')

// Attachment `file` is an opaque /media/chat/<random-id>.<ext> path (P2);
// show `file_name` to users, never parse this.
export const fileUrl = (path) => (!path ? null : path.startsWith('http') ? path : API_HOST + path)

export function formatSize(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
