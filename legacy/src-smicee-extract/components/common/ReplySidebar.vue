<template>
  <teleport to="body">
    <div class="fixed inset-0 bg-slate-900/30 z-[1000]" style="animation: sidebar-backdrop-in .2s ease" @click.self="$emit('close')">
      
      <aside
        class="reply-sidebar bg-white flex flex-col h-full overflow-hidden ml-auto w-full max-w-[480px] shadow-[-4px_0_24px_rgba(220,220,220,0.4)]"
        style="animation: sidebar-slide-in .22s ease"
        role="dialog"
        aria-modal="true"
      >
       <div class="flex justify-end p-2">
        <button
            type="button"
            class="bg-transparent border-none text-xl text-slate-400 cursor-pointer p-0.5 rounded-md leading-none flex shrink-0 transition-colors hover:text-slate-800 hover:bg-slate-100"
            @click="$emit('close')"
          >
            <i class="ri-close-line" />
          </button>
       </div>
        <!-- Header: tabs -->
        <template v-if="showReferredTab || $slots.files">
          <div class="flex items-start gap-3 px-3 pt-2 shrink-0">
            <div class="flex items-start flex-1 min-w-0">
              <button
                type="button"
                class="reply-tab flex-1"
                :class="activeTab === 'chats' ? 'reply-tab--active' : 'reply-tab--muted'"
                @click="activeTab = 'chats'"
              >
                Chats
              </button>
              <button
                v-if="$slots.files"
                type="button"
                class="reply-tab whitespace-nowrap"
                :class="activeTab === 'files' ? 'reply-tab--active' : 'reply-tab--muted'"
                @click="activeTab = 'files'"
              >
                Files
              </button>
              <button
                v-if="showReferredTab"
                type="button"
                class="reply-tab whitespace-nowrap"
                :class="activeTab === 'referred' ? 'reply-tab--active' : 'reply-tab--muted'"
                @click="activeTab = 'referred'"
              >
                Referred &amp; Acknowledge
              </button>
            </div>
          </div>
          <div class="mx-6 mt-3 border-t border-typo-100 shrink-0" />
        </template>

        <!-- Chats tab -->
        <div v-if="activeTab === 'chats'" class="flex-1 min-h-0 flex flex-col px-6">
          <div v-if="loading" class="page-loader text-muted">Loading…</div>

          <div
            v-else
            ref="messageList"
            class="reply-chat__list flex-1 min-h-0 overflow-y-auto flex flex-col gap-4 py-4"
            :class="{ 'justify-center': !replies.length }"
            @scroll="onScroll"
          >
            <div
              v-for="r in replies"
              :key="r.id"
              class="flex gap-3 items-end"
              :class="isMine(r) ? 'flex-row-reverse' : ''"
            >
              <span class="reply-chat__avatar">
                <img v-if="replyPhoto(r)" :src="replyPhoto(r)" :alt="replyAuthor(r)" />
                <span v-else>{{ getInitials(replyAuthor(r)) }}</span>
              </span>
              <div class="flex flex-col gap-1 min-w-0 flex-1" :class="isMine(r) ? 'items-end' : 'items-start'">
                <div class="flex items-baseline gap-3.5 text-[10px] text-typo-600 whitespace-nowrap">
                  <span v-if="!isMine(r)" class="font-medium">{{ replyAuthor(r) }}</span>
                  <span>{{ formatDateTime(r.reply_date) }}</span>
                </div>
                <!-- Attachment: click opens it (image) / downloads it (file) -->
                <a
                  v-if="r.attachment?.isImage && r.attachment.url"
                  :href="r.attachment.url"
                  target="_blank"
                  rel="noopener"
                  :title="r.attachment.name"
                  class="block overflow-hidden rounded-md border border-typo-100 max-w-[240px]"
                >
                  <img :src="r.attachment.url" :alt="r.attachment.name" class="block w-full h-auto" loading="lazy" />
                </a>
                <a
                  v-else-if="r.attachment"
                  :href="r.attachment.url"
                  target="_blank"
                  rel="noopener"
                  class="reply-chat__file"
                  :class="isMine(r) ? 'reply-chat__bubble--mine' : 'reply-chat__bubble--theirs'"
                >
                  <span class="reply-chat__file-icon">
                    <i :class="r.attachment.icon?.cls || 'ri-file-text-fill'" :style="{ color: r.attachment.icon?.color }" />
                  </span>
                  <span class="min-w-0 flex-1">
                    <span class="block truncate text-[11px] font-medium">{{ r.attachment.name || 'Attachment' }}</span>
                    <span v-if="r.attachment.size" class="block text-[9px] opacity-70">{{ r.attachment.size }}</span>
                  </span>
                  <i class="ri-download-2-line shrink-0" />
                </a>
                <p
                  v-if="r.reply"
                  class="reply-chat__bubble text-xs leading-relaxed px-3 py-2 m-0 max-w-full break-words whitespace-pre-wrap"
                  :class="isMine(r) ? 'reply-chat__bubble--mine' : 'reply-chat__bubble--theirs'"
                  v-html="linkify(r.reply)"
                />
              </div>
            </div>

            <div v-if="!replies.length" class="reply-thread__empty">
              <i class="ri-chat-3-line" />
              <p>No replies yet.</p>
            </div>
          </div>

          <form class="bg-typo-50 border border-typo-100 rounded-lg my-4 shrink-0" @submit.prevent="send">
            <!-- Staged attachments: sent together with the typed text -->
            <div v-if="staged.length" class="flex flex-wrap gap-2 px-3 pt-2.5">
              <div v-for="(item, i) in staged" :key="item.key" class="reply-chat__staged">
                <img v-if="item.preview" :src="item.preview" alt="" class="w-8 h-8 rounded object-cover shrink-0" />
                <i v-else :class="item.icon.cls" class="text-2xl leading-none shrink-0" :style="{ color: item.icon.color }" />
                <span class="min-w-0">
                  <span class="block truncate text-[11px] text-typo-800">{{ item.file.name }}</span>
                  <span class="block text-[9px] text-typo-400">{{ formatSize(item.file.size) }}</span>
                </span>
                <button type="button" title="Remove" class="reply-chat__staged-remove" :disabled="sending" @click="unstage(i)">
                  <i class="ri-close-line text-sm" />
                </button>
              </div>
            </div>

            <div class="flex items-center gap-2 px-3 py-2.5">
              <button
                v-if="attachments"
                type="button"
                title="Attach files"
                class="bg-transparent border-none p-0 flex leading-none cursor-pointer text-typo-400 hover:text-brand-600 disabled:opacity-40 disabled:cursor-not-allowed"
                :disabled="sending || staged.length >= maxFiles"
                @click="$refs.file.click()"
              >
                <i class="ri-attachment-2 text-lg leading-none" />
              </button>
              <i v-else class="ri-attachment-2 text-typo-300 text-lg leading-none" />
              <input v-if="attachments" ref="file" type="file" multiple class="hidden" @change="onFile" />
              <input
                v-model="text"
                type="text"
                class="flex-1 border-none bg-transparent outline-none text-xs text-typo-700 placeholder:text-typo-300 focus:outline-none"
                :placeholder="staged.length ? 'Add a message (optional)' : placeholder"
                @keydown.enter.exact.prevent="send"
                @paste="onPaste"
              />
              <button type="submit" class="bg-transparent border-none p-0 flex leading-none cursor-pointer text-brand-600 disabled:opacity-40 disabled:cursor-not-allowed" :disabled="sending || (!text.trim() && !staged.length)" title="Send">
                <i v-if="sending" class="ri-loader-4-line spinning text-lg" />
                <i v-else class="ri-send-plane-2-fill text-lg" />
              </button>
            </div>
          </form>
        </div>

        <!-- Files tab (slot) -->
        <div v-else-if="activeTab === 'files'" class="flex-1 min-h-0 flex flex-col px-6 py-4">
          <slot name="files" />
        </div>

        <!-- Referred & Acknowledge tab -->
        <div v-else-if="showReferredTab" class="flex-1 min-h-0 overflow-y-auto px-6 py-5 flex flex-col gap-6">
          <div class="flex flex-col gap-3">
            <h4 class="text-base font-medium text-typo-800 m-0">{{ reportedByLabel }}</h4>
            <span v-if="reportedBy" class="referred-pill">
              <span class="referred-pill__avatar">
                <img v-if="memberPhoto(reportedBy)" :src="memberPhoto(reportedBy)" :alt="memberName(reportedBy)" />
                <span v-else>{{ getInitials(memberName(reportedBy)) }}</span>
              </span>
              <span class="referred-pill__name">{{ memberName(reportedBy) }}</span>
            </span>
            <p v-else class="text-muted text-sm m-0">—</p>
          </div>

          <div class="flex flex-col gap-3">
            <h4 class="text-base font-medium text-typo-800 m-0">{{ referredToLabel }}</h4>
            <!-- ref/relative moved from the "Add Others" button's own wrapper to
                 this full-width row: the panel below is anchored `right: 0`
                 against whichever element is `position: relative`, and a
                 narrow button-sized anchor let the fixed-width panel extend
                 past the sidebar/viewport edge on small screens whenever the
                 button landed mid-row. Anchoring to the full row keeps the
                 panel bounded within the sidebar's own padded width instead. -->
            <div ref="assignPicker" class="flex flex-wrap gap-3 items-start relative">
              <span v-for="m in assignedMembers" :key="m.id" class="referred-pill">
                <span class="referred-pill__avatar">
                  <img v-if="memberPhoto(m)" :src="memberPhoto(m)" :alt="memberName(m)" />
                  <span v-else>{{ getInitials(memberName(m)) }}</span>
                </span>
                <span class="referred-pill__name">{{ memberName(m) }}</span>
                <button type="button" class="referred-pill__remove" title="Remove" :disabled="assigning" @click="$emit('unassign', m.id)" v-if="canRemove">
                  <i class="ri-close-line" />
                </button>
              </span>

              <button type="button" class="referred-add" :disabled="assigning" @click="toggleAssignOpen">
                Add Others <i class="ri-add-line text-[18px]" />
              </button>

              <div v-if="assignOpen" class="referred-add__panel">
                <div class="assign-picker__search">
                  <i class="ri-search-line" />
                  <input v-model="assignSearch" type="text" placeholder="Search members…" />
                </div>

                <div class="assign-picker__options">
                  <label v-for="m in filteredUnassignedMembers" :key="m.id" class="assign-picker__option">
                    <input v-model="assignSelected" type="checkbox" :value="m.id" class="hidden" />
                    <span class="assign-picker__option-avatar">
                      <img v-if="memberPhoto(m)" :src="memberPhoto(m)" :alt="memberName(m)" />
                      <span v-else>{{ getInitials(memberName(m)) }}</span>
                    </span>
                    <span class="assign-picker__option-name">{{ memberName(m) }}</span>
                    <i class="ri-check-line assign-picker__option-check" />
                  </label>
                  <p v-if="!filteredUnassignedMembers.length" class="assign-picker__empty">
                    {{ unassignedMembers.length ? 'No matches.' : 'Everyone is already referred.' }}
                  </p>
                </div>

                <div class="assign-picker__footer">
                  <button type="button" class="btn btn--ghost btn--sm" @click="closeAssignPicker">Cancel</button>
                  <button
                    type="button"
                    class="btn btn--primary btn--sm"
                      :disabled="!assignSelected.length || assigning"
                      @click="confirmAssign"
                    >
                      Add{{ assignSelected.length ? ` (${assignSelected.length})` : '' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
      </aside>
    </div>
  </teleport>
</template>

<script>
import { formatDateTime, getInitials, linkify } from '@/utils/helpers'
import { API_HOST } from '@/utils/apiPaths'
import { fileIcon, formatSize } from '@/components/chat/chatHelpers'

const MAX_FILE_BYTES = 20 * 1024 * 1024

// Full-height right-side reply panel. Two tabs: a chat-style reply thread,
// and a "Referred & Acknowledge" view
// showing who reported the item and who it's been referred to, with an
// "Add Others" picker to refer more people.
export default {
  name: 'ReplySidebar',
  emits: ['close', 'send', 'assign', 'unassign', 'load-older', 'attach-error'],

  props: {
    replies:     { type: Array,   default: () => [] },
    loading:     { type: Boolean, default: false },
    sending:     { type: Boolean, default: false },
    placeholder: { type: String,  default: 'Write a reply…' },

    reportedBy:      { type: Object,  default: null },
    reportedByLabel: { type: String,  default: 'Reported by' },

    assignedMembers:  { type: Array,   default: () => [] },
    availableMembers: { type: Array,   default: () => [] },
    assigning:        { type: Boolean, default: false },
    referredToLabel:  { type: String,  default: 'Referred to' },
    canRemove: { type: Boolean, default: true },
    // Some entities (purchase orders) only ever need a plain chat thread —
    // no referred-members/acknowledge concept. Defaults to true so every
    // existing caller keeps both tabs unchanged.
    showReferredTab: { type: Boolean, default: true },

    // Socket chat (RecordChatSidebar): enables the attach button / paste.
    // Needs `submit`, since files can't go out through the `send` event.
    attachments: { type: Boolean, default: false },
    maxFiles:    { type: Number,  default: 5 },
    // Optional async (text, stagedFiles) => boolean. When given it replaces
    // the `send` event, and the draft/attachments are cleared only once it
    // resolves true — so a failed send keeps them for a retry.
    submit: { type: Function, default: null },
  },

  data() {
    return {
      activeTab: 'chats',
      text: '',
      staged: [], // [{ key, file, preview, icon, attachmentId?, sent? }]
      assignOpen: false,
      assignSelected: [],
      assignSearch: '',
    }
  },

  computed: {
    currentUserId() {
      return this.$store.getters['auth/user']?.id
    },

    unassignedMembers() {
      const assignedIds = new Set(this.assignedMembers.map((m) => m.id))
      return this.availableMembers.filter((m) => !assignedIds.has(m.id))
    },

    filteredUnassignedMembers() {
      const q = this.assignSearch.trim().toLowerCase()
      if (!q) return this.unassignedMembers
      return this.unassignedMembers.filter((m) => this.memberName(m).toLowerCase().includes(q))
    },
  },

  watch: {
    // Replies load asynchronously after the sidebar opens, and can arrive
    // after `mounted` already ran — jump to the latest message each time
    // the list changes, not just once on open.
    // Older messages prepended by `load-older` keep the reader's position
    // instead of jumping to the bottom.
    replies(next, prev) {
      const el = this.$refs.messageList
      if (el && prev?.length && next.length > prev.length && next.at(-1)?.id === prev.at(-1)?.id) {
        const fromBottom = el.scrollHeight - el.scrollTop
        this.$nextTick(() => { el.scrollTop = el.scrollHeight - fromBottom })
        return
      }
      this.$nextTick(this.scrollToBottom)
    },
    loading(isLoading) {
      if (!isLoading) this.$nextTick(this.scrollToBottom)
    },
    // The chats pane is v-if'd, so switching back to it from the "Referred &
    // Acknowledge" tab re-mounts `messageList` — mounted() won't rerun.
    activeTab(tab) {
      if (tab === 'chats') this.$nextTick(this.scrollToBottom)
    },
  },

  mounted() {
    document.addEventListener('mousedown', this.handleClickOutside)
    this.$nextTick(this.scrollToBottom)

    // Lock the page behind this teleported dialog. Locking `body` isn't
    // enough here: main.css sets `html { overflow-x: hidden }`, and per
    // spec that explicit overflow on the root element disables the usual
    // body→root scroll propagation — so `<html>`, not `<body>`, is this
    // app's actual scrolling element. Only `overflow-y` is touched (not the
    // shorthand) so the stylesheet's `overflow-x: hidden` on html is left
    // alone and correctly restored by simply clearing this inline override.
    this.previousHtmlOverflowY = document.documentElement.style.overflowY
    document.documentElement.style.overflowY = 'hidden'
  },
  beforeUnmount() {
    this.clearStaged()
    document.removeEventListener('mousedown', this.handleClickOutside)
    document.documentElement.style.overflowY = this.previousHtmlOverflowY
  },

  methods: {
    formatDateTime,
    getInitials,
    linkify,
    formatSize,

    isMine(reply) {
      return reply.replied_by?.id === this.currentUserId
    },

    replyAuthor(r) {
      const by = r.replied_by
      return by?.full_name
        || by?.username
        || [by?.first_name, by?.last_name].filter(Boolean).join(' ')
        || 'Unknown'
    },

    replyPhoto(r) {
      const photo = r.replied_by?.photo || r.replier_photo
      if (!photo) return null
      return photo.startsWith('http') ? photo : API_HOST + photo
    },

    memberName(m) {
      return m?.full_name
        || [m?.first_name, m?.last_name].filter(Boolean).join(' ')
        || m?.username
        || 'Unknown'
    },

    memberPhoto(m) {
      const photo = m?.photo
      if (!photo) return null
      return photo.startsWith('http') ? photo : API_HOST + photo
    },

    async send() {
      if (this.sending || (!this.text.trim() && !this.staged.length)) return
      if (!this.submit) {
        this.$emit('send', this.text.trim())
        this.text = ''
        this.$nextTick(this.scrollToBottom)
        return
      }
      const ok = await this.submit(this.text.trim(), this.staged)
      if (!ok) {
        // Drop whatever did go out; keep the rest for a retry.
        this.staged = this.staged.filter((f) => !f.sent)
        return
      }
      this.text = ''
      this.clearStaged()
      this.$nextTick(this.scrollToBottom)
    },

    stage(files) {
      for (const file of files) {
        if (this.staged.length >= this.maxFiles) {
          this.$emit('attach-error', `You can attach up to ${this.maxFiles} files at a time.`)
          break
        }
        if (file.size > MAX_FILE_BYTES) {
          this.$emit('attach-error', `${file.name} is larger than 20 MB.`)
          continue
        }
        this.staged.push({
          key: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
          file,
          preview: file.type?.startsWith('image/') ? URL.createObjectURL(file) : null,
          icon: fileIcon(file.name),
        })
      }
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
      if (!this.attachments) return
      const files = [...(e.clipboardData?.files || [])]
      if (!files.length) return
      e.preventDefault()
      this.stage(files)
    },

    onScroll(e) {
      if (e.target.scrollTop < 40) this.$emit('load-older')
    },

    scrollToBottom() {
      const el = this.$refs.messageList
      if (el) el.scrollTop = el.scrollHeight
    },

    toggleAssignOpen() {
      this.assignOpen = !this.assignOpen
    },

    closeAssignPicker() {
      this.assignOpen = false
      this.assignSelected = []
      this.assignSearch = ''
    },

    handleClickOutside(e) {
      if (!this.assignOpen) return
      if (this.$refs.assignPicker?.contains(e.target)) return
      this.assignOpen = false
    },

    confirmAssign() {
      if (!this.assignSelected.length) return
      this.$emit('assign', [...this.assignSelected])
      this.closeAssignPicker()
    },
  },
}
</script>

<style scoped>
@keyframes sidebar-backdrop-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes sidebar-slide-in {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}

.reply-tab {
  padding: 8px 12px; font-size: 14px; text-align: center; border: none; cursor: pointer;
  transition: background-color .15s, color .15s;
}
.reply-tab--active { background: #E9EFFF; color: #573FE0; font-weight: 500; }
.reply-tab--muted  { background: #F9F9F9; color: #555555; font-weight: 400; }

/* Belt-and-suspenders on top of flex-1/min-h-0: an explicit cap so this
   list is guaranteed to be the thing that scrolls (header ~92px + divider
   ~13px + input row ~72px ≈ 180px of fixed chrome above/below it). */
.reply-chat__list { max-height: calc(100vh - 180px); }

/* Scrollbar thumb hidden at rest, faded in on hover — the *width* is fixed
   at all times (unlike toggling width/scrollbar-width itself) so revealing
   it never changes the content's available width and reflows/flickers it. */
.reply-chat__list { scrollbar-width: thin; scrollbar-color: transparent transparent; }
.reply-chat__list:hover { scrollbar-color: rgba(0,0,0,.2) transparent; }
.reply-chat__list::-webkit-scrollbar { width: 6px; }
.reply-chat__list::-webkit-scrollbar-track { background: transparent; }
.reply-chat__list::-webkit-scrollbar-thumb { background-color: transparent; border-radius: 3px; transition: background-color .15s; }
.reply-chat__list:hover::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,.2); }
.reply-chat__list::-webkit-scrollbar-button { display: none; width: 0; height: 0; }

.reply-chat__avatar {
  width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  background: #573FE0; color: #fff; font-size: 12px; font-weight: 700;
}
.reply-chat__avatar img { width: 100%; height: 100%; object-fit: cover; }

.reply-chat__bubble--theirs { background: #E9EFFF; color: #3D3D3E; border-radius: 6px 6px 6px 0; }
.reply-chat__bubble--mine   { background: #573FE0; color: #fff;    border-radius: 6px 6px 0 6px; }
.reply-chat__bubble :deep(.rich-link) { text-decoration: underline; word-break: break-all; }
.reply-chat__bubble--theirs :deep(.rich-link) { color: #4010BD; }
.reply-chat__bubble--mine :deep(.rich-link)   { color: #E9EFFF; }

.reply-chat__file {
  display: flex; align-items: center; gap: 10px; max-width: 260px;
  padding: 8px 12px; text-decoration: none;
}
.reply-chat__file-icon {
  width: 32px; height: 32px; border-radius: 6px; flex-shrink: 0; background: #fff;
  display: flex; align-items: center; justify-content: center; font-size: 20px; line-height: 1;
}

.reply-chat__staged {
  position: relative; display: flex; align-items: center; gap: 8px; height: 44px;
  padding: 0 28px 0 6px; max-width: 200px;
  border: 1px solid #E4E4E4; border-radius: 6px; background: #fff;
}
.reply-chat__staged-remove {
  position: absolute; top: 4px; right: 4px; width: 20px; height: 20px; border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  border: none; background: transparent; color: #A3A3A4; cursor: pointer;
}
.reply-chat__staged-remove:hover { color: #E5252A; background: #FDECEC; }
.reply-chat__staged-remove:disabled { opacity: .4; cursor: not-allowed; }

.reply-thread__empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 6px; padding: 24px 12px; text-align: center;
  background: #FAFAFA; border: 1px dashed #E4E4E4; border-radius: 10px;
}
.reply-thread__empty i { font-size: 22px; color: #C4C4C5; }
.reply-thread__empty p { margin: 0; font-size: 12.5px; color: #A3A3A4; }

/* "Referred to" pills — avatar + name, matches the Figma chip style. */
.referred-pill {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 3px 14px 3px 3px; border-radius: 36px;
  background: #F9F9F9; border: 1px solid #DCDCDC;
  font-size: 11px; color: #3D3D3E;
  max-width: fit-content;
}
.referred-pill__avatar {
  width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  background: #CFD4FF; color: #4010BD; font-size: 11px; font-weight: 700;
}
.referred-pill__avatar img { width: 100%; height: 100%; object-fit: cover; }
.referred-pill__name { white-space: nowrap; }
.referred-pill__remove {
  display: inline-flex; align-items: center; justify-content: center;
  width: 16px; height: 16px; border: none; border-radius: 50%; padding: 0; margin-left: -6px;
  background: transparent; color: #6E6E6F; cursor: pointer; font-size: 13px;
  transition: background-color .15s, color .15s;
}
.referred-pill__remove:hover:not(:disabled) { background: #FFC2C0; color: #B3261E; }
.referred-pill__remove:disabled { opacity: .5; cursor: not-allowed; }

.referred-add {
  display: inline-flex; align-items: center; gap: 8px;
  height: 44px; padding: 6px 16px; border-radius: 36px; white-space: nowrap;
  background: #EBFFED; border: 1.5px solid #BAEFBF; color: #006500;
  font-size: 12px; font-weight: 600; cursor: pointer; transition: background-color .15s;
}
.referred-add:hover:not(:disabled) { background: #DBFADD; }
.referred-add:disabled { opacity: .6; cursor: not-allowed; }

/* Centered under its anchor — which is now the full pills+button row (see
   the template's `ref="assignPicker"` comment), not just the button — so
   centering can't push the panel past either side of that row. `max-width`
   is still needed as a floor: the row itself can be narrower than the
   panel's 280px on very small phones (sidebar is `100vw` under the 560px
   breakpoint, minus 24px of padding on each side = `100vw - 48px` of
   actual room), so cap it there too. */
.referred-add__panel {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  width: 280px;
  max-width: calc(100vw - 48px);
  background: #fff; border: 1px solid #DCDCDC; border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  display: flex; flex-direction: column; overflow: hidden;
}

.assign-picker__search {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 12px; border-bottom: 1px solid #F0F0F0;
  color: #A3A3A4; font-size: 13px;
}
.assign-picker__search input {
  flex: 1; border: none; outline: none; font-size: 13px; color: #272727; background: transparent;
}

.assign-picker__options { max-height: 200px; overflow-y: auto; padding: 4px; }
.assign-picker__option {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 8px; border-radius: 8px; cursor: pointer;
  font-size: 13px; color: #272727; transition: background-color .15s;
}
.assign-picker__option:hover { background: #F9F9F9; }
.assign-picker__option input[type="checkbox"] { accent-color: #573FE0; width: 14px; height: 14px; flex-shrink: 0; }
.assign-picker__option-avatar {
  width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  background: #CFD4FF; color: #4010BD; font-size: 10px; font-weight: 700;
}
.assign-picker__option-avatar img { width: 100%; height: 100%; object-fit: cover; }
.assign-picker__option-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.assign-picker__option-check { display: none; color: #573FE0; }
.assign-picker__option input:checked ~ .assign-picker__option-check { display: block; }

.assign-picker__empty { margin: 0; padding: 16px 8px; text-align: center; font-size: 12.5px; color: #A3A3A4; }

.assign-picker__footer {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 10px 12px; border-top: 1px solid #F0F0F0; background: #FAFAFA;
}

@media (max-width: 560px) {
  .reply-sidebar { max-width: 100%}
}
</style>
