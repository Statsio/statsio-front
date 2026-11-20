<script setup lang="ts">
/**
 * En-tête des cartes d'auth : étiquette mono, titre Anybody (h1, les `em` en
 * couleur d'accent) et chapô. Le titre est passé en segments `{ text, em? }`.
 */
withDefaults(
  defineProps<{
    eyebrow: string
    title: { text: string; em?: boolean }[]
    description?: string
    center?: boolean
  }>(),
  { description: undefined, center: false },
)
</script>

<template>
  <div class="ds-ach" :class="{ 'ds-ach--center': center }">
    <div class="ds-ach__top">
      <DsLabel>{{ eyebrow }}</DsLabel>
      <span v-if="$slots.aside" class="ds-ach__aside"><slot name="aside" /></span>
    </div>
    <DsHeading :level="1" size="md" class="ds-ach__title"><DsRichTitle :parts="title" /></DsHeading>
    <p v-if="description || $slots.default" class="ds-ach__desc"><slot>{{ description }}</slot></p>
  </div>
</template>

<style scoped>
.ds-ach {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ds-ach__top {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 4px 16px;
}
.ds-ach--center .ds-ach__top {
  justify-content: center;
}
.ds-ach__aside {
  font-size: 13.5px;
}
.ds-ach--center {
  align-items: center;
  text-align: center;
}
.ds-ach__title {
  font-size: clamp(28px, 2.6vw, 36px);
}
.ds-ach__desc {
  margin: 0;
  color: var(--ds-muted);
  font-size: 15px;
  line-height: 1.55;
}
/* Écrans bas : le chapô saute pour que le formulaire tienne sans défiler. */
@media (min-width: 1024px) and (max-height: 820px) {
  .ds-ach__desc {
    display: none;
  }
}
.ds-ach__desc :deep(strong) {
  color: var(--ds-text);
}
</style>
