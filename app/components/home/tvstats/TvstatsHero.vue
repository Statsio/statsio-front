<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppSparkline from '@/components/ui/AppSparkline.vue'
import PageHero from '@/components/home/PageHero.vue'
import { homeContent } from '@/data/brands/tvstats/home'

const heroRef = ref<InstanceType<typeof PageHero> | null>(null)
let ctx: { revert(): void } | null = null

onMounted(async () => {
  if (!heroRef.value?.$el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  try {
    const { default: gsap } = await import('gsap')
    ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl.from('[data-anim="badge"]', { y: -12, opacity: 0, duration: 0.45 })
        .from('[data-anim="title"]', { y: 28, opacity: 0, duration: 0.8 }, '-=0.2')
        .from('[data-anim="subtitle"]', { y: 16, opacity: 0, duration: 0.55 }, '-=0.5')
        .from('[data-anim="ctas"]', { y: 16, opacity: 0, duration: 0.5 }, '-=0.3')
        .from('[data-anim="card"]', { x: 36, opacity: 0, duration: 0.85, ease: 'power3.out' }, 0.2)
    }, heroRef.value.$el)
  } catch {
    // GSAP not available
  }
})

onUnmounted(() => {
  ctx?.revert()
})
</script>

<template>
  <PageHero ref="heroRef" dot-color-rgb="22,101,52">
    <template #content>
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
    </template>

    <template #card>
      <div class="mb-4 flex items-center justify-between">
        <span class="text-[13px] font-bold text-slate-900">{{ homeContent.heroChartLabel }}</span>
        <span class="mono text-[11px] font-semibold text-emerald-600">▲ 3.2%</span>
      </div>
      <AppSparkline :points="homeContent.heroChartPoints" :height="110" />
      <div class="mono mt-1.5 flex justify-between text-[10.5px] text-slate-400">
        <span v-for="marker in homeContent.heroChartMarkers" :key="marker">{{ marker }}</span>
      </div>
    </template>
  </PageHero>
</template>
