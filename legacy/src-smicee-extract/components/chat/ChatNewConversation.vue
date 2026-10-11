<template>
  <teleport to="body">
    <transition name="chat-drawer" appear @after-leave="$emit('close')">
    <div
      v-if="visible"
      class="chat-drawer fixed inset-0 bg-slate-900/30 z-[1000] flex"
      @click.self="visible = false"
    >
      <aside
        class="chat-drawer__panel bg-white flex flex-col h-full overflow-hidden ml-auto w-full max-w-[420px] shadow-[-4px_0_24px_rgba(220,220,220,0.4)]"
        role="dialog"
        aria-modal="true"
        aria-label="New conversation"
      >
        <div class="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 shrink-0">
          <div class="min-w-0">
            <h3 class="m-0 text-[20px] font-medium text-typo-800">New conversation</h3>
            <p class="mt-0.5 text-xs text-typo-400">
              {{ mode === 'group' ? 'Name the group and pick its members' : 'Pick someone to message' }}
            </p>
          </div>
          <button
            type="button"
            class="shrink-0 p-0.5 rounded-md text-xl leading-none text-typo-300 hover:text-typo-800 hover:bg-[#F0F0F0] transition-colors"
            @click="visible = false"
          >
            <i class="ri-close-line" />
          </button>
        </div>

        <div class="px-5 pt-4 flex flex-col gap-3 min-h-0 flex-1">
          <!-- Mode -->
          <div class="flex gap-1.5 shrink-0">
            <button
              v-for="m in modes"
              :key="m.key"
              type="button"
              class="h-7 px-3.5 rounded-full border text-xs transition-colors"
              :class="mode === m.key ? 'bg-brand-50 border-brand-200 text-brand-600' : 'border-typo-100 text-typo-500'"
              @click="setMode(m.key)"
            >{{ m.label }}</button>
          </div>

          <input
            v-if="mode === 'group'"
            v-model="groupName"
            type="text"
            maxlength="100"
            placeholder="Group name"
            class="h-9 shrink-0 px-3 rounded-lg border border-typo-100 text-sm outline-none focus-visible:outline-none focus:border-brand-500"
          />

          <div class="flex items-center h-9 shrink-0 px-3 rounded-lg bg-[#F5F5F7]">
            <i class="ri-search-line text-typo-300 text-sm" />
            <input
              v-model="search"
              type="text"
              placeholder="Search people"
              class="flex-1 min-w-0 ml-2 bg-transparent text-xs outline-none focus-visible:outline-none placeholder:text-typo-300"
              @input="onSearch"
            />
          </div>

          <div class="flex-1 min-h-[200px] overflow-y-auto -mx-2 pb-2">
            <p v-if="loading" class="py-6 text-center text-xs text-typo-400"><i class="ri-loader-4-line animate-spin" /> Loading…</p>
            <template v-else>
              <button
                v-for="c in contacts"
                :key="c.id"
                type="button"
                class="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left hover:bg-typo-50"
                :class="{ 'bg-brand-50 hover:bg-brand-50': selected.includes(c.id) }"
                :disabled="busy"
                @click="pick(c)"
              >
                <ChatAvatar :name="c.name" :photo="c.photo" :size="30" />
                <span class="flex-1 min-w-0">
                  <span class="block truncate text-[13px] text-typo-800">{{ c.name }}</span>
                  <span v-if="c.email" class="block truncate text-[10px] text-typo-400">{{ c.email }}</span>
                </span>
                <i v-if="mode === 'group' && selected.includes(c.id)" class="ri-checkbox-circle-fill text-brand-600" />
              </button>
              <p v-if="!contacts.length" class="py-6 text-center text-xs text-typo-400">No people found.</p>
            </template>
          </div>
        </div>

        <div v-if="mode === 'group'" class="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-slate-100 shrink-0">
          <button type="button" class="btn btn--ghost" @click="visible = false">Cancel</button>
          <button
            type="button"
            class="btn btn--primary"
            :disabled="busy || !groupName.trim() || !selected.length"
            @click="createGroup"
          >
            <i v-if="busy" class="ri-loader-4-line spinning" />
            Create group{{ selected.length ? ` (${selected.length})` : '' }}
          </button>
        </div>
      </aside>
    </div>
    </transition>
  </teleport>
</template>

<script>
import ChatAvatar from './ChatAvatar.vue'
import { debounce } from '@/utils/helpers'

export default {
  name: 'ChatNewConversation',
  components: { ChatAvatar },
  inject: ['toast'],
  emits: ['close', 'created'],

  data() {
    return {
      modes: [{ key: 'direct', label: 'Direct message' }, { key: 'group', label: 'New group' }],
      visible: true,
      mode: 'direct',
      search: '',
      groupName: '',
      contacts: [],
      selected: [],
      loading: false,
      busy: false,
    }
  },

  created() {
    this.debouncedLoad = debounce(this.load, 300)
    this.load()
    document.addEventListener('keydown', this.onKeydown)
  },

  beforeUnmount() {
    document.removeEventListener('keydown', this.onKeydown)
  },

  methods: {
    // Esc closes the drawer only (ChatWidget ignores Esc while it's open).
    onKeydown(e) {
      if (e.key === 'Escape') this.visible = false
    },

    onSearch() {
      this.debouncedLoad()
    },

    setMode(mode) {
      this.mode = mode
      this.selected = []
    },

    async load() {
      this.loading = true
      try {
        this.contacts = await this.$store.dispatch('chat/searchContacts', this.search.trim())
      } catch {
        this.contacts = []
      } finally {
        this.loading = false
      }
    },

    async pick(c) {
      if (this.mode === 'group') {
        const i = this.selected.indexOf(c.id)
        i === -1 ? this.selected.push(c.id) : this.selected.splice(i, 1)
        return
      }
      this.busy = true
      try {
        const channel = await this.$store.dispatch('chat/openIndividual', c.id)
        this.$emit('created', channel.id)
      } catch (e) {
        this.toast?.error(e.message || 'Could not start conversation.')
      } finally {
        this.busy = false
      }
    },

    async createGroup() {
      this.busy = true
      try {
        const channel = await this.$store.dispatch('chat/createGroup', {
          name: this.groupName.trim(),
          member_ids: this.selected,
        })
        this.$emit('created', channel.id)
      } catch (e) {
        this.toast?.error(e.message || 'Could not create group.')
      } finally {
        this.busy = false
      }
    },
  },
}
</script>

<style scoped>
.chat-drawer-enter-active,
.chat-drawer-leave-active { transition: background-color .22s ease; }
.chat-drawer-enter-from,
.chat-drawer-leave-to { background-color: transparent; }

.chat-drawer-enter-active .chat-drawer__panel,
.chat-drawer-leave-active .chat-drawer__panel { transition: transform .22s ease; }
.chat-drawer-enter-from .chat-drawer__panel,
.chat-drawer-leave-to .chat-drawer__panel { transform: translateX(100%); }
</style>
