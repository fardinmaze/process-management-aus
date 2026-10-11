<template>
  <div>
    <!-- Floating trigger (hidden while open — it would sit on the composer) -->
    <button
      v-show="!open"
      type="button"
      class="chat-trigger fixed right-7 bottom-7 z-[901] w-14 h-14 rounded-full bg-brand-600 text-white shadow-[0_8px_24px_rgba(87,63,224,0.35)] flex items-center justify-center transition-transform hover:-translate-y-0.5 hover:bg-brand-700"
      title="Open chat"
      @click="$store.dispatch('chat/openPanel')"
    >
      <i class="ri-chat-3-line text-2xl" />
      <span
        v-if="totalUnread"
        class="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1 rounded-full bg-accent-500 text-white text-[10px] font-semibold leading-5 text-center border-2 border-white"
      >{{ totalUnread > 99 ? '99+' : totalUnread }}</span>
    </button>

    <!-- Chat module: fills the content area (below the navbar, beside the
         app sidebar), matching the "Individual Chat Module" frames. Height
         is 100dvh minus the navbar so mobile browser chrome can't clip it. -->
    <transition name="chat-panel">
      <section
        v-if="open"
        class="fixed top-16 right-0 left-0 h-[calc(100dvh-4rem)] z-[195] bg-white flex flex-col transition-[left] duration-[250ms]"
        :class="collapsed ? 'md:left-[70px]' : 'md:left-[260px]'"
        role="dialog"
        aria-label="Chat"
      >
        <!-- Mobile top bar: title (or Back inside a conversation) + close.
             Desktop uses the corner × below instead. -->
        <div class="md:hidden flex items-center justify-between gap-2 h-12 px-3 border-b border-typo-100 shrink-0">
          <button
            v-if="activeChannel"
            type="button"
            class="flex items-center gap-1.5 text-sm text-typo-700 -ml-1 px-1 py-1 rounded-lg hover:bg-typo-50"
            @click="selectChannel(null)"
          >
            <i class="ri-arrow-left-line text-lg" /> Back
          </button>
          <h2 v-else class="text-base font-medium text-typo-800">Messages</h2>
          <button
            type="button"
            title="Close chat"
            class="w-9 h-9 rounded-lg flex items-center justify-center text-typo-500 hover:text-typo-800 hover:bg-typo-50"
            @click="close"
          >
            <i class="ri-close-line text-xl" />
          </button>
        </div>

        <div class="relative flex flex-1 min-h-0">
          <!-- Desktop close. Hidden while Shared Contents is open: that
               panel's own × takes this corner and closes only the panel. -->
          <button
            v-if="!sharedVisible"
            type="button"
            title="Close chat (Esc)"
            class="hidden md:flex absolute top-6 right-3 z-10 w-8 h-8 rounded-lg items-center justify-center text-typo-400 hover:text-typo-800 hover:bg-typo-50 transition-colors"
            @click="close"
          >
            <i class="ri-close-line text-xl" />
          </button>

          <aside
            class="w-full md:w-[380px] shrink-0 md:border-r border-typo-100 p-3"
            :class="{ 'hidden md:block': activeChannel }"
          >
            <ChatChannelList
              :channels="channels"
              :active-id="activeChannelId"
              :loading="channelsLoading"
              :my-id="myId"
              @select="selectChannel"
              @new="showNew = true"
            />
          </aside>

          <div
            class="flex-1 min-w-0 px-3 pt-3 pb-3 md:pl-6 md:pt-5 md:pb-4"
            :class="[{ 'hidden md:block': !activeChannel }, sharedVisible ? 'md:pr-6' : 'md:pr-12']"
          >
            <ChatThread
              v-if="activeChannel"
              :key="activeChannel.id"
              :channel="activeChannel"
              class="h-full"
              @leave="confirmLeave = true"
              @members="showMembers = true"
              :shared-open="showShared"
              @info="toggleShared"
            />

            <!-- Empty state -->
            <div v-else class="h-full flex flex-col items-center justify-center text-center">
              <Vue3Lottie :animation-data="emptyAnimation" :height="150" :width="150" :loop="true" />
              <h2 class="mt-1 text-2xl font-semibold text-typo-800">Your conversations start here</h2>
              <p class="mt-1.5 text-xs text-typo-500">You haven’t opened any message yet, please select a message</p>
            </div>
          </div>

          <!-- Shared contents (files/images in this conversation). Docked on
               wide screens, slides over the thread on narrower ones. -->
          <aside
            v-if="sharedVisible"
            class="absolute lg:static inset-y-0 right-0 z-[5] w-[380px] max-w-full shrink-0 bg-white border-l border-typo-100 px-3 pt-3 md:pt-5 pb-4 shadow-[-4px_0_24px_rgba(220,220,220,0.4)] lg:shadow-none"
          >
            <ChatSharedContents :key="activeChannel.id" :channel-id="activeChannel.id" @close="showShared = false" />
          </aside>
        </div>
      </section>
    </transition>

    <ChatNewConversation v-if="showNew" @close="showNew = false" @created="onCreated" />

    <ChatMembers
      v-if="showMembers && activeChannel"
      :channel="activeChannel"
      @close="showMembers = false"
      @leave="showMembers = false; confirmLeave = true"
    />

    <ConfirmModal
      v-if="confirmLeave"
      title="Leave group"
      :message="`Leave “${activeChannel?.name}”? You’ll stop receiving its messages.`"
      confirm-label="Leave"
      confirm-variant="danger"
      :loading="leaving"
      @confirm="leaveGroup"
      @cancel="confirmLeave = false"
    />
  </div>
</template>

<script>
import { Vue3Lottie } from 'vue3-lottie'
import emptyAnimation from '@/assets/lottie/chat-empty.json'
import ChatChannelList from './ChatChannelList.vue'
import ChatThread from './ChatThread.vue'
import ChatNewConversation from './ChatNewConversation.vue'
import ChatMembers from './ChatMembers.vue'
import ChatSharedContents from './ChatSharedContents.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'

// The inbox has no socket of its own (sockets are per-channel), so the
// unread badge on the trigger is refreshed by polling while the panel is
// closed and on every open.
const INBOX_POLL_MS = 60_000

export default {
  name: 'ChatWidget',
  components: { Vue3Lottie, ChatChannelList, ChatThread, ChatNewConversation, ChatMembers, ChatSharedContents, ConfirmModal },
  inject: ['toast'],

  data() {
    return {
      showNew: false,
      showMembers: false,
      scrollLocked: null,
      // Opened only from the ⓘ button in the thread header.
      showShared: false,
      confirmLeave: false,
      leaving: false,
      pollTimer: null,
      emptyAnimation,
    }
  },

  computed: {
    open()            { return this.$store.getters['chat/panelOpen'] },
    collapsed()       { return this.$store.getters['sidebar/collapsed'] },
    myId()            { return this.$store.getters['auth/user']?.id },
    channels()        { return this.$store.getters['chat/channels'] },
    channelsLoading() { return this.$store.getters['chat/channelsLoading'] },
    activeChannelId() { return this.$store.getters['chat/activeChannelId'] },
    activeChannel()   { return this.$store.getters['chat/activeChannel'] },
    totalUnread()     { return this.$store.getters['chat/totalUnread'] },
    sharedVisible()   { return !!this.activeChannel && this.showShared },
  },

  watch: {
    open: {
      immediate: true,
      handler(isOpen) { this.lockPageScroll(isOpen) },
    },
    // A socket-side removal (membership revoked, P1 deactivation, P3
    // deleted project) clears the active channel.
    activeChannelId(id, prev) {
      if (prev && !id) this.$store.dispatch('chat/disconnect', prev)
      if (id !== prev) this.showMembers = false
    },
    // Close on navigation (path only — query/hash changes don't count).
    '$route.path'() {
      if (this.open) this.close()
    },
  },

  mounted() {
    this.refresh()
    this.pollTimer = setInterval(() => { if (!this.open) this.refresh() }, INBOX_POLL_MS)
    document.addEventListener('keydown', this.onKeydown)
    document.addEventListener('visibilitychange', this.onWake)
    window.addEventListener('online', this.onWake)
    // Rejected-event errors from an open socket (store: reportSocketError).
    this.unsubscribe = this.$store.subscribeAction((action) => {
      if (action.type === 'chat/reportSocketError') this.toast?.error(action.payload || 'Message could not be sent.')
    })
  },

  beforeUnmount() {
    clearInterval(this.pollTimer)
    document.removeEventListener('keydown', this.onKeydown)
    document.removeEventListener('visibilitychange', this.onWake)
    window.removeEventListener('online', this.onWake)
    this.unsubscribe?.()
    this.lockPageScroll(false)
    this.$store.dispatch('chat/closePanel')
  },

  methods: {
    refresh() {
      return this.$store.dispatch('chat/fetchChannels').catch(() => {})
    },

    close() {
      this.showNew = false
      this.showMembers = false
      this.showShared = false
      this.$store.dispatch('chat/closePanel')
    },

    onKeydown(e) {
      if (e.key !== 'Escape' || !this.open || this.showNew || this.showMembers || this.confirmLeave) return
      // Innermost first: Shared Contents, then the whole module.
      if (this.sharedVisible) this.showShared = false
      else this.close()
    },

    // Same approach as AIAssistant: hide the document's scrollbar and keep
    // the previous value to restore. overscroll-behavior stops touch/wheel
    // scroll in the chat lists from chaining into the page on mobile.
    lockPageScroll(lock) {
      const root = document.documentElement
      if (lock && !this.scrollLocked) {
        this.scrollLocked = { overflow: root.style.overflow, overscroll: root.style.overscrollBehavior }
        root.style.overflow = 'hidden'
        root.style.overscrollBehavior = 'none'
      } else if (!lock && this.scrollLocked) {
        root.style.overflow = this.scrollLocked.overflow
        root.style.overscrollBehavior = this.scrollLocked.overscroll
        this.scrollLocked = null
      }
    },

    // Browsers throttle/kill sockets in background tabs and on network
    // changes — reconnect the moment the user is back instead of waiting
    // out the backoff.
    onWake() {
      if (document.visibilityState === 'visible') this.$store.dispatch('chat/wake')
    },

    toggleShared() {
      this.showShared = !this.showShared
    },

    selectChannel(id) {
      this.$store.dispatch('chat/selectChannel', id)
    },

    onCreated(id) {
      this.showNew = false
      this.selectChannel(id)
    },

    async leaveGroup() {
      const channel = this.activeChannel
      this.leaving = true
      try {
        this.$store.dispatch('chat/disconnect', channel.id)
        await this.$store.dispatch('chat/removeMember', { channelId: channel.id, userId: this.myId })
        this.toast?.success(`You left ${channel.name}.`)
      } catch (e) {
        this.toast?.error(e.message || 'Could not leave the group.')
      } finally {
        this.leaving = false
        this.confirmLeave = false
      }
    },
  },
}
</script>

<style scoped>
.chat-panel-enter-active,
.chat-panel-leave-active {
  transition: opacity .18s ease, transform .18s ease;
}
.chat-panel-enter-from,
.chat-panel-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
