<script setup lang="ts">
/** Rend des segments de titre `{ text, em? }` (les `em` prennent la couleur d'accent via DsHeading). */
defineProps<{ parts: { text: string; em?: boolean }[] }>()
</script>

<template>
  <template v-for="(part, i) in parts" :key="i">
    <em v-if="part.em">{{ part.text }}</em>
    <template v-else>{{ part.text }}</template>
  </template>
</template>
