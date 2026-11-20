<script setup lang="ts">
import DsButton from '@/components/ds/DsButton.vue'

/** S'abonner / se désabonner d'une chaîne (bascule `aria-pressed`). */
defineProps<{ following: boolean; name: string }>()
const emit = defineEmits<{ toggle: [] }>()
</script>

<template>
  <DsButton
    size="sm"
    :variant="following ? 'secondary' : 'primary'"
    class="chfol"
    :aria-pressed="following"
    :aria-label="`${following ? 'Se désabonner de' : 'S’abonner à'} ${name}`"
    @click.prevent.stop="emit('toggle')"
  >
    {{ following ? 'Abonné ✓' : 'S’abonner' }}
  </DsButton>
</template>

<style scoped>
.chfol {
  min-width: 104px;
}
</style>
