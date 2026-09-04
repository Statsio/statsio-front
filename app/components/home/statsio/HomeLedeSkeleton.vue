<script setup lang="ts">
// Placeholder affiché pendant le chargement client du flux d'accueil.
</script>

<template>
  <div class="grid animate-pulse gap-8 lg:grid-cols-[1.55fr_1fr]">
    <div>
      <div class="aspect-[16/9] w-full rounded-[20px] bg-slate-100" />
      <div class="mt-4 h-7 w-4/5 rounded bg-slate-100" />
      <div class="mt-3 h-4 w-full rounded bg-slate-100" />
      <div class="mt-2 h-4 w-2/3 rounded bg-slate-100" />
    </div>
    <div class="flex flex-col gap-4 lg:border-l lg:border-slate-200/80 lg:pl-8">
      <div v-for="i in 4" :key="i" class="flex gap-3.5">
        <div class="h-[64px] w-[92px] shrink-0 rounded-[10px] bg-slate-100" />
        <div class="flex-1">
          <div class="h-3 w-16 rounded bg-slate-100" />
          <div class="mt-2 h-4 w-full rounded bg-slate-100" />
          <div class="mt-1.5 h-4 w-1/2 rounded bg-slate-100" />
        </div>
      </div>
    </div>
  </div>
</template>
