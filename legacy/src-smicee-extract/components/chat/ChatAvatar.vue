<template>
  <span
    class="inline-flex items-center justify-center rounded-full shrink-0 overflow-hidden font-medium select-none"
    :class="group ? 'bg-brand-50 text-brand-600' : 'bg-brand-100 text-brand-700'"
    :style="{ width: size + 'px', height: size + 'px', fontSize: Math.round(size * 0.38) + 'px' }"
  >
    <img v-if="photo && !broken" :src="photo" :alt="name" class="w-full h-full object-cover" @error="broken = true" />
    <i v-else-if="group" class="ri-group-line" :style="{ fontSize: Math.round(size * 0.5) + 'px' }" />
    <span v-else>{{ initials }}</span>
  </span>
</template>

<script>
import { getInitials } from '@/utils/helpers'

export default {
  name: 'ChatAvatar',
  props: {
    name:  { type: String, default: '' },
    photo: { type: String, default: null },
    group: { type: Boolean, default: false },
    size:  { type: Number, default: 32 },
  },
  data() {
    return { broken: false }
  },
  watch: {
    photo() { this.broken = false },
  },
  computed: {
    initials() { return getInitials(this.name) || '?' },
  },
}
</script>
