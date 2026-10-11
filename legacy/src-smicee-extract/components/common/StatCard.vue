<template>
  <div
    class="relative bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(0,0,0,.08)]"
  >
    <!-- Left accent bar -->
    <div class="absolute top-0 left-0 bottom-0 w-1 rounded-l-xl" :style="{ background: color }" />

    <div v-if="loading" class="flex items-center gap-4 w-full">
      <div class="skeleton w-[52px] h-[52px] rounded-xl shrink-0" />
      <div class="flex-1 flex flex-col gap-2">
        <div class="skeleton h-3 w-3/5" />
        <div class="skeleton h-7 w-2/5" />
      </div>
    </div>

    <template v-else>
      <div
        class="w-[52px] h-[52px] rounded-xl flex items-center justify-center text-2xl shrink-0"
        :style="{ background: color + '20', color }"
      >
        <i :class="icon" />
      </div>

      <div class="flex-1 min-w-0">
        <span class="block text-[0.75rem] text-slate-500 font-medium mb-1">{{ label }}</span>
        <span class="block text-[1.75rem] font-extrabold text-slate-800 leading-none">{{ formattedValue }}</span>
      </div>

      <div
        v-if="trend !== null"
        class="flex items-center gap-0.5 text-[0.73rem] font-bold px-2 py-1 rounded-full shrink-0 self-start"
        :class="trend >= 0
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-red-100 text-red-600'"
      >
        <i :class="trend >= 0 ? 'ri-arrow-up-line' : 'ri-arrow-down-line'" />
        {{ Math.abs(trend) }}%
      </div>
    </template>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'StatCard',

  props: {
    label:   { type: String,  required: true },
    value:   { type: Number,  default: 0 },
    icon:    { type: String,  default: 'ri-bar-chart-line' },
    color:   { type: String,  default: '#2D5A27' },
    trend:   { type: Number,  default: null },
    loading: { type: Boolean, default: false },
  },

  setup(props) {
    const formattedValue = computed(() =>
      props.value >= 1000 ? (props.value / 1000).toFixed(1) + 'k' : String(props.value)
    )
    return { formattedValue }
  },
}
</script>
