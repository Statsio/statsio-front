<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineProps<{
  primaryTo: string
  secondaryTo: string
}>()
</script>

<template>
  <section
    class="relative mb-[70px] flex flex-wrap items-center justify-between gap-8 overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,#18181f,#2c2440)] px-8 py-12 sm:px-[52px]"
  >
    <div
      class="pointer-events-none absolute -right-16 -top-24 h-[280px] w-[280px] rounded-full"
      style="background: radial-gradient(circle, rgba(139,92,246,0.3), transparent 70%)"
      aria-hidden="true"
    />
    <div class="relative min-w-[260px] flex-1">
      <h2 class="m-0 max-w-[26ch] text-[28px] font-extrabold tracking-[-0.02em] text-white text-pretty">
        Rejoignez 1,2 million de personnes qui lisent, votent et publient sur Statsio.
      </h2>
      <p class="mt-3 max-w-[48ch] text-[14.5px] text-white/65">
        Gratuit, sans carte bancaire. Vous gardez le contrôle de vos données et de vos publications.
      </p>
    </div>
    <div class="relative flex shrink-0 flex-wrap gap-3">
      <RouterLink
        :to="primaryTo"
        class="rounded-full bg-[linear-gradient(135deg,#8b5cf6,#3b82f6)] px-6 py-[15px] text-[14px] font-extrabold tracking-[0.02em] text-white transition hover:brightness-105"
      >
        Créer un compte gratuit
      </RouterLink>
      <RouterLink
        :to="secondaryTo"
        class="rounded-full border-[1.5px] border-white/25 px-[22px] py-[15px] text-[14px] font-bold text-white transition hover:border-[#c4b5fd] hover:text-[#c4b5fd]"
      >
        Explorer sans compte
      </RouterLink>
    </div>
  </section>
</template>
