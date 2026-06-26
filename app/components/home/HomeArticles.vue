<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useScrollAnim } from '@/composables/useScrollAnim'
import AppButton from '@/components/ui/AppButton.vue'
import HomeSectionHeader from '@/components/home/HomeSectionHeader.vue'

defineProps<{
  items: {
    category: string
    title: string
    author: string
    reads: string
    trend: string
  }[]
}>()

const sectionRef = ref<HTMLElement | null>(null)

useScrollAnim(sectionRef, (gsap) => {
  return gsap.context(() => {
    gsap.from('[data-anim="header"]', {
      y: 20, opacity: 0, duration: 0.6, ease: 'power2.out',
      scrollTrigger: { trigger: sectionRef.value, start: 'top 80%' },
    })
    gsap.from('[data-anim="featured"]', {
      x: -40, opacity: 0, duration: 0.8, ease: 'power3.out',
      scrollTrigger: { trigger: '[data-anim="featured"]', start: 'top 80%' },
    })
    gsap.from('[data-anim="article"]', {
      x: 30, opacity: 0, duration: 0.65, stagger: 0.12, ease: 'power2.out',
      scrollTrigger: { trigger: '[data-anim="featured"]', start: 'top 80%' },
    })
  }, sectionRef.value)
})
</script>

<template>
  <section ref="sectionRef" class="bg-white">
    <div class="container py-20">
      <div data-anim="header">
        <HomeSectionHeader eyebrow="Presse & analyses" title="Articles enrichis par la data">
          <AppButton variant="primary">Publier</AppButton>
        </HomeSectionHeader>
      </div>

      <div class="mt-10 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <!-- Featured article -->
        <article
          v-if="items[0]"
          data-anim="featured"
          class="group relative min-h-[340px] overflow-hidden rounded-2xl bg-slate-950 p-7 text-white shadow-md transition-shadow duration-300 hover:shadow-xl"
        >
          <div
            class="pointer-events-none absolute inset-0 opacity-30"
            style="background-image: linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px); background-size: 48px 48px;"
            aria-hidden="true"
          />
          <div
            class="pointer-events-none absolute inset-0"
            style="background: radial-gradient(ellipse 60% 50% at 80% 80%, rgba(139,92,246,0.15) 0%, transparent 60%);"
            aria-hidden="true"
          />
          <div class="relative flex h-full flex-col">
            <div class="flex items-center justify-between">
              <span class="rounded-full bg-[var(--color-primary)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
                {{ items[0].category }}
              </span>
              <span class="text-sm font-semibold text-emerald-400">{{ items[0].trend }}</span>
            </div>
            <h3 class="mt-6 flex-1 text-2xl font-semibold leading-tight text-white sm:text-3xl">
              {{ items[0].title }}
            </h3>
            <div class="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
              <span class="text-sm text-slate-400">{{ items[0].author }}</span>
              <span class="mono text-sm text-slate-400">{{ items[0].reads }} lectures</span>
            </div>
          </div>
        </article>

        <!-- Secondary articles -->
        <div class="flex flex-col gap-5">
          <article
            v-for="item in items.slice(1)"
            :key="item.title"
            data-anim="article"
            class="flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div class="flex items-start justify-between gap-4">
              <span class="inline-block rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                {{ item.category }}
              </span>
              <span class="shrink-0 text-sm font-semibold text-emerald-600">{{ item.trend }}</span>
            </div>
            <h3 class="mt-3.5 text-lg font-semibold leading-tight text-slate-900">{{ item.title }}</h3>
            <div class="mt-4 flex items-center justify-between text-sm text-slate-500">
              <span>{{ item.author }}</span>
              <span class="mono">{{ item.reads }}</span>
            </div>
          </article>
        </div>
      </div>

      <div class="mt-8 text-center">
        <RouterLink
          to="/articles"
          class="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)] transition-opacity hover:opacity-70"
        >
          Voir tous les articles <span aria-hidden="true">→</span>
        </RouterLink>
      </div>
    </div>
  </section>
</template>
