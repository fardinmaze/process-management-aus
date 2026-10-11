<template>
  <div class="flex flex-col h-full min-h-0">
    <!-- Search -->
    <div class="relative flex items-center h-9 px-3 rounded-lg bg-[#F5F5F7] shrink-0">
      <i class="ri-search-line text-typo-300 text-sm" />
      <input
        v-model="search"
        type="text"
        placeholder="Type to Search"
        class="flex-1 min-w-0 ml-2 bg-transparent text-xs text-typo-700 placeholder:text-typo-300 outline-none focus-visible:outline-none"
      />
      <button v-if="search" type="button" class="text-typo-300 hover:text-typo-600" @click="search = ''">
        <i class="ri-close-line text-sm" />
      </button>
    </div>

    <!-- Filter chips (scroll sideways when they outgrow the column; the
         "+" stays pinned at the end) -->
    <div class="flex items-center gap-1.5 mt-1.5 shrink-0">
      <div
        ref="chips"
        class="chip-scroller flex items-center gap-2.5 flex-1 min-w-0 overflow-x-auto select-none py-2 px-1.5 -ml-1.5 rounded-lg"
        :class="dragging ? 'cursor-grabbing' : 'cursor-grab'"
        @pointerdown="onChipsDown"
        @pointermove="onChipsMove"
        @pointerup="onChipsUp"
        @pointercancel="onChipsUp"
        @click.capture="onChipsClick"
        @wheel="onChipsWheel"
      >
        <button
          v-for="f in filters"
          :key="f.key"
          type="button"
          class="shrink-0 h-6 px-3 rounded-full border text-[11px] leading-none whitespace-nowrap transition-colors"
          :class="filter === f.key
            ? 'bg-brand-50 border-brand-200 text-brand-600'
            : 'bg-white border-typo-100 text-typo-500 hover:border-typo-200'"
          @click="filter = f.key"
        >
          {{ f.label }}<span v-if="f.count !== null" class="ml-1.5">{{ f.count }}</span>
        </button>
      </div>
      <button
        type="button"
        title="New conversation"
        class="shrink-0 w-6 h-6 rounded-full border border-typo-100 text-typo-500 flex items-center justify-center hover:border-brand-300 hover:text-brand-600 transition-colors"
        @click="$emit('new')"
      >
        <i class="ri-add-line text-sm" />
      </button>
    </div>

    <!-- Channels -->
    <div class="flex-1 min-h-0 overflow-y-auto overscroll-contain mt-3 -mx-1 px-1 space-y-0.5">
      <template v-if="loading && !channels.length">
        <div v-for="n in 6" :key="n" class="flex items-center gap-2.5 px-2 py-2.5">
          <span class="w-8 h-8 rounded-full bg-typo-50 animate-pulse" />
          <span class="flex-1 space-y-1.5">
            <span class="block h-2.5 w-2/3 rounded bg-typo-50 animate-pulse" />
            <span class="block h-2 w-1/2 rounded bg-typo-50 animate-pulse" />
          </span>
        </div>
      </template>

      <p v-if="query && visible.length" class="px-2 pt-1 pb-1.5 text-[10px] font-medium uppercase tracking-wide text-typo-400">
        Conversations
      </p>
      <button
        v-for="c in visible"
        :key="c.id"
        type="button"
        class="w-full flex items-center gap-2.5 px-2 py-2.5 rounded-lg text-left transition-colors"
        :class="c.id === activeId ? 'bg-brand-50' : 'hover:bg-typo-50'"
        @click="$emit('select', c.id)"
      >
        <ChatAvatar :name="c.title" :photo="c.photo" :group="c.channel_type !== 'INDIVIDUAL'" :size="32" />
        <span class="flex-1 min-w-0">
          <span class="flex items-center justify-between gap-2">
            <span class="truncate text-[13px] text-typo-800">{{ c.title }}</span>
            <span class="shrink-0 text-[10px] text-typo-500">{{ c.time }}</span>
          </span>
          <span class="flex items-center justify-between gap-2 mt-0.5">
            <span class="truncate text-[10px]" :class="c.unread_count ? 'text-brand-600 font-medium' : 'text-typo-500'">
              {{ c.preview }}
            </span>
            <span
              v-if="c.unread_count"
              class="shrink-0 min-w-[14px] h-[14px] px-1 rounded-full bg-brand-500 text-white text-[9px] leading-[14px] text-center"
            >{{ c.unread_count > 99 ? '99+' : c.unread_count }}</span>
          </span>
        </span>
      </button>

      <!-- People: search employees to start (or reopen) a direct message -->
      <template v-if="matchedPeople.length">
        <p class="px-2 pt-3 pb-1.5 text-[10px] font-medium uppercase tracking-wide text-typo-400">People</p>
        <button
          v-for="p in matchedPeople"
          :key="'p' + p.id"
          type="button"
          class="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left hover:bg-typo-50 transition-colors disabled:opacity-60"
          :disabled="starting === p.id"
          @click="startDirect(p)"
        >
          <ChatAvatar :name="p.name" :photo="p.photo" :size="32" />
          <span class="flex-1 min-w-0">
            <span class="block truncate text-[13px] text-typo-800">{{ p.name }}</span>
            <span class="block truncate text-[10px] text-typo-500">{{ p.email || 'Send a message' }}</span>
          </span>
          <i
            class="shrink-0 text-base text-typo-300"
            :class="starting === p.id ? 'ri-loader-4-line animate-spin' : 'ri-chat-new-line'"
          />
        </button>
      </template>

      <p v-if="!loading && !visible.length && !matchedPeople.length" class="py-10 text-center text-xs text-typo-400">
        {{ query ? 'No conversations or people match.' : filter !== 'all' ? 'No conversations match.' : 'No conversations yet.' }}
      </p>
    </div>
  </div>
</template>

<script>
import ChatAvatar from './ChatAvatar.vue'
import { channelTitle, messagePreview, listTime, otherUser, RECORD_TYPES } from './chatHelpers'

const TYPE_LABEL = {
  INDIVIDUAL: 'Direct message', GROUP: 'Group', PROJECT: 'Project',
  ...Object.fromEntries(Object.entries(RECORD_TYPES).map(([t, r]) => [t, r.label])),
}
// `types` — a filter can cover several channel types (all record channels
// share the "Records" chip).
const TYPE_FILTERS = {
  direct:  { label: 'Direct',  types: ['INDIVIDUAL'] },
  group:   { label: 'Group',   types: ['GROUP'] },
  project: { label: 'Project', types: ['PROJECT'] },
  record:  { label: 'Records', types: Object.keys(RECORD_TYPES) },
}

export default {
  name: 'ChatChannelList',
  components: { ChatAvatar },
  props: {
    channels: { type: Array, default: () => [] },
    activeId: { type: Number, default: null },
    loading:  { type: Boolean, default: false },
    myId:     { type: Number, default: null },
  },
  emits: ['select', 'new'],
  inject: ['toast'],

  data() {
    return {
      search: '',
      filter: 'all',
      starting: null,
      // Drag-to-scroll state for the chip row
      dragging: false,
      dragStartX: 0,
      dragStartScroll: 0,
      dragMoved: false,
    }
  },

  computed: {
    photos() { return this.$store.getters['chat/photoByUser'] },
    query()  { return this.search.trim().toLowerCase() },
    decorated() {
      return this.channels.map((c) => ({
        ...c,
        title:   channelTitle(c, this.myId),
        photo:   c.channel_type === 'INDIVIDUAL' ? this.photos[otherUser(c, this.myId)] : null,
        preview: messagePreview(c.last_message) || TYPE_LABEL[c.channel_type],
        time:    listTime(c.last_message?.created_at || c.updated_at),
      }))
    },
    filters() {
      return [
        { key: 'all',     label: 'All',     count: null },
        { key: 'unread',  label: 'Unread',  count: this.channels.filter((c) => c.unread_count).length },
        ...Object.entries(TYPE_FILTERS).map(([key, f]) => ({
          key, label: f.label, count: this.channels.filter((c) => f.types.includes(c.channel_type)).length,
        })),
      ]
    },
    visible() {
      const types = TYPE_FILTERS[this.filter]?.types
      return this.decorated.filter((c) => {
        if (this.filter === 'unread' && !c.unread_count) return false
        if (types && !types.includes(c.channel_type)) return false
        return !this.query || c.title.toLowerCase().includes(this.query)
      })
    },
    // Only while searching, and only where a DM could appear (All/Direct).
    // People already listed above as a matching direct conversation are
    // skipped so nobody shows twice.
    matchedPeople() {
      if (!this.query || !['all', 'direct'].includes(this.filter)) return []
      const shown = new Set(
        this.visible.filter((c) => c.channel_type === 'INDIVIDUAL').map((c) => otherUser(c, this.myId)),
      )
      return this.$store.getters['chat/people']
        .filter((p) => !shown.has(p.id))
        .filter((p) => p.name?.toLowerCase().includes(this.query) || p.email?.toLowerCase().includes(this.query))
        .slice(0, 20)
    },
  },

  methods: {
    // ── Chip row: drag (mouse) / wheel to scroll sideways. Touch devices
    // already swipe natively, so only mouse pointers are handled here.
    onChipsDown(e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return
      this.dragging = true
      this.dragMoved = false
      this.dragStartX = e.clientX
      this.dragStartScroll = this.$refs.chips.scrollLeft
    },

    onChipsMove(e) {
      if (!this.dragging) return
      const dx = e.clientX - this.dragStartX
      // Capture only once it's really a drag, so plain clicks still work.
      if (!this.dragMoved && Math.abs(dx) > 4) {
        this.dragMoved = true
        this.$refs.chips.setPointerCapture?.(e.pointerId)
      }
      if (this.dragMoved) this.$refs.chips.scrollLeft = this.dragStartScroll - dx
    },

    onChipsUp(e) {
      if (!this.dragging) return
      this.dragging = false
      this.$refs.chips.releasePointerCapture?.(e.pointerId)
    },

    // A drag that ends over a chip must not also select it.
    onChipsClick(e) {
      if (!this.dragMoved) return
      e.stopPropagation()
      e.preventDefault()
      this.dragMoved = false
    },

    // Plain mouse wheels only scroll vertically — map that to sideways.
    onChipsWheel(e) {
      const el = this.$refs.chips
      if (el.scrollWidth <= el.clientWidth || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
      e.preventDefault()
      el.scrollLeft += e.deltaY
    },

    async startDirect(person) {
      this.starting = person.id
      try {
        await this.$store.dispatch('chat/openDirect', person.id)
        this.search = ''
      } catch (e) {
        this.toast?.error(e.message || 'Could not start the conversation.')
      } finally {
        this.starting = null
      }
    },
  },
}
</script>

<style scoped>
.chip-scroller { scrollbar-width: none; }
.chip-scroller::-webkit-scrollbar { display: none; }
</style>
