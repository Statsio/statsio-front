<script setup lang="ts">
defineProps<{
  stats: { label: string; value: string; hint: string }[]
}>()
</script>

<template>
  <section class="section">
    <div class="container">
      <div class="panel grid gap-6 rounded-3xl p-8 md:grid-cols-3">
        <div v-for="stat in stats" :key="stat.label" class="space-y-2">
          <p class="eyebrow">{{ stat.label }}</p>
          <p class="text-3xl font-semibold text-slate-900">{{ stat.value }}</p>
          <p class="text-sm text-slate-500">{{ stat.hint }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
