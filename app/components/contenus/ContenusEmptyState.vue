<script setup lang="ts">
defineProps<{ hasAnyContent?: boolean }>()
</script>

<template>
  <div class="py-[70px] text-center text-sm text-slate-400">
    <template v-if="hasAnyContent">Aucun contenu dans cette catégorie pour le moment.</template>
    <template v-else>Vous n'avez pas encore créé de contenu.</template>
  </div>
</template>
