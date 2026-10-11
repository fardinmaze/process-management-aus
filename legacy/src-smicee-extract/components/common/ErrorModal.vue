<template>
  <teleport to="body">
    <div
      class="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[1000] p-4 backdrop-blur-[2px]"
      @click.self="$emit('close')"
    >
      <div class="bg-white rounded-[14px] w-full max-w-[480px] max-h-[90vh] shadow-2xl flex flex-col" style="animation: error-modal-in .2s ease" role="alertdialog" aria-modal="true">
        <div class="flex items-center justify-between px-5 pt-[18px] pb-3.5 border-b border-slate-100 shrink-0">
          <h3 class="text-base font-bold text-slate-800 m-0">{{ title }}</h3>
          <button
            class="bg-transparent border-none text-xl text-slate-400 cursor-pointer p-0.5 rounded-md leading-none flex transition-colors hover:text-slate-800 hover:bg-slate-100"
            @click="$emit('close')"
          >
            <i class="ri-close-line" />
          </button>
        </div>

        <div class="flex gap-4 items-start px-5 py-6 overflow-y-auto min-h-0">
          <div class="w-11 h-11 rounded-xl flex items-center justify-center text-[22px] shrink-0 bg-red-100 text-red-500">
            <i class="ri-error-warning-line" />
          </div>
          <p class="flex-1 min-w-0 text-[0.9rem] text-slate-600 m-0 leading-relaxed whitespace-pre-line">{{ message }}</p>
        </div>

        <div class="flex justify-end gap-2.5 px-5 pb-[18px] pt-3.5 border-t border-slate-100 shrink-0">
          <button
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-500 border-none cursor-pointer transition-colors hover:bg-red-600"
            @click="$emit('close')"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script>
export default {
  name: 'ErrorModal',
  emits: ['close'],
  props: {
    title:   { type: String, default: 'Error' },
    message: { type: String, default: '' },
  },
}
</script>

<style scoped>
@keyframes error-modal-in {
  from { opacity: 0; transform: scale(.96) translateY(8px); }
  to   { opacity: 1; transform: scale(1)  translateY(0); }
}
</style>
