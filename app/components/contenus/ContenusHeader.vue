<script setup lang="ts">
import ContenusCreateButton from '@/components/contenus/ContenusCreateButton.vue'
</script>

<template>
  <div class="flex flex-wrap items-start justify-between gap-6">
    <div>
      <h1 class="text-[26px] font-bold text-slate-950">Mes contenus</h1>
      <p class="mt-1.5 max-w-[520px] text-[14.5px] text-slate-500">
        Tout ce que vous avez publié — en votre nom, ou au nom d'une chaîne à laquelle vous êtes affiliée.
      </p>
    </div>
    <ContenusCreateButton />
  </div>
</template>
