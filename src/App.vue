<template>
  <router-view />
  <div class="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 w-80">
    <div
      v-for="t in toasts"
      :key="t.id"
      class="rounded-lg px-4 py-3 text-sm shadow-lg border"
      :class="t.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-slate-200 text-slate-700'"
    >{{ t.message }}</div>
  </div>
</template>

<script setup>
import { toasts } from '@/session'
</script>
