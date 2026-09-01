<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

defineProps<{
  eyebrow: string
  eyebrowColor: string
  title: string
  allLabel: string
  allTo: string
}>()

const track = ref<HTMLElement | null>(null)

function scrollByCards(dir: -1 | 1) {
  track.value?.scrollBy({ left: dir * (346 + 16) * 2, behavior: 'smooth' })
}
</script>

<template>
  <section class="mb-[70px]">
    <div class="mb-[22px] flex flex-wrap items-baseline justify-between gap-4">
      <div>
        <span
          class="font-mono text-[10px] font-semibold tracking-[0.09em]"
          :style="{ color: eyebrowColor }"
        >
          {{ eyebrow }}
        </span>
        <h2 class="mt-2 text-[28px] font-extrabold tracking-[-0.02em] text-slate-950">{{ title }}</h2>
      </div>
      <RouterLink :to="allTo" class="text-[13.5px] font-bold text-primary transition hover:opacity-70">
        {{ allLabel }} →
      </RouterLink>
    </div>

    <div class="relative">
      <div
        ref="track"
        class="flex items-stretch gap-4 overflow-x-auto pb-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style="scroll-snap-type: x mandatory"
      >
        <slot />
      </div>

      <button
        type="button"
        class="absolute -left-[18px] top-1/2 hidden h-[38px] w-[38px] -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-base shadow-[0_4px_12px_rgba(20,20,30,0.14)] transition hover:bg-slate-50 md:flex"
        aria-label="Précédent"
        @click="scrollByCards(-1)"
      >
        ‹
      </button>
      <button
        type="button"
        class="absolute -right-[18px] top-1/2 hidden h-[38px] w-[38px] -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-base shadow-[0_4px_12px_rgba(20,20,30,0.14)] transition hover:bg-slate-50 md:flex"
        aria-label="Suivant"
        @click="scrollByCards(1)"
      >
        ›
      </button>
    </div>
  </section>
</template>
