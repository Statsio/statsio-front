<script setup lang="ts">
import { computed } from 'vue'
import { highlightParts } from '@/lib/search-rows'

/** Texte avec les termes de la recherche surlignés (`<mark>`, insensible aux accents). */
const props = defineProps<{ text: string; query?: string }>()
const parts = computed(() => highlightParts(props.text, props.query ?? ''))
</script>

<template>
  <template v-for="(part, i) in parts" :key="i">
    <mark v-if="part.hit" class="ds-mark">{{ part.text }}</mark>
    <template v-else>{{ part.text }}</template>
  </template>
</template>

<style scoped>
.ds-mark {
  padding: 0 1px;
  border-radius: 2px;
  background: var(--ds-mark);
  color: inherit;
}
</style>
