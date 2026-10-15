<template>
  <teleport to="body">
    <div
      class="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[1000] p-4 backdrop-blur-[2px]"
      @click.self="$emit('cancel')"
    >
      <div class="bg-white rounded-[14px] w-full max-w-[440px] shadow-2xl" style="animation: modal-in .2s ease" role="dialog" aria-modal="true">

        <!-- Header -->
        <div class="flex items-center justify-between px-5 pt-[18px] pb-3.5 border-b border-slate-100">
          <h3 class="text-base font-bold text-slate-800 m-0">{{ title }}</h3>
          <button
            class="bg-transparent border-none text-xl text-slate-400 cursor-pointer p-0.5 rounded-md leading-none flex transition-colors hover:text-slate-800 hover:bg-slate-100"
            @click="$emit('cancel')"
          >
            <i class="ri-close-line" />
          </button>
        </div>

        <!-- Body -->
        <div class="px-5 py-6">
          <label v-if="label" class="form-label">{{ label }}</label>
          <div class="status-options">
            <button
              v-for="status in statusList"
              :key="status"
              type="button"
              class="status-option badge"
              :class="[`badge--${colorFor(status)}`, { 'status-option--active': selected === status }]"
              :disabled="loading"
              @click="selected = status"
            >
              <i v-if="selected === status" class="ri-check-line" />
              {{ labelFor(status) }}
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-2.5 px-5 pb-[18px] pt-3.5 border-t border-slate-100">
          <button
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-slate-100 text-slate-600 border border-slate-200 cursor-pointer transition-colors hover:bg-slate-200 disabled:opacity-60 disabled:cursor-not-allowed"
            @click="$emit('cancel')"
            :disabled="loading"
          >
            Cancel
          </button>
          <button
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white border-none cursor-pointer transition-colors bg-brand-600 hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed"
            :disabled="loading || selected === currentStatus"
            @click="$emit('confirm', selected)"
          >
            <i v-if="loading" class="ri-loader-4-line spinning" />
            {{ loading ? 'Updating…' : 'Update Status' }}
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script>
export default {
  name: 'ChangeStatusModal',
  emits: ['confirm', 'cancel'],

  props: {
    title:         { type: String,  default: 'Change Status' },
    label:         { type: String,  default: 'Select new status' },
    currentStatus: { type: String,  default: '' },
    // List of selectable status values, e.g. ['PENDING', 'APPROVED', 'DISCUSSION'].
    statusList:    { type: Array,   required: true },
    // Optional { STATUS: 'Display label' } / { STATUS: 'badge-color' } maps.
    // Falls back to the raw status value / 'default' color when omitted.
    statusLabels:  { type: Object,  default: () => ({}) },
    statusColors:  { type: Object,  default: () => ({}) },
    loading:       { type: Boolean, default: false },
  },

  data() {
    return { selected: this.currentStatus }
  },

  methods: {
    labelFor(status) { return this.statusLabels[status] ?? status },
    colorFor(status) { return this.statusColors[status] ?? 'default' },
  },
}
</script>

<style scoped>
@keyframes modal-in {
  from { opacity: 0; transform: scale(.96) translateY(8px); }
  to   { opacity: 1; transform: scale(1)  translateY(0); }
}

.status-options { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }

.status-option {
  cursor: pointer; border: 1.5px solid transparent; display: inline-flex;
  align-items: center; gap: 4px; transition: border-color .15s, opacity .15s;
}
.status-option:disabled { opacity: .6; cursor: not-allowed; }
.status-option--active  { border-color: currentColor; }
</style>
