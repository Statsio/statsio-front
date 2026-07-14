<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue'
import studioLogo from '@/assets/brand/statsio-studio.svg'

defineProps<{
  studioPath: string
}>()
</script>

<template>
  <div class="flex items-center gap-5 rounded-2xl border border-[#18181f]/[0.06] bg-white p-7 shadow-[0_1px_3px_rgba(20,20,30,0.06)]">
    <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
      <svg class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
      </svg>
    </div>
    <div class="min-w-0 flex-1">
      <p class="text-sm font-semibold text-[#18181f]">Éditer dans le Studio</p>
      <p class="mt-0.5 text-xs text-[#18181f]/50">Construisez les pages de visualisation avec l'interface drag & drop.</p>
    </div>
    <AppButton as="router-link" :to="studioPath" variant="secondary" size="sm">
      <template #icon>
        <img :src="studioLogo" alt="" class="h-3.5 w-3.5 rounded" />
      </template>
      Ouvrir le Studio
    </AppButton>
  </div>
</template>
