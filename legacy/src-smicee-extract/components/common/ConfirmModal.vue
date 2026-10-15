<template>
  <teleport to="body">
    <div
      class="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[1000] p-4 backdrop-blur-[2px]"
      @click.self="$emit('cancel')"
    >
      <div class="bg-white rounded-[14px] w-full max-w-[440px] max-h-[90vh] shadow-2xl flex flex-col" style="animation: modal-in .2s ease" role="dialog" aria-modal="true">

        <!-- Header -->
        <div class="flex items-center justify-between px-5 pt-[18px] pb-3.5 border-b border-slate-100 shrink-0">
          <h3 class="text-base font-bold text-slate-800 m-0">{{ title }}</h3>
          <button
            class="bg-transparent border-none text-xl text-slate-400 cursor-pointer p-0.5 rounded-md leading-none flex transition-colors hover:text-slate-800 hover:bg-slate-100"
            @click="$emit('cancel')"
          >
            <i class="ri-close-line" />
          </button>
        </div>

        <!-- Body -->
        <div class="flex gap-4 items-start px-5 py-6 overflow-y-auto min-h-0">
          <div
            class="w-11 h-11 rounded-xl flex items-center justify-center text-[22px] shrink-0"
            :class="{
              'bg-red-100 text-red-500':    confirmVariant === 'danger',
              'bg-brand-100 text-brand-600': confirmVariant === 'primary',
              'bg-amber-100 text-amber-600': confirmVariant === 'warning',
            }"
          >
            <i :class="variantIcon" />
          </div>
          <div class="flex-1 min-w-0 flex flex-col gap-3">
            <p class="text-[0.9rem] text-slate-600 m-0 leading-relaxed" v-html="message" />
            <!-- Optional extra form content (e.g. an account picker) —
                 empty by default, so existing callers are unaffected. -->
            <slot name="extra" />
          </div>
        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-2.5 px-5 pb-[18px] pt-3.5 border-t border-slate-100 shrink-0">
          <button
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-slate-100 text-slate-600 border border-slate-200 cursor-pointer transition-colors hover:bg-slate-200 disabled:opacity-60 disabled:cursor-not-allowed"
            @click="$emit('cancel')"
            :disabled="loading"
          >
            Cancel
          </button>
          <button
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white border-none cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            :class="{
              'bg-brand-600 hover:bg-brand-700': confirmVariant === 'primary',
              'bg-red-500 hover:bg-red-600':       confirmVariant === 'danger',
              'bg-amber-500 hover:bg-amber-600':   confirmVariant === 'warning',
            }"
            @click="$emit('confirm')"
            :disabled="loading || confirmDisabled"
          >
            <i v-if="loading" class="ri-loader-4-line spinning" />
            {{ loading ? 'Please wait…' : confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'ConfirmModal',
  emits: ['confirm', 'cancel'],

  props: {
    title:          { type: String,  default: 'Confirm Action' },
    message:        { type: String,  default: 'Are you sure?' },
    confirmLabel:   { type: String,  default: 'Confirm' },
    confirmVariant: { type: String,  default: 'primary' },
    loading:        { type: Boolean, default: false },
    confirmDisabled: { type: Boolean, default: false },
  },

  setup(props) {
    const variantIcon = computed(() => ({
      danger:  'ri-error-warning-line',
      primary: 'ri-question-line',
      warning: 'ri-alert-line',
    }[props.confirmVariant] ?? 'ri-question-line'))

    return { variantIcon }
  },
}
</script>

<style scoped>
@keyframes modal-in {
  from { opacity: 0; transform: scale(.96) translateY(8px); }
  to   { opacity: 1; transform: scale(1)  translateY(0); }
}
</style>
