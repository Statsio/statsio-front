<script setup lang="ts">
import DsButton from '@/components/ds/DsButton.vue'

/** Suivre / ne plus suivre un dossier (bascule `aria-pressed`). */
defineProps<{ following: boolean; name: string }>()
const emit = defineEmits<{ toggle: [] }>()
</script>

<template>
  <DsButton
    size="sm"
    variant="secondary"
    class="dfol"
    :class="{ 'is-on': following }"
    :aria-pressed="following"
    :aria-label="`${following ? 'Ne plus suivre' : 'Suivre'} le dossier ${name}`"
    @click.prevent.stop="emit('toggle')"
  >
    <template v-if="following">
      <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true">
        <path
          d="M3 8.5 6.5 12 13 4.5"
          fill="none"
          stroke="currentColor"
          stroke-width="2.4"
          stroke-linecap="round"
        />
      </svg>
      Suivi
    </template>
    <template v-else>+ Suivre</template>
  </DsButton>
</template>

<style scoped>
.dfol {
  min-width: 92px;
}
.dfol.is-on {
  background: var(--ds-tint);
}
</style>
