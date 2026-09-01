<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { HomeStep } from '@/data/brands/statsio/home-v2'

defineProps<{
  steps: HomeStep[]
  ctaTo: string
}>()
</script>

<template>
  <section
    id="creer-section"
    class="mb-[70px] scroll-mt-32 rounded-[24px] bg-white p-7 shadow-[0_1px_3px_rgba(20,20,30,0.06)] sm:p-[52px]"
  >
    <div class="mx-auto mb-11 max-w-[56ch] text-center">
      <span class="font-mono text-[10px] font-semibold tracking-[0.09em] text-primary">POUR TOUT LE MONDE</span>
      <h2 class="mt-2.5 text-[32px] font-extrabold tracking-[-0.02em] text-slate-950 text-pretty">
        Créez vos propres contenus, simplement et gratuitement
      </h2>
      <p class="mt-3.5 text-[15px] leading-relaxed text-slate-500">
        Pas besoin d'être une rédaction : un article, une statsdata ou un sondage se publient en
        quelques minutes, sans rien payer.
      </p>
    </div>

    <div class="grid gap-6 sm:grid-cols-3">
      <div v-for="step in steps" :key="step.num" class="rounded-2xl bg-[#faf9fd] px-5 py-6">
        <span
          class="mb-4 flex h-[42px] w-[42px] items-center justify-center rounded-xl text-lg"
          :style="{ background: step.iconBg, color: step.iconFg }"
        >
          {{ step.icon }}
        </span>
        <div class="mb-2 font-mono text-[10px] font-semibold tracking-[0.08em] text-slate-400">
          ÉTAPE {{ step.num }}
        </div>
        <div class="text-[16.5px] font-extrabold tracking-[-0.01em] text-slate-950">{{ step.title }}</div>
        <div class="mt-2 text-[13.5px] leading-relaxed text-slate-500">{{ step.desc }}</div>
      </div>
    </div>

    <div class="mt-9 flex justify-center">
      <RouterLink
        :to="ctaTo"
        class="rounded-full bg-[linear-gradient(135deg,#8b5cf6,#3b82f6)] px-7 py-[15px] text-[14px] font-extrabold tracking-[0.02em] text-white transition hover:brightness-105"
      >
        Créer un compte et publier →
      </RouterLink>
    </div>
  </section>
</template>
