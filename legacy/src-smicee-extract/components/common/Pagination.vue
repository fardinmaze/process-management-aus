<template>
  <div class="pg">
    <div class="pg__pages">
      <button type="button" class="pg__arrow" :disabled="page <= 1" @click="goTo(page - 1)">
        <i class="ri-arrow-left-s-line" />
      </button>

      <template v-for="(item, idx) in pageItems" :key="idx">
        <span v-if="editingIndex === idx" class="pg__page pg__page--editing">
          <input
            ref="editInput"
            v-model="editValue"
            type="number"
            class="pg__input"
            :min="1"
            :max="lastPage"
            @keydown.enter="commitEdit"
            @keydown.esc="cancelEdit"
            @blur="commitEdit"
          />
        </span>

        <button
          v-else-if="item === '...'"
          type="button"
          class="pg__ellipsis"
          title="Type a page number to jump to"
          @click="startEdit(idx)"
        >
          …
        </button>

        <button
          v-else
          type="button"
          class="pg__page"
          :class="{ 'pg__page--active': item === page }"
          :title="item === page ? 'Click to jump to a page' : `Go to page ${item}`"
          @click="onPageClick(item, idx)"
        >
          {{ pad(item) }}
        </button>
      </template>

      <button type="button" class="pg__arrow" :disabled="page >= lastPage" @click="goTo(page + 1)">
        <i class="ri-arrow-right-s-line" />
      </button>
    </div>

    <div class="pg__size">
      <span class="pg__size-label">Per Page</span>
      <select class="pg__size-select" :value="perPage" @change="onPerPageChange">
        <option v-for="opt in perPageOptions" :key="opt" :value="opt">{{ opt }}</option>
      </select>
    </div>
  </div>
</template>

<script>
import { nextTick } from 'vue'
import { PAGE_SIZE_OPTIONS } from '@/utils/constants'

export default {
  name: 'Pagination',

  props: {
    page:            { type: Number, required: true },
    lastPage:        { type: Number, required: true },
    perPage:         { type: Number, required: true },
    perPageOptions:  { type: Array, default: () => PAGE_SIZE_OPTIONS },
  },
  emits: ['update:page', 'update:per-page'],

  data() {
    return {
      editingIndex: null,
      editValue:    '',
    }
  },

  computed: {
    // Current page ± 1, plus first/last, with '...' filling gaps.
    pageItems() {
      const total   = this.lastPage
      const current = this.page
      const delta   = 1
      const range   = []

      for (let i = 1; i <= total; i++) {
        if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
          range.push(i)
        }
      }

      const withDots = []
      let last = null
      for (const i of range) {
        if (last !== null) {
          if (i - last === 2)     withDots.push(last + 1)
          else if (i - last > 2)  withDots.push('...')
        }
        withDots.push(i)
        last = i
      }
      return withDots
    },
  },

  methods: {
    pad(n) {
      return String(n).padStart(2, '0')
    },

    goTo(p) {
      const clamped = Math.min(Math.max(p, 1), this.lastPage)
      if (clamped !== this.page) this.$emit('update:page', clamped)
    },

    onPageClick(item, idx) {
      if (item === this.page) this.startEdit(idx)
      else this.goTo(item)
    },

    async startEdit(idx) {
      this.editValue = String(this.page)
      this.editingIndex = idx
      await nextTick()
      this.$refs.editInput?.focus()
      this.$refs.editInput?.select()
    },

    commitEdit() {
      if (this.editingIndex === null) return
      const value = Number(this.editValue)
      this.editingIndex = null
      if (Number.isFinite(value) && value > 0) this.goTo(Math.trunc(value))
    },

    cancelEdit() {
      this.editingIndex = null
    },

    onPerPageChange(e) {
      this.$emit('update:per-page', Number(e.target.value))
    },
  },
}
</script>

<style scoped>
.pg {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  width: 100%;
}

.pg__pages { display: flex; align-items: stretch; border-radius: 4px; overflow: hidden; }

.pg__arrow {
  display: inline-flex; align-items: center; justify-content: center;
  width: 40px; background: #CFD4FF; color: #272727; border: none; cursor: pointer;
  transition: background-color .15s;
}
.pg__arrow:hover:not(:disabled) { background: #B4B8FF; }
.pg__arrow:disabled { opacity: 0.5; cursor: not-allowed; }

.pg__page {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 40px; padding: 8px 14px; background: #F9F9F9; color: #555;
  font-size: 12px; font-weight: 600; border: none; border-right: 1px solid #DCDCDC;
  cursor: pointer; transition: background-color .15s;
}
.pg__page:hover { background: #EEEEEE; }
.pg__page--active { background: #573FE0; color: #F9F9F9; }
.pg__page--active:hover { background: #573FE0; }

.pg__ellipsis {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 40px; padding: 0 8px; background: #F9F9F9; color: #555;
  font-size: 12px; font-weight: 600; border: none; border-right: 1px solid #DCDCDC;
  cursor: pointer; transition: background-color .15s;
}
.pg__ellipsis:hover { background: #EEEEEE; }

.pg__page--editing { background: #fff; border-right: 1px solid #DCDCDC; padding: 0 6px; }
.pg__input {
  width: 44px; height: 100%; border: 1px solid #573FE0; border-radius: 4px;
  text-align: center; font-size: 12px; font-weight: 600; color: #272727;
  outline: none; -moz-appearance: textfield;
}
.pg__input::-webkit-outer-spin-button,
.pg__input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }

.pg__size { display: flex; align-items: center; gap: 16px; }
.pg__size-label { font-size: 12px; color: #555; white-space: nowrap; }
.pg__size-select {
  height: 40px; padding: 0 14px; border: 1px solid #DCDCDC; border-radius: 6px;
  background: #F9F9F9 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24'%3E%3Cpath fill='%23555555' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E") no-repeat right 8px center;
  font-size: 12px; font-weight: 600; color: #555; cursor: pointer; appearance: none;
  padding-right: 30px;
}
</style>
