<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <nav class="flex items-center gap-x-2 text-[12.5px] text-[#18181f]/45">
    <RouterLink to="/contenus" class="transition-colors hover:text-primary">Mes contenus</RouterLink>
    <span>/</span>
    <span class="font-semibold text-[#18181f]">Paramètres</span>
  </nav>
</template>
