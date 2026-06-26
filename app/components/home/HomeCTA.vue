<script setup lang="ts">
import { ref } from 'vue'
import { useScrollAnim } from '@/composables/useScrollAnim'
import AppButton from '@/components/ui/AppButton.vue'

const sectionRef = ref<HTMLElement | null>(null)

useScrollAnim(sectionRef, (gsap) => {
  return gsap.context(() => {
    gsap.from('[data-anim="cta-card"]', {
      y: 32, opacity: 0, duration: 0.8, ease: 'power3.out',
      immediateRender: false,
      scrollTrigger: { trigger: sectionRef.value, start: 'top 86%', once: true },
    })
    gsap.from('[data-anim="cta-text"]', {
      y: 16, opacity: 0, duration: 0.6, ease: 'power2.out',
      immediateRender: false,
      scrollTrigger: { trigger: '[data-anim="cta-card"]', start: 'top 78%', once: true },
    })
    gsap.from('[data-anim="cta-btn"]', {
      y: 12, opacity: 0, duration: 0.45, stagger: 0.1, ease: 'power2.out',
      immediateRender: false,
      scrollTrigger: { trigger: '[data-anim="cta-card"]', start: 'top 72%', once: true },
    })
  }, sectionRef.value)
})
</script>

<template>
  <section ref="sectionRef" class="bg-slate-50">
    <div class="container py-20">
      <div
        data-anim="cta-card"
        class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--color-primary)] via-violet-700 to-[var(--color-accent)] p-10 shadow-2xl lg:p-16"
      >
        <div
          class="pointer-events-none absolute inset-0"
          style="background-image: linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px); background-size: 40px 40px;"
          aria-hidden="true"
        />
        <div class="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/[0.06]" aria-hidden="true" />
        <div class="pointer-events-none absolute -bottom-20 right-1/3 h-72 w-72 rounded-full bg-white/[0.04]" aria-hidden="true" />

        <div class="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div data-anim="cta-text">
            <div class="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-white/80">
              <img src="@/assets/brand/statsio-white.svg" alt="" class="h-4 w-4" aria-hidden="true" />
              Statsio Pro
            </div>
            <h2 class="mt-4 text-3xl font-semibold leading-tight text-white sm:text-4xl">
              Transformez vos chiffres<br class="hidden sm:block" /> en audience
            </h2>
            <p class="mt-4 max-w-md text-sm leading-relaxed text-white/70">
              Créez votre chaîne, automatisez vos StatsData et publiez des articles enrichis par la data.
            </p>
          </div>

          <div class="flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
            <div data-anim="cta-btn">
              <AppButton variant="light" size="lg">Demander une démo</AppButton>
            </div>
            <div data-anim="cta-btn">
              <AppButton variant="light-outline" size="lg">Voir les offres</AppButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
