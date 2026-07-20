<script setup lang="ts">
withDefaults(
  defineProps<{
    locked: boolean
    ctaTo?: string
    ctaLabel?: string
  }>(),
  { ctaTo: '/user?tab=parametres#demographics-card', ctaLabel: '🔒 Compléter mon profil' },
)
</script>

<template>
  <div class="relative overflow-hidden">
    <div :class="locked ? 'pointer-events-none select-none opacity-55 blur-[5px]' : ''">
      <slot />
    </div>
    <div v-if="locked" class="absolute inset-x-0 bottom-0 top-9 flex items-center justify-center bg-white/35">
      <RouterLink
        :to="ctaTo"
        class="whitespace-nowrap rounded-full bg-[#f2ecfd] px-3.5 py-2 text-[11.5px] font-bold text-primary"
      >
        {{ ctaLabel }}
      </RouterLink>
    </div>
  </div>
</template>
