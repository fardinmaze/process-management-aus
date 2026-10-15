<template>
  <div class="flex flex-col gap-1 max-w-full" :class="mine ? 'items-end' : 'items-start'">
    <!-- Image -->
    <a
      v-if="message.message_type === 'IMAGE' && url"
      :href="url"
      target="_blank"
      rel="noopener"
      class="block overflow-hidden rounded-lg border border-typo-100 max-w-[260px]"
    >
      <img :src="url" :alt="message.attachment?.file_name" class="block w-full h-auto" loading="lazy" />
    </a>

    <!-- File -->
    <a
      v-else-if="message.message_type === 'FILE'"
      :href="url"
      target="_blank"
      rel="noopener"
      class="flex items-center gap-2.5 px-3 py-2 rounded-lg max-w-[280px]"
      :class="mine ? 'bg-brand-600 text-white' : 'bg-brand-50 text-typo-700'"
    >
      <span
        class="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
        :class="mine ? 'bg-white' : 'bg-white/80'"
      >
        <i :class="icon.cls" class="text-xl leading-none" :style="{ color: icon.color }" />
      </span>
      <span class="min-w-0">
        <span class="block truncate text-[11px] font-medium">{{ message.attachment?.file_name || 'Attachment' }}</span>
        <span class="block text-[9px]" :class="mine ? 'text-white/70' : 'text-typo-400'">
          {{ formatSize(message.attachment?.file_size) }}
        </span>
      </span>
      <i class="ri-download-2-line shrink-0 ml-1" />
    </a>

    <!-- Text — on its own, or as the caption sent with a file/photo -->
    <p
      v-if="message.content"
      class="px-3 py-2 rounded-lg text-[11px] leading-[1.55] whitespace-pre-wrap break-words max-w-full"
      :class="mine ? 'bg-brand-600 text-white' : 'bg-brand-50 text-typo-700'"
    >{{ message.content }}</p>
  </div>
</template>

<script>
import { fileUrl, formatSize, fileIcon } from './chatHelpers'

export default {
  name: 'ChatBubble',
  props: {
    message: { type: Object, required: true },
    mine:    { type: Boolean, default: false },
  },
  computed: {
    url()  { return fileUrl(this.message.attachment?.file) },
    icon() { return fileIcon(this.message.attachment?.file_name, this.message.message_type) },
  },
  methods: { formatSize },
}
</script>
