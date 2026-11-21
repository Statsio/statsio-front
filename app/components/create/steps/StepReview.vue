<script setup lang="ts">
defineProps<{
  rows: { label: string; value: string }[]
}>()
</script>

<template>
  <div class="flex flex-col gap-2">
    <div
      v-for="row in rows"
      :key="row.label"
      class="flex items-baseline justify-between gap-3.5 rounded-[4px] border-2 border-[var(--ds-divide)] bg-[var(--ds-tint)] px-3.5 py-3"
    >
      <span class="text-[12px] font-bold text-[var(--ds-muted)]">{{ row.label }}</span>
      <span class="text-right text-[13.5px] font-extrabold text-[var(--ds-text)]">{{ row.value }}</span>
    </div>
    <p class="pt-1 text-[12.5px] leading-relaxed text-[var(--ds-muted)]">
      Le contenu sera créé en brouillon. Vous le publierez depuis le Studio.
    </p>
  </div>
</template>
