<template>
  <teleport to="body">
    <div
      class="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[1000] p-4 backdrop-blur-[2px]"
      @click.self="$emit('close')"
    >
      <div class="bg-white rounded-[14px] w-full max-w-[440px] max-h-[80vh] shadow-2xl flex flex-col" role="dialog" aria-modal="true">
        <div class="flex items-center justify-between px-5 pt-[18px] pb-3.5 border-b border-slate-100 shrink-0">
          <div class="min-w-0">
            <h3 class="text-base font-semibold text-typo-800 m-0 truncate">{{ adding ? 'Add members' : 'Members' }}</h3>
            <p class="text-[11px] text-typo-400 truncate">{{ channel.name }}</p>
          </div>
          <button type="button" class="text-typo-300 hover:text-typo-700 text-xl leading-none" @click="$emit('close')">
            <i class="ri-close-line" />
          </button>
        </div>

        <!-- Member list -->
        <div v-if="!adding" class="flex-1 min-h-0 overflow-y-auto px-3 py-2">
          <p v-if="isProject" class="mx-2 mb-2 px-3 py-2 rounded-lg bg-brand-50 text-[11px] text-brand-700">
            Members follow the project team — manage them from the project.
          </p>
          <p v-else-if="recordLabel" class="mx-2 mb-2 px-3 py-2 rounded-lg bg-brand-50 text-[11px] text-brand-700">
            Members follow the {{ recordLabel.toLowerCase() }}'s requester, referees and approver — change them on the {{ recordLabel.toLowerCase() }}.
          </p>
          <div v-for="m in members" :key="m.user" class="flex items-center gap-2.5 px-2 py-2 rounded-lg">
            <ChatAvatar :name="m.user_name" :photo="photos[m.user] || null" :size="30" />
            <span class="flex-1 min-w-0 truncate text-[13px] text-typo-800">
              {{ m.user_name }}<span v-if="m.user === myId" class="text-typo-400"> (you)</span>
            </span>
            <span v-if="isGroup && m.role === 'ADMIN'" class="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-brand-50 text-brand-600">Admin</span>
            <button
              v-if="amAdmin && m.user !== myId"
              type="button"
              title="Remove from group"
              class="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-typo-400 hover:text-accent-500 hover:bg-accent-50 disabled:opacity-40"
              :disabled="busy"
              @click="remove(m)"
            >
              <i class="ri-user-unfollow-line" />
            </button>
          </div>
        </div>

        <!-- Add members (group admins) -->
        <div v-else class="flex-1 min-h-0 flex flex-col gap-3 px-5 pt-4">
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
                v-for="c in candidates"
                :key="c.id"
                type="button"
                class="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left hover:bg-typo-50"
                :class="{ 'bg-brand-50 hover:bg-brand-50': selected.includes(c.id) }"
                @click="toggle(c.id)"
              >
                <ChatAvatar :name="c.name" :photo="c.photo" :size="30" />
                <span class="flex-1 min-w-0">
                  <span class="block truncate text-[13px] text-typo-800">{{ c.name }}</span>
                  <span v-if="c.email" class="block truncate text-[10px] text-typo-400">{{ c.email }}</span>
                </span>
                <i v-if="selected.includes(c.id)" class="ri-checkbox-circle-fill text-brand-600" />
              </button>
              <p v-if="!candidates.length" class="py-6 text-center text-xs text-typo-400">No people found.</p>
            </template>
          </div>
        </div>

        <div v-if="isGroup" class="flex items-center justify-between gap-2 px-5 py-3.5 border-t border-slate-100 shrink-0">
          <template v-if="!adding">
            <button type="button" class="btn btn--ghost text-accent-500" @click="$emit('leave')">
              <i class="ri-logout-box-r-line" /> Leave group
            </button>
            <button v-if="amAdmin" type="button" class="btn btn--primary" @click="startAdding">
              <i class="ri-user-add-line" /> Add members
            </button>
          </template>
          <template v-else>
            <button type="button" class="btn btn--ghost" @click="adding = false">Back</button>
            <button type="button" class="btn btn--primary" :disabled="busy || !selected.length" @click="add">
              <i v-if="busy" class="ri-loader-4-line spinning" />
              Add{{ selected.length ? ` (${selected.length})` : '' }}
            </button>
          </template>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script>
import ChatAvatar from './ChatAvatar.vue'
import { debounce } from '@/utils/helpers'
import { RECORD_TYPES } from './chatHelpers'

export default {
  name: 'ChatMembers',
  components: { ChatAvatar },
  inject: ['toast'],
  props: {
    channel: { type: Object, required: true },
  },
  emits: ['close', 'leave'],

  data() {
    return { adding: false, search: '', contacts: [], selected: [], loading: false, busy: false }
  },

  computed: {
    myId()      { return this.$store.getters['auth/user']?.id },
    photos()    { return this.$store.getters['chat/photoByUser'] },
    isGroup()   { return this.channel.channel_type === 'GROUP' },
    isProject() { return this.channel.channel_type === 'PROJECT' },
    recordLabel() { return RECORD_TYPES[this.channel.channel_type]?.label || null },
    members()   { return (this.channel.members || []).filter((m) => m.is_active !== false) },
    // Admin tools only exist for GROUP channels (§2).
    amAdmin()   { return this.isGroup && this.members.some((m) => m.user === this.myId && m.role === 'ADMIN') },
    candidates() {
      const inGroup = new Set(this.members.map((m) => m.user))
      return this.contacts.filter((c) => !inGroup.has(c.id))
    },
  },

  created() {
    this.debouncedLoad = debounce(this.load, 300)
  },

  methods: {
    onSearch() {
      this.debouncedLoad()
    },

    startAdding() {
      this.adding = true
      this.selected = []
      this.load()
    },

    toggle(id) {
      const i = this.selected.indexOf(id)
      i === -1 ? this.selected.push(id) : this.selected.splice(i, 1)
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

    async add() {
      this.busy = true
      try {
        await this.$store.dispatch('chat/addMembers', { channelId: this.channel.id, member_ids: this.selected })
        await this.$store.dispatch('chat/fetchChannels')
        this.toast?.success('Members added.')
        this.adding = false
      } catch (e) {
        this.toast?.error(e.message || 'Could not add members.')
      } finally {
        this.busy = false
      }
    },

    async remove(member) {
      this.busy = true
      try {
        await this.$store.dispatch('chat/removeMember', { channelId: this.channel.id, userId: member.user })
        await this.$store.dispatch('chat/fetchChannels')
        this.toast?.success(`${member.user_name} was removed.`)
      } catch (e) {
        this.toast?.error(e.message || 'Could not remove member.')
      } finally {
        this.busy = false
      }
    },
  },
}
</script>
