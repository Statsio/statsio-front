<script setup lang="ts">
import { ref, useId } from 'vue'
import DsBox from '@/components/ds/DsBox.vue'
import DsLabel from '@/components/ds/DsLabel.vue'
import DsPie from '@/components/ds/DsPie.vue'

/**
 * Bande d'appel à publier en pied de listing : camembert (une tranche se détache
 * au survol), étiquette, titre, texte et actions (slots `label`, `title`,
 * défaut = texte, `actions`).
 */
const titleId = useId()
const hovered = ref(false)

const SEGMENTS = [
  { value: 100, color: 'var(--ds-t1)' },
  { value: 80, color: 'var(--ds-t2)' },
  { value: 110, color: 'var(--ds-t3)' },
  { value: 70, color: 'var(--ds-t4)' },
]
</script>

<template>
  <DsBox
    as="section"
    class="lpub"
    :aria-labelledby="titleId"
    @pointerenter="hovered = true"
    @pointerleave="hovered = false"
  >
    <DsPie
      :segments="SEGMENTS"
      :size="110"
      :selected="1"
      :detach="hovered ? 9 : 5"
      animate="view"
      label=""
      aria-hidden="true"
      class="lpub__pie"
    />
    <div>
      <DsLabel><slot name="label" /></DsLabel>
      <h2 :id="titleId" class="lpub__title"><slot name="title" /></h2>
      <p class="lpub__txt"><slot /></p>
    </div>
    <div class="lpub__cta"><slot name="actions" /></div>
  </DsBox>
</template>

<style scoped>
.lpub {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 20px;
  align-items: center;
  margin-top: 64px;
  padding: 28px;
}
@media (min-width: 901px) {
  .lpub {
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 32px;
  }
}
.lpub__pie {
  width: 110px;
}
.lpub__pie :deep(.ds-pie__slice) {
  opacity: 1;
}
.lpub__title {
  margin: 10px 0 0;
  font: 800 clamp(26px, 3vw, 40px) / 1 var(--ds-display);
  font-stretch: 90%;
  text-wrap: balance;
}
.lpub__txt {
  max-width: 58ch;
  margin: 10px 0 0;
  color: var(--ds-muted);
}
.lpub__cta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
</style>
