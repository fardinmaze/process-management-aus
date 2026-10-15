<template>
  <div class="flex flex-col h-full min-h-0">
    <div v-if="!embedded" class="flex items-center justify-between gap-2 h-[52px] pb-3 border-b border-typo-100 shrink-0">
      <h3 class="text-base font-medium text-typo-800">Shared Contents</h3>
      <button
        type="button"
        title="Close shared contents"
        class="w-8 h-8 rounded-lg flex items-center justify-center text-typo-400 hover:text-typo-800 hover:bg-typo-50 transition-colors"
        @click="$emit('close')"
      >
        <i class="ri-close-line text-xl" />
      </button>
    </div>

    <div class="flex-1 min-h-0 overflow-y-auto overscroll-contain">
      <section
        v-for="(g, i) in groups"
        :key="g.label"
        class="py-4"
        :class="{ 'border-t border-typo-100': i > 0 }"
      >
        <p class="mb-2.5 pr-3 text-right text-[11px] text-typo-500">{{ g.label }}</p>
        <div class="flex flex-col gap-2 px-3">
          <a
            v-for="f in g.files"
            :key="f.id"
            :href="f.url"
            target="_blank"
            rel="noopener"
            :title="`${f.name} · ${f.size}`"
            class="flex items-center gap-2 h-[34px] px-2.5 rounded-md border border-typo-100 bg-[#F7F7F8] hover:border-brand-200 hover:bg-brand-50 transition-colors"
          >
            <i :class="f.icon.cls" class="shrink-0 text-lg leading-none" :style="{ color: f.icon.color }" />
            <span class="truncate text-[11px] text-brand-600">{{ f.name }}</span>
          </a>
        </div>
      </section>

      <div v-if="!groups.length && !bucket.loading" class="py-12 text-center">
        <i class="ri-folder-open-line text-3xl text-typo-200" />
        <p class="mt-2 text-xs text-typo-400">No files shared{{ bucket.hasMore ? ' in recent messages' : ' yet' }}.</p>
      </div>

      <!-- There's no attachments-list endpoint — files are gathered from the
           loaded message history, so offer to pull in older pages. -->
      <div v-if="bucket.hasMore" class="pt-2 pb-4 text-center">
        <button
          type="button"
          class="text-[11px] text-brand-600 hover:underline disabled:opacity-50"
          :disabled="bucket.loading"
          @click="loadOlder"
        >
          <i v-if="bucket.loading" class="ri-loader-4-line animate-spin" />
          {{ bucket.loading ? 'Loading…' : 'Load older files' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import dayjs from 'dayjs'
import { fileUrl, formatSize, fileIcon } from './chatHelpers'

function dayLabel(iso) {
  const d = dayjs(iso)
  if (d.isSame(dayjs(), 'day')) return 'Today'
  if (d.isSame(dayjs().subtract(1, 'day'), 'day')) return 'Yesterday'
  return d.isSame(dayjs(), 'year') ? d.format('D MMM') : d.format('D MMM YYYY')
}

export default {
  name: 'ChatSharedContents',
  inject: ['toast'],
  props: {
    channelId: { type: Number, required: true },
    // Inside another panel that has its own title/close (RecordChatSidebar's
    // "Files" tab) — hide this header.
    embedded:  { type: Boolean, default: false },
  },
  emits: ['close'],

  computed: {
    bucket() { return this.$store.getters['chat/messagesFor'](this.channelId) },

    // Newest day first, newest file first within the day.
    groups() {
      const files = this.bucket.items
        .filter((m) => (m.message_type === 'FILE' || m.message_type === 'IMAGE') && m.attachment)
        .slice()
        .reverse()
      const out = []
      for (const m of files) {
        const label = dayLabel(m.created_at)
        let g = out[out.length - 1]
        if (!g || g.label !== label) out.push((g = { label, files: [] }))
        g.files.push({
          id:   m.id,
          name: m.attachment.file_name || 'Attachment',
          size: formatSize(m.attachment.file_size),
          url:  fileUrl(m.attachment.file),
          icon: fileIcon(m.attachment.file_name, m.message_type),
        })
      }
      return out
    },
  },

  methods: {
    async loadOlder() {
      try {
        await this.$store.dispatch('chat/fetchMessages', { channelId: this.channelId })
      } catch (e) {
        this.toast?.error(e.message || 'Failed to load older messages.')
      }
    },
  },
}
</script>
