<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppSparkline from '@/components/ui/AppSparkline.vue'
import { homeContent } from '@/data/brands/tvstats/home'

const heroRef = ref<HTMLElement | null>(null)
let ctx: { revert(): void } | null = null

onMounted(async () => {
  if (!heroRef.value || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  try {
    const { default: gsap } = await import('gsap')
    ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl.from('[data-anim="badge"]', { y: -12, opacity: 0, duration: 0.45 })
        .from('[data-anim="title"]', { y: 28, opacity: 0, duration: 0.8 }, '-=0.2')
        .from('[data-anim="subtitle"]', { y: 16, opacity: 0, duration: 0.55 }, '-=0.5')
        .from('[data-anim="ctas"]', { y: 16, opacity: 0, duration: 0.5 }, '-=0.3')
        .from('[data-anim="card"]', { x: 36, opacity: 0, duration: 0.85, ease: 'power3.out' }, 0.2)
    }, heroRef.value)
  } catch {
    // GSAP not available
  }
})

onUnmounted(() => {
  ctx?.revert()
})
</script>

<template>
  <section ref="heroRef" class="relative -mt-28 overflow-hidden bg-white">
    <!-- Radial green glow top-right -->
    <div
      class="pointer-events-none absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-[var(--color-primary)]/[0.08] blur-3xl"
      aria-hidden="true"
    />
    <!-- Dot grid overlay -->
    <div
      class="pointer-events-none absolute inset-0"
      style="background-image: radial-gradient(circle, rgba(22,101,52,0.08) 1px, transparent 1px); background-size: 28px 28px;"
      aria-hidden="true"
    />

    <div class="container relative pb-16 pt-36 lg:pb-24 lg:pt-40">
      <div class="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <!-- Left: editorial content -->
        <div class="space-y-6">
          <AppBadge data-anim="badge" variant="soft-primary" mono>{{ homeContent.heroBadge }}</AppBadge>

          <h1
            data-anim="title"
            class="text-4xl font-bold leading-[1.12] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.25rem]"
          >
            {{ homeContent.heroHeadline }}
          </h1>

          <p data-anim="subtitle" class="max-w-[46ch] text-base leading-relaxed text-slate-500">
            {{ homeContent.heroSubtitle }}
          </p>

          <div data-anim="ctas" class="flex flex-wrap items-center gap-3">
            <AppButton as="router-link" to="/tvstats/audiences" variant="primary" size="lg">
              {{ homeContent.heroCtaPrimary }}
            </AppButton>
            <AppButton as="router-link" to="/register" variant="secondary" size="lg">
              {{ homeContent.heroCtaSecondary }}
            </AppButton>
          </div>
        </div>

        <!-- Right: audience chart preview -->
        <div data-anim="card" class="card-xl p-6">
          <div class="mb-4 flex items-center justify-between">
            <span class="text-[13px] font-bold text-slate-900">{{ homeContent.heroChartLabel }}</span>
            <span class="mono text-[11px] font-semibold text-emerald-600">▲ 3.2%</span>
          </div>
          <AppSparkline :points="homeContent.heroChartPoints" :height="110" />
          <div class="mono mt-1.5 flex justify-between text-[10.5px] text-slate-400">
            <span v-for="marker in homeContent.heroChartMarkers" :key="marker">{{ marker }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
