<script setup lang="ts">
withDefaults(defineProps<{ value: string; tone?: 'ink' | 'violet' | 'blue' | 'red' }>(), {
  tone: 'ink',
})

const toneClass: Record<string, string> = {
  ink: 'text-[var(--studio-ink)]',
  violet: 'text-[var(--studio-tag-ink)]',
  blue: 'text-[var(--color-accent)]',
  red: 'text-[var(--color-error)]',
}
</script>

<template>
  <div
    class="flex items-center gap-3 rounded-xl border border-[var(--studio-line)] bg-[var(--studio-panel)] px-[15px] py-[13px]"
  >
    <span class="text-[11px] font-extrabold uppercase tracking-[0.05em] text-[var(--studio-faint)]">Aperçu</span>
    <span class="font-mono text-[15px] font-semibold" :class="toneClass[tone]">{{ value }}</span>
  </div>
</template>
