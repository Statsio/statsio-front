<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useScrollAnim } from '@/composables/useScrollAnim'
import AppButton from '@/components/ui/AppButton.vue'
import HomeSectionHeader from '@/components/home/HomeSectionHeader.vue'

defineProps<{
  items: { title: string; scope: string; updated: string; metrics: string[] }[]
}>()

type MockRow = { city: string; ipc: string; logement: string; energie: string }

const mockRows: MockRow[] = [
  { city: 'Paris', ipc: '+3.8%', logement: '+4.2%', energie: '+2.1%' },
  { city: 'Lyon', ipc: '+3.2%', logement: '+3.7%', energie: '+1.9%' },
  { city: 'Marseille', ipc: '+3.6%', logement: '+4.0%', energie: '+2.3%' },
  { city: 'Toulouse', ipc: '+2.9%', logement: '+3.5%', energie: '+1.7%' },
]

const sectionRef = ref<HTMLElement | null>(null)

useScrollAnim(sectionRef, (gsap) => {
  return gsap.context(() => {
    gsap.from('[data-anim="header"]', {
      y: 20, opacity: 0, duration: 0.6, ease: 'power2.out',
      scrollTrigger: { trigger: sectionRef.value, start: 'top 80%' },
    })
    gsap.from('[data-anim="featured"]', {
      y: 30, opacity: 0, duration: 0.75, ease: 'power2.out',
      scrollTrigger: { trigger: sectionRef.value, start: 'top 75%' },
    })
    gsap.from('[data-anim="row"]', {
      x: -16, opacity: 0, duration: 0.45, stagger: 0.07, ease: 'power2.out',
      scrollTrigger: { trigger: '[data-anim="featured"]', start: 'top 70%' },
    })
    gsap.from('[data-anim="side"]', {
      y: 24, opacity: 0, duration: 0.6, stagger: 0.12, ease: 'power2.out',
      scrollTrigger: { trigger: sectionRef.value, start: 'top 75%' },
    })
  }, sectionRef.value)
})
</script>

<template>
  <section ref="sectionRef" class="bg-slate-50">
    <div class="container py-20">
      <div data-anim="header">
        <HomeSectionHeader eyebrow="StatsData" title="Explorez les données en profondeur">
          <AppButton variant="primary" as="router-link" to="/statsdata">Créer une page data</AppButton>
        </HomeSectionHeader>
      </div>

      <div class="mt-10 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <!-- Featured dataset with mock data table -->
        <div
          v-if="items[0]"
          data-anim="featured"
          class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div class="flex items-start justify-between border-b border-slate-100 px-6 py-5">
            <div>
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary)]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-primary)]">
                  <span
                    class="h-1.5 w-1.5 rounded-full bg-emerald-500"
                    :class="{ 'animate-pulse': items[0].updated === 'Live' }"
                    aria-hidden="true"
                  />
                  {{ items[0].updated }}
                </span>
                <span class="text-[11px] text-slate-400">{{ items[0].scope }}</span>
              </div>
              <h3 class="mt-2 text-xl font-semibold text-slate-900">{{ items[0].title }}</h3>
            </div>
            <RouterLink
              to="/statsdata"
              class="shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-white hover:text-slate-900"
            >
              Explorer →
            </RouterLink>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-sm" role="table" aria-label="Aperçu des données">
              <thead>
                <tr class="border-b border-slate-100 bg-slate-50/50">
                  <th scope="col" class="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Ville</th>
                  <th scope="col" class="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">IPC</th>
                  <th scope="col" class="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Logement</th>
                  <th scope="col" class="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Énergie</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in mockRows"
                  :key="row.city"
                  data-anim="row"
                  class="border-b border-slate-50 transition-colors hover:bg-[var(--color-primary)]/[0.03]"
                >
                  <td class="px-6 py-3.5 font-medium text-slate-800">{{ row.city }}</td>
                  <td class="mono px-4 py-3.5 font-semibold text-amber-600">{{ row.ipc }}</td>
                  <td class="mono px-4 py-3.5 font-semibold text-orange-500">{{ row.logement }}</td>
                  <td class="mono px-4 py-3.5 font-semibold text-red-500">{{ row.energie }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex flex-wrap items-center gap-2 border-t border-slate-100 px-6 py-4">
            <span class="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Indicateurs :</span>
            <span
              v-for="metric in items[0].metrics"
              :key="metric"
              class="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-600"
            >{{ metric }}</span>
          </div>
        </div>

        <!-- Remaining datasets + create CTA -->
        <div class="flex flex-col gap-5">
          <RouterLink
            v-for="item in items.slice(1)"
            :key="item.title"
            to="/statsdata"
            data-anim="side"
            class="group overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex flex-wrap items-center gap-2">
                <span class="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                  <span
                    class="h-1.5 w-1.5 rounded-full bg-emerald-500"
                    :class="{ 'animate-pulse': item.updated === 'Live' }"
                    aria-hidden="true"
                  />
                  {{ item.updated }}
                </span>
                <span class="text-[11px] text-slate-400">{{ item.scope }}</span>
              </div>
              <span class="shrink-0 text-slate-400 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true">→</span>
            </div>
            <h3 class="mt-3 text-lg font-semibold text-slate-900">{{ item.title }}</h3>
            <div class="mt-3 flex flex-wrap gap-1.5">
              <span
                v-for="metric in item.metrics.slice(0, 4)"
                :key="metric"
                class="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-500"
              >{{ metric }}</span>
              <span
                v-if="item.metrics.length > 4"
                class="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-400"
              >+{{ item.metrics.length - 4 }}</span>
            </div>
          </RouterLink>

          <!-- Create new CTA -->
          <RouterLink
            to="/statsdata"
            data-anim="side"
            class="group flex flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center transition-colors hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/[0.02]"
          >
            <div>
              <div class="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-xl font-light text-[var(--color-primary)]">+</div>
              <p class="text-sm font-semibold text-slate-700">Créer une page data</p>
              <p class="mt-1 text-xs text-slate-400">Connectez vos propres sources</p>
            </div>
          </RouterLink>
        </div>
      </div>
    </div>
  </section>
</template>
