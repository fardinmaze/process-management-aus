<template>
  <div ref="root" class="ms" :class="{ 'ms--pill': pill }">
    <div v-if="pill && (modelValue.length || !searchWhenEmpty)" class="ms__chips" :class="{ 'ms__chips--inline': pill }">
      <span v-for="o in modelValue" :key="o.id" class="ms-chip">
        <span class="ms-chip__avatar">
          <img v-if="photoUrl(o)" :src="photoUrl(o)" :alt="optionLabel(o)" />
          <span v-else>{{ getInitials(optionLabel(o)) }}</span>
        </span>
        <span class="ms-chip__name">{{ optionLabel(o) }}</span>
        <button type="button" class="ms-chip__remove" title="Remove" :disabled="disabled" @click="remove(o)">
          <i class="ri-close-line" />
        </button>
      </span>

      <button v-if="pill" type="button" class="ms__add-trigger" title="Add member" :disabled="disabled" @click="toggleOpen">
        <i class="ri-add-line" />
      </button>
    </div>

    <!-- searchWhenEmpty: with nothing selected yet, show the search input itself
         instead of a "+" trigger you'd have to click first. Once a member is
         added, the block above (chips + "+") takes over. -->
    <div v-else-if="pill && searchWhenEmpty" class="ms__inline-search">
      <i class="ri-search-line" />
      <input v-model="search" type="text" :placeholder="placeholder"  :disabled="disabled" @focus="open = true" />
    </div>

    <button v-if="!pill" type="button" class="form-select ms__trigger" :disabled="disabled" @click="toggleOpen">
      <span class="ms__placeholder">{{ placeholder }}</span>
      <i class="ri-arrow-down-s-line" />
    </button>

    <div v-if="open" class="ms__panel" :class="{ 'ms__panel--pill': pill, 'ms__panel--up': openUp }">
      <div v-if="!(pill && searchWhenEmpty && !modelValue.length)" class="ms__search">
        <i class="ri-search-line" />
        <input v-model="search" type="text" :placeholder="searchPlaceholder" />
      </div>

      <div class="ms__options">
        <label v-for="o in filteredOptions" :key="o.id" class="ms__option" :class="{ 'ms__option--disabled': isMaxReached(o) }">
          <input type="checkbox" :checked="isSelected(o)" :disabled="isMaxReached(o)" @change="toggle(o)" class="hidden" />
          <span class="ms__option-avatar">
            <img v-if="photoUrl(o)" :src="photoUrl(o)" :alt="optionLabel(o)" />
            <span v-else>{{ getInitials(optionLabel(o)) }}</span>
          </span>
          <span class="ms__option-name">{{ optionLabel(o) }}</span>
          <i class="ri-check-line ms__option-check" />
        </label>
        <p v-if="!filteredOptions.length" class="ms__empty">
          {{ options.length ? 'No matches.' : 'No members available.' }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { getInitials } from '@/utils/helpers'
import { API_HOST }    from '@/utils/apiPaths'

export default {
  name: 'MultiSelect',
  emits: ['update:modelValue'],

  props: {
    modelValue:  { type: Array,   default: () => [] },
    options:     { type: Array,   default: () => [] },
    placeholder: { type: String,  default: 'Search or select…' },
    // Placeholder for the actual search <input> — inline (searchWhenEmpty) and
    // the panel's own search box. Kept separate from `placeholder` above since
    // that one only labels the classic (non-pill) trigger button.
    searchPlaceholder: { type: String, default: 'Search' },
    disabled:    { type: Boolean, default: false },
    pill:        { type: Boolean, default: false },
    // Pill mode only: show a live search input in place of the "+" trigger
    // while nothing is selected yet.
    searchWhenEmpty: { type: Boolean, default: false },
    // Caps how many options can be selected at once. When max is 1, picking
    // a new option swaps out the current one instead of being blocked —
    // reads like a single-select. Null means unlimited.
    max: { type: Number, default: null },
  },

  data() {
    return {
      open:   false,
      openUp: false,
      search: '',
    }
  },

  watch: {
    // Decide the panel's direction each time it opens, from the space left
    // below the field in the viewport (panel is ~260px tall at most).
    open(isOpen) {
      if (!isOpen) return
      const rect = this.$refs.root?.getBoundingClientRect()
      if (!rect) return
      const below = window.innerHeight - rect.bottom
      this.openUp = below < 280 && rect.top > below
    },
  },

  computed: {
    filteredOptions() {
      const q = this.search.trim().toLowerCase()
      if (!q) return this.options
      return this.options.filter((o) => this.optionLabel(o).toLowerCase().includes(q))
    },
  },

  mounted() {
    document.addEventListener('mousedown', this.handleClickOutside)
  },
  beforeUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside)
  },

  methods: {
    getInitials,

    optionLabel(o) {
      return o.full_name
        || [o.first_name, o.last_name].filter(Boolean).join(' ')
        || o.username
        || 'Unknown'
    },

    photoUrl(o) {
      const photo = o.photo
      if (!photo) return null
      return photo.startsWith('http') ? photo : API_HOST + photo
    },

    isSelected(o) {
      return this.modelValue.some((m) => m.id === o.id)
    },

    isMaxReached(o) {
      // max === 1 swaps instead of blocking, so it never counts as "reached"
      // for disabling purposes.
      if (!this.max || this.max === 1 || this.isSelected(o)) return false
      return this.modelValue.length >= this.max
    },

    toggle(o) {
      if (this.isSelected(o)) {
        this.remove(o)
        return
      }
      if (this.max === 1) {
        this.$emit('update:modelValue', [o])
        return
      }
      if (this.max && this.modelValue.length >= this.max) return
      this.$emit('update:modelValue', [...this.modelValue, o])
    },

    remove(o) {
      this.$emit('update:modelValue', this.modelValue.filter((m) => m.id !== o.id))
    },

    toggleOpen() {
      if (this.disabled) return
      this.open = !this.open
    },

    handleClickOutside(e) {
      if (!this.open) return
      if (this.$refs.root?.contains(e.target)) return
      this.open = false
    },
  },
}
</script>

<style scoped>
.ms { position: relative; }

.ms__chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
.ms-chip {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 8px 4px 4px; border-radius: 999px;
  background: #F5F4FF; border: 1px solid #E4E1FF;
  font-size: 12px; font-weight: 600; color: #272727;
}
.ms-chip__avatar {
  width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  background: #573FE0; color: #fff; font-size: 10px; font-weight: 700;
}
.ms-chip__avatar img { width: 100%; height: 100%; object-fit: cover; }
.ms-chip__name { white-space: nowrap; }
.ms-chip__remove {
  display: inline-flex; align-items: center; justify-content: center;
  width: 16px; height: 16px; border: none; border-radius: 50%; padding: 0;
  background: transparent; color: #6E6E6F; cursor: pointer; font-size: 13px;
  transition: background-color .15s, color .15s;
}
.ms-chip__remove:hover:not(:disabled) { background: #FFC2C0; color: #B3261E; }
.ms-chip__remove:disabled { opacity: .5; cursor: not-allowed; }

.ms__trigger {
  width: 100%; display: flex; align-items: center; justify-content: space-between;
  gap: 8px; text-align: left; cursor: pointer;
}
.ms__trigger:disabled { opacity: .6; cursor: not-allowed; }
.ms__placeholder { color: #A3A3A4; }

.ms__panel {
  position: absolute; z-index: 20; top: calc(100% + 6px); left: 0; right: 0;
  background: #fff; border: 1px solid #DCDCDC; border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  display: flex; flex-direction: column; overflow: hidden;
}

/* ── Pill variant: chips + a round "+" trigger in one wrapped row,
   instead of a full-width select box (used by the EOD "Referred to" field) ── */
.ms--pill { position: relative; }
.ms__chips--inline { display: flex; flex-wrap: wrap; align-items: center; margin-bottom: 0; }

.ms--pill .ms-chip {
  background: #F9F9F9; border: 1px solid #DCDCDC; padding: 6px 8px 6px 6px;
}
.ms--pill .ms-chip__avatar { width: 18px; height: 18px; font-size: 9px; }
.ms--pill .ms-chip__name { font-size: 11px; font-weight: 500; color: #3D3D3E; }

.ms__add-trigger {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 999px; flex-shrink: 0;
  background: #EBFFED; border: 1.5px solid #BAEFBF; color: #008610;
  font-size: 15px; cursor: pointer; padding: 0; transition: background-color .15s;
}
.ms__add-trigger:hover:not(:disabled) { background: #BAEFBF; }
.ms__add-trigger:disabled { opacity: .5; cursor: not-allowed; }

/* max-width caps it to the viewport on small devices — a fixed 300px can
   be wider than the whole screen there, pushing it off-screen even though
   the anchor itself is already bounded within the page. */
.ms__panel--pill { left: 0; right: auto; width: 300px; max-width: min(100%, calc(100vw - 48px)); }

/* Not enough room below the field (e.g. near the bottom of a sidebar) —
   open upwards instead of spilling out of the viewport. */
.ms__panel--up { top: auto; bottom: calc(100% + 6px); }

.ms__search {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 12px; border-bottom: 1px solid #F0F0F0;
  color: #A3A3A4; font-size: 13px;
}
.ms__search input {
  flex: 1; border: none; outline: none; font-size: 13px; color: #272727; background: transparent;
}

.ms__inline-search {
  display: flex; align-items: center; gap: 8px;
  width: 100%; padding: 10px 12px; border-radius: 8px;
  background: #F9F9F9; color: #A3A3A4; font-size: 13px;
  transition: background-color .15s;
}
.ms__inline-search:focus-within { background: #fff; box-shadow: inset 0 0 0 1.5px #573FE0; }
.ms__inline-search input {
  flex: 1; border: none; outline: none; font-size: 13px; color: #272727; background: transparent;
}

.ms__options { max-height: 220px; overflow-y: auto; padding: 8px 4px; }
.ms__option {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 8px; border-radius: 8px; cursor: pointer;
  font-size: 13px; color: #272727; transition: background-color .15s;
}
.ms__option:hover { background: #F9F9F9; }
.ms__option input[type="checkbox"] { accent-color: #573FE0; width: 14px; height: 14px; flex-shrink: 0; }
.ms__option--disabled { opacity: .5; cursor: not-allowed; }
.ms__option--disabled:hover { background: none; }
.ms__option-avatar {
  width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  background: #CFD4FF; color: #4010BD; font-size: 10px; font-weight: 700;
}
.ms__option-avatar img { width: 100%; height: 100%; object-fit: cover; }
.ms__option-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ms__option-check { display: none; color: #573FE0; }
.ms__option input:checked ~ .ms__option-check { display: block; }

.ms__empty { margin: 0; padding: 16px 8px; text-align: center; font-size: 12.5px; color: #A3A3A4; }
</style>
