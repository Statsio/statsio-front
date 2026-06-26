<script setup lang="ts">
import { ref } from 'vue'
import { useScrollAnim } from '@/composables/useScrollAnim'
import AppButton from '@/components/ui/AppButton.vue'
import HomeSectionHeader from '@/components/home/HomeSectionHeader.vue'

defineProps<{
  items: { title: string; window: string; candidates: { name: string; score: string }[] }[]
}>()

function parsePct(score: string): number {
  return parseInt(score, 10) || 0
}

function getBarWidth(score: string, allScores: string[]): string {
  const maxPct = Math.max(...allScores.map((s) => parsePct(s)))
  if (maxPct === 0) return '0%'
  return `${Math.round((parsePct(score) / maxPct) * 100)}%`
}

const barColorClasses = ['bg-[var(--color-primary)]', 'bg-[var(--color-accent)]', 'bg-slate-300'] as const

function getBarColorClass(index: number): string {
  return barColorClasses[index % barColorClasses.length] ?? 'bg-slate-300'
}

const sectionRef = ref<HTMLElement | null>(null)

useScrollAnim(sectionRef, (gsap) => {
  return gsap.context(() => {
    gsap.from('[data-anim="header"]', {
      y: 16, opacity: 0, duration: 0.55, ease: 'power2.out',
      immediateRender: false,
      scrollTrigger: { trigger: sectionRef.value, start: 'top 88%', once: true },
    })
    gsap.from('[data-anim="poll-card"]', {
      y: 32, opacity: 0, duration: 0.65, stagger: 0.12, ease: 'power2.out',
      immediateRender: false,
      scrollTrigger: { trigger: sectionRef.value, start: 'top 82%', once: true },
    })
    const bars = sectionRef.value?.querySelectorAll<HTMLElement>('[data-target-width]') ?? []
    bars.forEach((bar, i) => {
      const targetWidth = bar.dataset.targetWidth ?? '0%'
      gsap.fromTo(bar, { width: '0%' }, {
        width: targetWidth, duration: 0.75, delay: 0.05 * i, ease: 'power2.out',
        scrollTrigger: { trigger: sectionRef.value, start: 'top 78%', once: true },
      })
    })
  }, sectionRef.value)
})
</script>

<template>
  <section ref="sectionRef" class="bg-white">
    <div class="container py-20">
      <div data-anim="header">
        <HomeSectionHeader eyebrow="Sondages" title="Opinions & baromètres en temps réel">
          <AppButton variant="primary">Lancer un sondage</AppButton>
        </HomeSectionHeader>
      </div>

      <div class="mt-10 grid gap-5 lg:grid-cols-3">
        <article
          v-for="item in items"
          :key="item.title"
          data-anim="poll-card"
          class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md"
        >
          <div class="flex items-start justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <p class="eyebrow">{{ item.window }}</p>
              <h3 class="mt-1 text-base font-semibold leading-tight text-slate-900">{{ item.title }}</h3>
            </div>
            <span class="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" aria-hidden="true" />
              Live
            </span>
          </div>

          <div class="space-y-4 px-5 py-5">
            <div v-for="(candidate, index) in item.candidates" :key="candidate.name" class="space-y-2">
              <div class="flex items-center justify-between gap-3">
                <div class="flex min-w-0 items-center gap-2">
                  <div
                    class="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white"
                    :class="getBarColorClass(index)"
                    aria-hidden="true"
                  >{{ candidate.name.slice(0, 1) }}</div>
                  <span class="truncate text-sm font-medium text-slate-700">{{ candidate.name }}</span>
                </div>
                <span class="mono shrink-0 text-sm font-semibold text-slate-900">{{ candidate.score }}</span>
              </div>
              <div class="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  :class="[getBarColorClass(index), 'h-full rounded-full']"
                  :data-target-width="getBarWidth(candidate.score, item.candidates.map((c) => c.score))"
                />
              </div>
            </div>
          </div>

          <div class="border-t border-slate-100 px-5 py-3">
            <p class="text-[11px] text-slate-400">Échantillon national représentatif · 2 000 répondants</p>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
