<template>
  <div class="text-sm">
    <div v-if="!lint" class="text-slate-400">Lint runs while the version is in progress.</div>
    <template v-else>
      <div v-if="!lint.blocking.length && !lint.warnings.length" class="text-green-700">No problems found.</div>
      <div v-if="lint.blocking.length" class="mb-2">
        <div class="font-semibold text-red-700">Blocking ({{ lint.blocking.length }})</div>
        <ul class="m-0 pl-5 text-red-700"><li v-for="(b, i) in lint.blocking" :key="i">{{ b.message }}</li></ul>
      </div>
      <div v-if="lint.warnings.length">
        <div class="font-semibold text-amber-700">Warnings ({{ lint.warnings.length }}). These do not block publishing.</div>
        <ul class="m-0 pl-5 text-amber-700"><li v-for="(w, i) in lint.warnings" :key="i">{{ w.message }}</li></ul>
      </div>
    </template>
  </div>
</template>

<script setup>
defineProps({ lint: { type: Object, default: null } })
</script>
