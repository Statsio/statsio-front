<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'

defineProps<{
  headline: string
  subtitle: string
  bullets: string[]
  kpis: { label: string; value: string }[]
}>()

const previewBars: Array<{ label: string; pct: number; colorClass: string }> = [
  { label: 'Énergies renouvelables', pct: 42, colorClass: 'bg-amber-400' },
  { label: 'Nucléaire', pct: 38, colorClass: 'bg-blue-500' },
  { label: 'Gaz naturel', pct: 18, colorClass: 'bg-slate-500' },
]

const heroRef = ref<HTMLElement | null>(null)
let ctx: { revert(): void } | null = null

onMounted(async () => {
  if (!heroRef.value || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  try {
    const { default: gsap } = await import('gsap')
    ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl.from('[data-anim="badge"]', { y: -16, opacity: 0, duration: 0.5 })
        .from('[data-anim="title"]', { y: 32, opacity: 0, duration: 0.85 }, '-=0.25')
        .from('[data-anim="subtitle"]', { y: 20, opacity: 0, duration: 0.6 }, '-=0.55')
        .from('[data-anim="bullet"]', { y: 14, opacity: 0, duration: 0.45, stagger: 0.07 }, '-=0.4')
        .from('[data-anim="ctas"]', { y: 20, opacity: 0, duration: 0.55 }, '-=0.35')
        .from('[data-anim="kpi"]', { y: 12, opacity: 0, duration: 0.4, stagger: 0.08 }, '-=0.3')
        .from('[data-anim="card"]', { x: 44, opacity: 0, duration: 0.9, ease: 'power3.out' }, 0.25)
    }, heroRef.value)
  } catch {
    // GSAP not available — content visible without animation
  }
})

onUnmounted(() => {
  ctx?.revert()
})
</script>

<template>
  <section ref="heroRef" class="relative bg-slate-950">
    <!-- Background effects -->
    <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        class="absolute inset-0"
        style="background: radial-gradient(ellipse 80% 50% at 50% -10%, rgba(139,92,246,0.18) 0%, transparent 65%);"
      />
      <div
        class="absolute inset-0"
        style="background-image: linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px); background-size: 56px 56px;"
      />
    </div>

    <div class="container relative py-16 lg:py-24">
      <!-- Live badge -->
      <div class="mb-10">
        <span
          data-anim="badge"
          class="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3.5 py-1.5 text-[11px] font-semibold tracking-widest text-violet-300"
        >
          <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400" aria-hidden="true" />
          Plateforme data-journalism
        </span>
      </div>

      <div class="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <!-- Left: editorial content -->
        <div class="space-y-8">
          <h1
            data-anim="title"
            class="text-5xl font-semibold leading-[1.1] text-white sm:text-6xl lg:text-[3.75rem]"
          >
            <span class="text-gradient">{{ headline }}</span>
          </h1>

          <p data-anim="subtitle" class="max-w-[44ch] text-base leading-relaxed text-slate-400">
            {{ subtitle }}
          </p>

          <ul class="space-y-3" role="list">
            <li
              v-for="bullet in bullets"
              :key="bullet"
              data-anim="bullet"
              class="flex items-start gap-3"
            >
              <span
                class="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-violet-500/20 text-violet-400"
                aria-hidden="true"
              >
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
              <span class="text-sm text-slate-300">{{ bullet }}</span>
            </li>
          </ul>

          <div data-anim="ctas" class="flex flex-wrap items-center gap-3">
            <AppButton as="router-link" to="/register" variant="primary" size="lg">
              Lancer ma première analyse
            </AppButton>
            <AppButton variant="light-outline" size="lg">Explorer les tendances</AppButton>
          </div>

          <div class="flex flex-wrap gap-8 border-t border-white/10 pt-6">
            <div
              v-for="kpi in kpis"
              :key="kpi.label"
              data-anim="kpi"
              class="space-y-0.5"
            >
              <p class="mono text-2xl font-semibold text-white">{{ kpi.value }}</p>
              <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{{ kpi.label }}</p>
            </div>
          </div>
        </div>

        <!-- Right: live data preview card -->
        <div data-anim="card" class="relative">
          <div class="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-2xl">
            <!-- Browser chrome -->
            <div class="flex items-center gap-3 border-b border-white/[0.08] bg-white/[0.04] px-4 py-3">
              <div class="flex gap-1.5" aria-hidden="true">
                <span class="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span class="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span class="h-2.5 w-2.5 rounded-full bg-white/20" />
              </div>
              <div class="mono flex-1 truncate rounded-full bg-white/[0.05] px-3 py-1 text-[11px] text-slate-600">
                statsio.fr/articles/transition-energetique-2026
              </div>
              <span class="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" aria-hidden="true" />
                Live
              </span>
            </div>

            <div class="space-y-5 p-5">
              <!-- Article header -->
              <div>
                <p class="mono text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-400">
                  Énergie · Climat 2026
                </p>
                <h2 class="mt-1.5 text-base font-semibold leading-tight text-white">
                  Transition énergétique : cartographie des investissements
                </h2>
                <p class="mt-1 text-xs text-slate-500">Par Équipe Statsio · 52k lectures</p>
              </div>

              <!-- Data bars visualization -->
              <div class="space-y-3">
                <p class="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-600">
                  Mix énergétique — Capacités installées 2026
                </p>
                <div v-for="bar in previewBars" :key="bar.label" class="space-y-1.5">
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-slate-400">{{ bar.label }}</span>
                    <span class="mono text-xs font-semibold text-white">{{ bar.pct }}%</span>
                  </div>
                  <div class="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                    <div
                      :class="[bar.colorClass, 'h-full rounded-full']"
                      :style="{ width: `${(bar.pct / 42) * 90}%` }"
                    />
                  </div>
                </div>
              </div>

              <!-- Source tags -->
              <div class="flex flex-wrap items-center gap-1.5">
                <span class="text-[10px] text-slate-600">Sources :</span>
                <span
                  v-for="src in ['RTE', 'INSEE', 'ADEME', '+2']"
                  :key="src"
                  class="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-slate-500"
                >{{ src }}</span>
              </div>

              <!-- Stats row -->
              <div class="grid grid-cols-3 divide-x divide-white/[0.06] overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.04]">
                <div
                  v-for="stat in [{ label: 'Lectures', val: '52k' }, { label: 'Sources', val: '7' }, { label: 'Maj.', val: '1h' }]"
                  :key="stat.label"
                  class="py-3 text-center"
                >
                  <p class="mono text-sm font-semibold text-white">{{ stat.val }}</p>
                  <p class="text-[10px] text-slate-600">{{ stat.label }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Floating badges (desktop only) -->
          <div
            class="absolute -right-4 -top-4 hidden rounded-xl border border-white/10 bg-slate-900/90 px-3.5 py-2.5 shadow-xl backdrop-blur-sm lg:block"
            aria-hidden="true"
          >
            <p class="mono text-xs font-semibold text-emerald-400">+120 sources</p>
            <p class="text-[10px] text-slate-500">connectées</p>
          </div>
          <div
            class="absolute -bottom-4 -left-4 hidden rounded-xl border border-white/10 bg-slate-900/90 px-3.5 py-2.5 shadow-xl backdrop-blur-sm lg:block"
            aria-hidden="true"
          >
            <div class="flex items-center gap-1.5">
              <span class="h-1.5 w-1.5 rounded-full bg-blue-500" />
              <p class="text-[10px] text-slate-300">Sync API active</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
