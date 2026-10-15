<template>
  <ReplySidebar
    v-bind="$attrs"
    :replies="replies"
    :loading="loading"
    :sending="sending"
    :assigned-members="assignedMembers"
    :attachments="!!channelId"
    :submit="send"
    placeholder="Write a message…"
    @close="$emit('close')"
    @load-older="loadOlder"
    @attach-error="(msg) => toast?.error(msg)"
  >
    <template v-if="channelId" #files>
      <ChatSharedContents :channel-id="channelId" embedded class="flex-1" />
    </template>
  </ReplySidebar>
</template>

<script>
// Socket chat for a Leave / EOD / Requisition / Ticket / Budget request
// (chat API §2a), shown in the ReplySidebar design those pages use. The
// "Chats" tab is the record's chat channel; everything else (reported by,
// referred members, Add Others → `assign` / `unassign`) passes straight
// through to ReplySidebar via $attrs.
//
// Mount it only on an explicit click: the channel endpoint is
// get-or-create, so opening it on page load would create empty channels.
import ReplySidebar from '@/components/common/ReplySidebar.vue'
import ChatSharedContents from './ChatSharedContents.vue'
import { RECORD_TYPES, fileUrl, fileIcon, formatSize } from './chatHelpers'

export default {
  name: 'RecordChatSidebar',
  components: { ReplySidebar, ChatSharedContents },
  inheritAttrs: false,
  emits: ['close'],
  inject: { toast: { default: null } },

  props: {
    // A RECORD_TYPES key: LEAVE | EOD | REQUISITION | TICKET | BUDGET_REQUEST
    type:     { type: String, required: true, validator: (t) => t in RECORD_TYPES },
    // The SMICEE record id (not a chat channel id)
    recordId: { type: [Number, String], required: true },
    // Referred members — watched so the channel re-syncs its membership
    assignedMembers: { type: Array, default: () => [] },
  },

  data() {
    return { channelId: null, opening: true, sending: false, previousChannelId: null }
  },

  computed: {
    label()   { return RECORD_TYPES[this.type].label.toLowerCase() },
    bucket()  { return this.$store.getters['chat/messagesFor'](this.channelId) },
    loading() { return this.opening || (this.bucket.loading && !this.bucket.items.length) },
    photos()  { return this.$store.getters['chat/photoByUser'] },
    memberKey() { return this.assignedMembers.map((m) => m.id).sort().join(',') },

    replies() {
      return this.bucket.items.map((m) => ({
        id:         m.id,
        reply:      m.content || '',
        attachment: m.attachment ? {
          url:     fileUrl(m.attachment.file),
          name:    m.attachment.file_name,
          size:    formatSize(m.attachment.file_size),
          isImage: m.message_type === 'IMAGE',
          icon:    fileIcon(m.attachment.file_name, m.message_type),
        } : null,
        reply_date: m.created_at,
        replied_by: { id: m.sender, full_name: m.sender_name, photo: this.photos[m.sender] || null },
      }))
    },
  },

  watch: {
    // Referring someone (or removing them) changes who may chat — re-sync
    // the channel so the new member can see it right away.
    memberKey() {
      if (this.channelId) this.$store.dispatch('chat/openRecordChannel', { type: this.type, recordId: this.recordId }).catch(() => {})
    },
  },

  async created() {
    // The store keeps one live socket: the active channel. Remember what the
    // floating widget was showing so closing this sidebar can hand it back.
    this.previousChannelId = this.$store.getters['chat/activeChannelId']
    this.$store.dispatch('chat/ensurePeople').catch(() => {})
    try {
      const channel = await this.$store.dispatch('chat/openRecordChannel', { type: this.type, recordId: this.recordId })
      this.channelId = channel.id
    } catch (e) {
      const msg = e.message || ''
      // §2a errors: "Not a member of this <noun>" / "<Model> matching query does not exist."
      if (/^Not a member/i.test(msg)) this.toast?.error(`Only the requester, referees and approver can chat on this ${this.label}.`)
      else if (/does not exist/i.test(msg)) this.toast?.error(`This ${this.label} was not found.`)
      else this.toast?.error(msg || 'Could not open the chat.')
      this.$emit('close')
      return
    } finally {
      this.opening = false
    }
    await this.$store.dispatch('chat/selectChannel', this.channelId)
    this.$store.dispatch('chat/fetchMessages', { channelId: this.channelId }).catch((e) => {
      this.toast?.error(e.message || 'Could not load messages.')
    })
  },

  beforeUnmount() {
    if (!this.channelId || this.$store.getters['chat/activeChannelId'] !== this.channelId) return
    const panelOpen = this.$store.getters['chat/panelOpen']
    this.$store.dispatch('chat/selectChannel', panelOpen ? this.previousChannelId : null)
  },

  methods: {
    loadOlder() {
      if (this.channelId) this.$store.dispatch('chat/fetchMessages', { channelId: this.channelId }).catch(() => {})
    },

    // ReplySidebar's `submit`: text and staged files go out together (text
    // rides on the first file). Resolves false to keep the draft for a retry;
    // files already uploaded/sent are marked on the items and not redone.
    async send(text, files) {
      if (!this.channelId) return false
      this.sending = true
      try {
        const ok = await this.$store.dispatch('chat/sendMessage', { channelId: this.channelId, content: text, files })
        if (!ok) this.toast?.error('Connection lost — your message wasn’t sent. Please try again.')
        return ok
      } catch (e) {
        this.toast?.error(e.message || 'Upload failed. Please try again.')
        return false
      } finally {
        this.sending = false
      }
    },
  },
}
</script>
