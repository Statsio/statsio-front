<script setup lang="ts">
import DsButton from '@/components/ds/DsButton.vue'
import StudioIcon from '@/components/studio/ui/StudioIcon.vue'

defineProps<{
  contentTypeLabel: string
  studioPath: string
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <div class="flex flex-col items-start gap-4">
    <span class="flex h-12 w-12 items-center justify-center rounded-[4px] border-2 border-[var(--ds-ol)] bg-[var(--ds-tint)] text-[var(--ds-accent)] shadow-[3px_3px_0_var(--ds-sh)]">
      <StudioIcon name="spark" :size="22" />
    </span>
    <div>
      <p class="text-[22px] font-extrabold leading-none text-[var(--ds-text)]" style="font-family: var(--ds-display); font-stretch: 92%">
        Votre {{ contentTypeLabel }} est prêt
      </p>
      <p class="mt-2 max-w-sm text-[13.5px] leading-relaxed text-[var(--ds-muted)]">
        Il est enregistré en brouillon. Ouvrez le Studio pour ajouter vos blocs, graphiques et données.
      </p>
    </div>
    <div class="mt-1 flex flex-wrap items-center gap-3">
      <DsButton :to="studioPath" @click="emit('close')">Modifier avec le Studio</DsButton>
      <button
        type="button"
        class="text-[13px] font-bold text-[var(--ds-faint)] hover:text-[var(--ds-text)]"
        @click="emit('close')"
      >
        Fermer
      </button>
    </div>
  </div>
</template>
