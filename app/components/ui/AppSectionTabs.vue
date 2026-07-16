<script setup lang="ts">
defineProps<{
  tabs: { label: string; to: string; active: boolean }[]
}>()
</script>

<template>
  <div class="mb-7 inline-flex gap-1 rounded-full border border-[rgba(20,20,30,0.08)] bg-white p-1">
    <NuxtLink
      v-for="tab in tabs"
      :key="tab.to"
      :to="tab.to"
      class="rounded-full px-5 py-2.5 text-[13.5px] font-bold transition-colors"
      :class="tab.active ? 'bg-[var(--color-primary)] text-white' : 'text-slate-900 hover:bg-slate-50'"
    >
      {{ tab.label }}
    </NuxtLink>
  </div>
</template>
