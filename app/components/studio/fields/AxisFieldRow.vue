<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    /** Chemin SVG d'une petite icône à gauche du label. */
    iconPath?: string
    /** Libellé lisible de la valeur courante (colonne). Vide = non renseigné. */
    value?: string
    placeholder?: string
    clearable?: boolean
  }>(),
  { iconPath: '', value: '', placeholder: 'Choisir…', clearable: false },
)

const emit = defineEmits<{ open: []; clear: [] }>()
</script>

<template>
  <div class="flex items-center gap-2">
    <span class="flex w-[78px] shrink-0 items-center gap-1.5 text-[12px] font-semibold text-[var(--studio-muted)]">
      <svg v-if="iconPath" class="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" :d="iconPath" />
      </svg>
      {{ label }}
    </span>
    <button
      type="button"
      class="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-[10px] border-[1.5px] border-[var(--studio-line-strong)] bg-white px-2.5 py-2 text-left transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--studio-accent-wash)]"
      @click="emit('open')"
    >
      <span
        class="min-w-0 flex-1 truncate font-mono text-[11.5px]"
        :class="value ? 'font-semibold text-[var(--studio-ink)]' : 'text-[var(--studio-faint)]'"
      >{{ value || placeholder }}</span>
      <span class="flex shrink-0 items-center gap-1">
        <span
          v-if="clearable && value"
          class="text-[12px] leading-none text-[var(--studio-faint)] transition-colors hover:text-[var(--color-error)]"
          role="button"
          aria-label="Effacer"
          @click.stop="emit('clear')"
        >✕</span>
        <svg class="h-3.5 w-3.5 text-[var(--studio-faint)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </span>
    </button>
  </div>
</template>
