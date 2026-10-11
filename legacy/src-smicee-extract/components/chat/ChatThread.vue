<template>
  <div class="flex flex-col h-full min-h-0">
    <!-- Header -->
    <div class="flex items-center justify-between gap-3 pb-3 border-b border-typo-100 shrink-0">
      <div class="flex items-center gap-2.5 min-w-0">
        <ChatAvatar :name="title" :photo="headerPhoto" :group="channel.channel_type !== 'INDIVIDUAL'" :size="32" />
        <div class="min-w-0">
          <h3 class="truncate text-lg leading-tight text-typo-800">{{ title }}</h3>
          <button
            v-if="channel.channel_type !== 'INDIVIDUAL'"
            type="button"
            class="text-[11px] text-typo-400 hover:text-brand-600"
            @click="$emit('members')"
          >
            {{ activeMembers.length }} members<span v-if="typeLabel"> · {{ typeLabel }}</span>
          </button>
        </div>
      </div>
      <div class="flex items-center gap-3 shrink-0">
        <button
          v-if="channel.channel_type === 'GROUP'"
          type="button"
          class="text-xs text-typo-500 hover:text-accent-500 flex items-center gap-1"
          @click="$emit('leave')"
        >
          <i class="ri-logout-box-r-line" /> Leave
        </button>
        <button
          type="button"
          :title="sharedOpen ? 'Hide shared contents' : 'Shared contents'"
          class="w-10 h-10 rounded-full flex items-center justify-center text-xl transition-colors"
          :class="sharedOpen ? 'bg-brand-50 text-brand-600' : 'bg-[#F5F5F7] text-typo-600 hover:bg-typo-100'"
          @click="$emit('info')"
        >
          <i class="ri-information-line" />
        </button>
      </div>
    </div>

    <!-- Messages -->
    <div ref="scroller" class="flex-1 min-h-0 overflow-y-auto overscroll-contain py-4 pr-1" @scroll="onScroll">
      <div v-if="bucket.loading && bucket.hasMore" class="py-2 text-center text-[11px] text-typo-400">
        <i class="ri-loader-4-line animate-spin" /> Loading…
      </div>

      <div class="flex flex-col justify-end min-h-full gap-4">
        <template v-for="g in groups" :key="g.key">
          <!-- System notice -->
          <p v-if="g.system" class="self-center text-[10px] text-typo-400 bg-typo-50 rounded-full px-3 py-1">
            {{ g.messages[0].content }}
          </p>

          <!-- Received -->
          <div v-else-if="!g.mine" class="flex items-end gap-2 max-w-[85%] md:max-w-[70%]">
            <ChatAvatar :name="g.senderName" :photo="photos[g.sender]" :size="20" class="mb-0.5" />
            <div class="min-w-0">
              <p class="mb-1 text-[9px] text-typo-500">
                {{ g.senderName }}<span class="ml-3">{{ g.time }}</span>
              </p>
              <div class="flex flex-col items-start gap-1">
                <ChatBubble v-for="m in g.messages" :key="m.id" :message="m" />
              </div>
            </div>
          </div>

          <!-- Sent -->
          <div v-else class="flex items-end justify-end gap-2 self-end max-w-[85%] md:max-w-[70%]">
            <div class="min-w-0">
              <p class="mb-1 text-right text-[9px] text-typo-500">{{ g.time }}</p>
              <div class="flex flex-col items-end gap-1">
                <ChatBubble v-for="m in g.messages" :key="m.id" :message="m" mine />
              </div>
            </div>
            <ChatAvatar :name="myName" :photo="myPhoto" :size="20" class="mb-0.5" />
          </div>
        </template>
      </div>

      <p v-if="typingNames" class="mt-3 text-[11px] text-typo-400 italic">{{ typingNames }}</p>
    </div>

    <!-- Connection status. "Reconnecting" only after a grace period, so a
         sub-second reconnect doesn't flash a banner. -->
    <div
      v-if="failed"
      class="flex items-center justify-between gap-3 mb-2 px-3 py-2 rounded-lg bg-accent-50 text-[11px] text-accent-600 shrink-0"
    >
      <span class="flex items-center gap-1.5">
        <i class="ri-wifi-off-line" /> Can’t connect to the chat server. Messages can’t be sent right now.
      </span>
      <button type="button" class="font-medium underline shrink-0" @click="retry">Retry</button>
    </div>
    <div
      v-else-if="showConnecting"
      class="flex items-center gap-1.5 mb-2 px-3 py-2 rounded-lg bg-typo-50 text-[11px] text-typo-500 shrink-0"
    >
      <i class="ri-loader-4-line animate-spin" /> Reconnecting… messages you send will go out when it’s back.
    </div>

    <!-- Composer -->
    <form
      class="rounded-lg border border-typo-100 bg-[#F7F7F8] shrink-0"
      @submit.prevent="send"
    >
      <!-- Staged attachments: sent together with the typed text on Send -->
      <div v-if="staged.length" class="flex flex-wrap gap-2 px-3 pt-2.5">
        <div
          v-for="(item, i) in staged"
          :key="item.key"
          class="relative flex items-center gap-2 h-11 pl-1.5 pr-7 rounded-md border border-typo-100 bg-white max-w-[220px]"
        >
          <img v-if="item.preview" :src="item.preview" alt="" class="w-8 h-8 rounded object-cover shrink-0" />
          <i v-else :class="item.icon.cls" class="text-2xl leading-none shrink-0" :style="{ color: item.icon.color }" />
          <span class="min-w-0">
            <span class="block truncate text-[11px] text-typo-800">{{ item.file.name }}</span>
            <span class="block text-[9px] text-typo-400">{{ formatSize(item.file.size) }}</span>
          </span>
          <button
            type="button"
            title="Remove"
            class="absolute top-1 right-1 w-5 h-5 rounded flex items-center justify-center text-typo-400 hover:text-accent-500 hover:bg-accent-50 disabled:opacity-40"
            :disabled="sending"
            @click="unstage(i)"
          >
            <i class="ri-close-line text-sm" />
          </button>
        </div>
      </div>

      <div class="flex items-center gap-2 h-10 px-3">
        <button
          type="button"
          title="Attach files"
          class="text-typo-500 hover:text-brand-600 disabled:opacity-50"
          :disabled="sending || failed || staged.length >= MAX_FILES"
          @click="$refs.file.click()"
        >
          <i class="ri-attachment-2" />
        </button>
        <input ref="file" type="file" multiple class="hidden" @change="onFile" />
        <input
          ref="input"
          v-model="draft"
          type="text"
          maxlength="5000"
          :placeholder="staged.length ? 'Add a message (optional)' : 'Type a message'"
          :disabled="failed || sending"
          class="flex-1 min-w-0 bg-transparent text-xs text-typo-800 placeholder:text-typo-400 outline-none focus-visible:outline-none"
          @input="onTyping"
          @paste="onPaste"
        />
        <button
          type="submit"
          title="Send"
          class="text-brand-600 hover:text-brand-700 disabled:text-typo-300"
          :disabled="!canSend"
        >
          <i :class="sending ? 'ri-loader-4-line animate-spin' : 'ri-send-plane-2-fill'" />
        </button>
      </div>
    </form>
  </div>
</template>

<script>
import dayjs from 'dayjs'
import ChatAvatar from './ChatAvatar.vue'
import ChatBubble from './ChatBubble.vue'
import { channelTitle, metaTime, otherUser, personPhoto, fileIcon, formatSize, RECORD_TYPES } from './chatHelpers'

// Consecutive messages from the same sender within this window share one
// meta line + avatar, as in the design.
const GROUP_WINDOW_MIN = 5
// Backend has no size/type validation (§7) — cap it client-side.
const MAX_FILES = 5
const MAX_FILE_BYTES = 20 * 1024 * 1024
const CONNECTING_GRACE_MS = 1500

export default {
  name: 'ChatThread',
  components: { ChatAvatar, ChatBubble },
  inject: ['toast'],
  props: {
    channel:    { type: Object, required: true },
    sharedOpen: { type: Boolean, default: false },
  },
  emits: ['leave', 'members', 'info'],

  data() {
    return {
      MAX_FILES,
      draft: '',
      staged: [],          // [{ key, file, preview, icon, attachmentId?, sent? }]
      sending: false,
      typingSent: false,
      typingTimer: null,
      showConnecting: false,
      connectingTimer: null,
    }
  },

  computed: {
    // Derived-membership channels get their kind next to the member count.
    typeLabel() {
      const t = this.channel.channel_type
      return t === 'PROJECT' ? 'Project' : RECORD_TYPES[t]?.label || null
    },
    me()        { return this.$store.getters['auth/user'] },
    myId()      { return this.me?.id },
    myName()    { return this.me?.name || '' },
    photos()    { return this.$store.getters['chat/photoByUser'] },
    myPhoto()   { return personPhoto(this.me) || this.photos[this.myId] || null },
    headerPhoto() {
      return this.channel.channel_type === 'INDIVIDUAL' ? this.photos[otherUser(this.channel, this.myId)] || null : null
    },
    title()     { return channelTitle(this.channel, this.myId) },
    bucket()    { return this.$store.getters['chat/messagesFor'](this.channel.id) },
    connected() { return this.$store.getters['chat/isConnected'](this.channel.id) },
    failed()    { return this.$store.getters['chat/isFailed'](this.channel.id) },
    canSend() {
      return !this.sending && !this.failed && (!!this.draft.trim() || this.staged.length > 0)
    },
    lastMessage()   { return this.bucket.items[this.bucket.items.length - 1] || null },
    activeMembers() { return (this.channel.members || []).filter((m) => m.is_active !== false) },

    groups() {
      const out = []
      for (const m of this.bucket.items) {
        const last = out[out.length - 1]
        const system = m.message_type === 'SYSTEM'
        const lastMsg = last?.messages[last.messages.length - 1]
        if (
          last && !system && !last.system && last.sender === m.sender &&
          dayjs(m.created_at).diff(dayjs(lastMsg.created_at), 'minute') < GROUP_WINDOW_MIN
        ) {
          last.messages.push(m)
          continue
        }
        out.push({
          key: m.id,
          system,
          sender: m.sender,
          senderName: m.sender_name,
          mine: m.sender === this.myId,
          time: metaTime(m.created_at),
          messages: [m],
        })
      }
      return out
    },

    typingNames() {
      const ids = this.$store.getters['chat/typingFor'](this.channel.id)
      if (!ids.length) return ''
      const names = ids.map((id) => this.channel.members?.find((m) => m.user === id)?.user_name || 'Someone')
      return `${names.join(', ')} ${names.length > 1 ? 'are' : 'is'} typing…`
    },
  },

  watch: {
    'channel.id': { immediate: true, handler: 'loadInitial' },
    connected: {
      immediate: true,
      handler(ok) {
        clearTimeout(this.connectingTimer)
        if (ok) this.showConnecting = false
        else this.connectingTimer = setTimeout(() => { this.showConnecting = true }, CONNECTING_GRACE_MS)
      },
    },
    // Stick to the bottom when a new message arrives, unless the user has
    // scrolled up to read history. Keyed on the newest message (not the
    // count) so loading an older page never triggers it.
    lastMessage(n, o) {
      if (!o || !n || n.id === o.id) return
      const el = this.$refs.scroller
      const nearBottom = el && el.scrollHeight - el.scrollTop - el.clientHeight < 120
      if (nearBottom || n.sender === this.myId) this.scrollToBottom()
    },
  },

  beforeUnmount() {
    this.stopTyping()
    clearTimeout(this.connectingTimer)
    this.clearStaged()
  },

  methods: {
    formatSize,

    async loadInitial() {
      this.draft = ''
      this.clearStaged()
      try {
        if (!this.bucket.page) await this.$store.dispatch('chat/fetchMessages', { channelId: this.channel.id })
      } catch (e) {
        this.toast?.error(e.message || 'Failed to load messages.')
      }
      this.scrollToBottom()
      this.$nextTick(() => this.$refs.input?.focus())
    },

    retry() {
      this.$store.dispatch('chat/retryConnect', this.channel.id)
    },

    scrollToBottom() {
      this.$nextTick(() => {
        const el = this.$refs.scroller
        if (el) el.scrollTop = el.scrollHeight
      })
    },

    // Infinite scroll upward, keeping the viewport anchored on the message
    // the user was reading.
    async onScroll() {
      const el = this.$refs.scroller
      if (el.scrollTop > 40 || this.bucket.loading || !this.bucket.hasMore) return
      const prevHeight = el.scrollHeight
      try {
        await this.$store.dispatch('chat/fetchMessages', { channelId: this.channel.id })
      } catch { return }
      this.$nextTick(() => { el.scrollTop = el.scrollHeight - prevHeight })
    },

    // Text and staged files go out together (text rides on the first file).
    // Nothing is cleared until the send succeeds, so a failure keeps the
    // draft and attachments; already-uploaded files aren't uploaded again.
    async send() {
      if (!this.canSend) return
      this.sending = true
      this.stopTyping()
      try {
        const ok = await this.$store.dispatch('chat/sendMessage', {
          channelId: this.channel.id,
          content: this.draft,
          files: this.staged,
        })
        if (!ok) {
          // Drop whatever did go out; keep the rest for a retry.
          this.staged = this.staged.filter((f) => !f.sent)
          return this.toast?.error('Connection lost — your message wasn’t sent. Please try again.')
        }
        this.draft = ''
        this.clearStaged()
        this.$nextTick(() => this.$refs.input?.focus())
      } catch (err) {
        this.staged = this.staged.filter((f) => !f.sent)
        this.toast?.error(err.message || 'Upload failed. Please try again.')
      } finally {
        this.sending = false
      }
    },

    stage(files) {
      for (const file of files) {
        if (this.staged.length >= MAX_FILES) {
          this.toast?.error(`You can attach up to ${MAX_FILES} files at a time.`)
          break
        }
        if (file.size > MAX_FILE_BYTES) {
          this.toast?.error(`${file.name} is larger than 20 MB.`)
          continue
        }
        this.staged.push({
          key: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
          file,
          preview: file.type?.startsWith('image/') ? URL.createObjectURL(file) : null,
          icon: fileIcon(file.name),
        })
      }
      this.$nextTick(() => this.$refs.input?.focus())
    },

    unstage(i) {
      const [item] = this.staged.splice(i, 1)
      if (item?.preview) URL.revokeObjectURL(item.preview)
    },

    clearStaged() {
      for (const item of this.staged) if (item.preview) URL.revokeObjectURL(item.preview)
      this.staged = []
    },

    onFile(e) {
      const files = [...(e.target.files || [])]
      e.target.value = ''
      this.stage(files)
    },

    // Pasting a screenshot/file into the message box stages it.
    onPaste(e) {
      const files = [...(e.clipboardData?.files || [])]
      if (!files.length) return
      e.preventDefault()
      this.stage(files)
    },

    onTyping() {
      if (!this.typingSent) {
        this.typingSent = true
        this.$store.dispatch('chat/sendTyping', { channelId: this.channel.id, isTyping: true })
      }
      clearTimeout(this.typingTimer)
      this.typingTimer = setTimeout(this.stopTyping, 2500)
    },

    stopTyping() {
      clearTimeout(this.typingTimer)
      if (!this.typingSent) return
      this.typingSent = false
      this.$store.dispatch('chat/sendTyping', { channelId: this.channel.id, isTyping: false })
    },
  },
}
</script>
