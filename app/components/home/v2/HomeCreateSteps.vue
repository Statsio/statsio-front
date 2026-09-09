<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { HomeStep } from '@/data/brands/home-content.types'

const props = defineProps<{
  eyebrow: string
  title: string
  desc: string
  ctaLabel: string
  steps: HomeStep[]
  ctaTo: string
}>()

// Les libellés de CTA du contenu peuvent contenir une flèche finale ; on la
// retire pour piloter nous-mêmes le chevron animé.
const cleanCtaLabel = computed(() => props.ctaLabel.replace(/\s*[→›»]\s*$/, ''))
</script>

<template>
  <section
    id="creer-section"
    class="mb-[70px] scroll-mt-32 rounded-[24px] bg-white p-7 shadow-[0_1px_3px_rgba(20,20,30,0.06)] sm:p-[52px]"
  >
    <div class="grid gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,340px)_1fr]">
      <div>
        <div class="flex items-center gap-3">
          <span class="font-mono text-[10px] font-semibold tracking-[0.14em] text-primary">{{ eyebrow }}</span>
          <span class="h-px w-10 bg-slate-200" />
        </div>
        <h2 class="mt-4 text-[30px] font-extrabold leading-[1.12] tracking-[-0.02em] text-slate-950 text-pretty">
          {{ title }}
        </h2>
        <p class="mt-4 text-[15px] leading-relaxed text-slate-500">
          {{ desc }}
        </p>
        <RouterLink
          :to="ctaTo"
          class="group mt-6 inline-flex items-center gap-2 text-[14px] font-extrabold tracking-[-0.01em] text-slate-950"
        >
          <span class="border-b-2 border-primary/30 pb-0.5 transition group-hover:border-primary">
            {{ cleanCtaLabel }}
          </span>
          <span aria-hidden="true" class="transition-transform group-hover:translate-x-0.5">→</span>
        </RouterLink>
      </div>

      <ol class="flex flex-col">
        <li
          v-for="step in steps"
          :key="step.num"
          class="flex gap-5 border-slate-200/70 py-6 first:pt-0 last:pb-0 [&:not(:last-child)]:border-b"
        >
          <span class="pt-1 font-mono text-[13px] font-semibold tabular-nums text-slate-300">
            {{ step.num.padStart(2, '0') }}
          </span>
          <div>
            <h3 class="text-[16px] font-extrabold tracking-[-0.01em] text-slate-950">{{ step.title }}</h3>
            <p class="mt-1.5 text-[13.5px] leading-relaxed text-slate-500">{{ step.desc }}</p>
          </div>
        </li>
      </ol>
    </div>
  </section>
</template>
