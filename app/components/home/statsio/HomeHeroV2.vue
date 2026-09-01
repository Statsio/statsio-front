<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import type { StatsioHomeContent } from '@/data/brands/statsio/home-v2'

defineProps<{
  content: StatsioHomeContent
  primaryCtaTo: string
  secondaryCtaTo: string
}>()

const rootRef = ref<HTMLElement | null>(null)
let ctx: { revert(): void } | null = null

onMounted(async () => {
  if (!rootRef.value || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  try {
    const { default: gsap } = await import('gsap')
    ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl.from('[data-anim="badge"]', { y: -12, opacity: 0, duration: 0.45 })
        .from('[data-anim="title"]', { y: 26, opacity: 0, duration: 0.8 }, '-=0.2')
        .from('[data-anim="subtitle"]', { y: 16, opacity: 0, duration: 0.55 }, '-=0.5')
        .from('[data-anim="ctas"]', { y: 16, opacity: 0, duration: 0.5 }, '-=0.3')
        .from('[data-anim="stat"]', { y: 14, opacity: 0, duration: 0.4, stagger: 0.08 }, '-=0.25')
    }, rootRef.value)
  } catch {
    // GSAP indisponible — contenu visible sans animation
  }
})

onUnmounted(() => ctx?.revert())
</script>

<template>
  <!--
    -mt-40 lg:-mt-28 annule le <main class="pt-40 lg:pt-28"> du layout pour que le fond
    du hero passe sous le header fixe ; pt-44 lg:pt-40 rétablit le décalage du contenu.
    Garder ces paires de breakpoints synchronisées avec app/layouts/default.vue.
  -->
  <section
    ref="rootRef"
    class="relative -mt-40 overflow-hidden border-b border-slate-200/80 bg-white px-6 pb-16 pt-44 lg:-mt-28 lg:pb-16 lg:pt-40"
  >
    <div
      class="pointer-events-none absolute -right-32 -top-36 h-[460px] w-[460px] rounded-full"
      style="background: radial-gradient(circle, rgba(139,92,246,0.12), transparent 70%)"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute -bottom-44 -left-28 h-[420px] w-[420px] rounded-full"
      style="background: radial-gradient(circle, rgba(59,130,246,0.1), transparent 70%)"
      aria-hidden="true"
    />

    <div class="relative mx-auto max-w-[1120px]">
      <div data-anim="badge" class="mb-[22px] flex flex-wrap items-center gap-2.5">
        <span
          class="rounded-[5px] border border-[#ddd6fe] bg-[#f2ecfd] px-2 py-1 font-mono text-[10px] font-semibold text-[#6d28d9]"
        >
          {{ content.heroBadge }}
        </span>
        <span
          class="flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.08em] text-emerald-600"
        >
          <span class="h-1.5 w-1.5 rounded-full bg-emerald-500" />{{ content.heroFlash }}
        </span>
      </div>

      <h1
        data-anim="title"
        class="m-0 max-w-[20ch] text-[38px] font-extrabold leading-[1.05] tracking-[-0.03em] text-slate-950 text-pretty sm:text-5xl lg:text-[56px]"
      >
        <template v-for="(part, i) in content.heroHeadline" :key="i"><span :style="part.color ? { color: part.color } : undefined">{{ part.text }}</span></template>
      </h1>

      <p
        data-anim="subtitle"
        class="mt-5 max-w-[56ch] text-[17.5px] leading-relaxed text-slate-600 text-pretty"
      >
        {{ content.heroSubtitle }}
      </p>

      <div data-anim="ctas" class="mt-8 flex flex-wrap gap-3">
        <RouterLink
          :to="primaryCtaTo"
          class="rounded-full bg-[linear-gradient(135deg,#8b5cf6,#3b82f6)] px-6 py-[15px] text-[14.5px] font-extrabold tracking-[0.02em] text-white transition hover:brightness-105"
        >
          {{ content.heroCtaPrimary }} →
        </RouterLink>
        <RouterLink
          :to="secondaryCtaTo"
          class="rounded-full border-[1.5px] border-slate-300 px-6 py-[15px] text-[14.5px] font-bold text-slate-900 transition hover:border-primary hover:text-primary"
        >
          {{ content.heroCtaSecondary }}
        </RouterLink>
      </div>

      <div class="mt-11 flex flex-wrap gap-x-10 gap-y-6 border-t border-slate-200/80 pt-6">
        <div v-for="stat in content.heroStats" :key="stat.label" data-anim="stat">
          <div class="text-[9.5px] font-extrabold uppercase tracking-[0.09em] text-slate-400">
            {{ stat.label }}
          </div>
          <div class="mt-1.5 font-mono text-[20px] font-semibold tracking-[-0.01em] text-slate-950">
            {{ stat.value }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
