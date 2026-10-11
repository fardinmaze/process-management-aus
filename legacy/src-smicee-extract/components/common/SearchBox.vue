<template>
  <div class="search-box-group">
    <div class="search-box">
      <i class="ri-search-line" />
      <input
        :value="modelValue"
        type="text"
        :placeholder="placeholder"
        @input="$emit('update:modelValue', $event.target.value)"
        @keydown.enter="$emit('search')"
      />
      <button
        v-if="modelValue"
        type="button"
        class="search-box__clear"
        title="Clear search"
        @click="clear"
      >
        <i class="ri-close-line" />
      </button>
    </div>
    <button type="button" class="btn" :class="active ? 'btn--danger' :'btn--success'" @click="onAction">
      {{ active ? 'Clear' : 'Search' }}
    </button>
  </div>
</template>

<script>
// Search input + action button. `active` reflects whether a search is
// currently applied (e.g. present in the route query) — not just whatever's
// typed — so the label only flips to "Clear" once a search has actually
// been submitted, not on every keystroke.
export default {
  name: 'SearchBox',

  props: {
    modelValue:  { type: String, default: '' },
    placeholder: { type: String, default: 'Type to Search' },
    active:      { type: Boolean, default: false },
  },

  emits: ['update:modelValue', 'search', 'clear'],

  methods: {
    clear() {
      this.$emit('update:modelValue', '')
      this.$emit('clear')
    },

    onAction() {
      if (this.active) {
        this.clear()
      } else {
        this.$emit('search')
      }
    },
  },
}
</script>
