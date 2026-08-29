<script setup lang="ts">
/**
 * Carte « Bientôt » : présente une fonctionnalité de la maquette dont le
 * backend ne dispose pas encore (mots-clés, options de publication,
 * autorisations fines, historique des versions…). Le contenu illustratif passé
 * en slot est grisé et non interactif.
 */
withDefaults(
  defineProps<{
    title: string
    description?: string
    note?: string
  }>(),
  { description: '', note: '' },
)
</script>

<template>
  <div
    class="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_3px_rgba(20,20,30,0.05)]"
  >
    <div class="flex items-baseline justify-between gap-3">
      <p class="text-sm font-bold text-slate-950">{{ title }}</p>
      <span
        class="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.05em] text-slate-400"
      >
        Bientôt
      </span>
    </div>
    <p v-if="description" class="mt-1 text-[12.5px] text-slate-500">{{ description }}</p>

    <div
      v-if="$slots.default"
      class="pointer-events-none mt-4 select-none opacity-45"
      aria-hidden="true"
    >
      <slot />
    </div>

    <p v-if="note" class="mt-4 text-[11.5px] text-slate-400">{{ note }}</p>
  </div>
</template>
