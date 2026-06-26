<script setup lang="ts">
import { ref } from 'vue'
import { useScrollAnim } from '@/composables/useScrollAnim'
import AppButton from '@/components/ui/AppButton.vue'
import HomeSectionHeader from '@/components/home/HomeSectionHeader.vue'

defineProps<{
  items: { title: string; description: string; tag: string; icon: string }[]
}>()

const sectionRef = ref<HTMLElement | null>(null)

useScrollAnim(sectionRef, (gsap) => {
  return gsap.context(() => {
    gsap.from('[data-anim="header"]', {
      y: 20,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out',
      scrollTrigger: { trigger: sectionRef.value, start: 'top 80%' },
    })
    gsap.from('[data-anim="card"]', {
      y: 44,
      opacity: 0,
      duration: 0.7,
      stagger: 0.13,
      ease: 'power2.out',
      scrollTrigger: { trigger: sectionRef.value, start: 'top 75%' },
    })
  }, sectionRef.value)
})
</script>

<template>
  <section ref="sectionRef" class="bg-slate-50">
    <div class="container py-20">
      <div data-anim="header">
        <HomeSectionHeader eyebrow="Pourquoi Statsio" title="Une newsroom data-ready">
          <AppButton variant="secondary">Voir la démo</AppButton>
        </HomeSectionHeader>
      </div>

      <div class="mt-10 grid gap-5 lg:grid-cols-3">
        <article
          v-for="item in items"
          :key="item.title"
          data-anim="card"
          class="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
        >
          <div
            class="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] transition-transform duration-300 group-hover:scale-x-100"
            aria-hidden="true"
          />
          <div class="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary)]/10 text-xl">
            {{ item.icon }}
          </div>
          <p class="eyebrow text-[var(--color-primary)]">{{ item.tag }}</p>
          <h3 class="mt-2 text-xl font-semibold text-slate-900">{{ item.title }}</h3>
          <p class="mt-2 text-sm leading-relaxed text-slate-600">{{ item.description }}</p>
          <div
            class="mt-5 flex items-center gap-1.5 text-xs font-semibold text-[var(--color-primary)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            aria-hidden="true"
          >
            En savoir plus <span>→</span>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
