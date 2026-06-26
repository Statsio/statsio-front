<script setup lang="ts">
import { ref } from 'vue'
import { useScrollAnim } from '@/composables/useScrollAnim'

defineProps<{
  stats: { label: string; value: string; hint: string }[]
}>()

const sectionRef = ref<HTMLElement | null>(null)

useScrollAnim(sectionRef, (gsap) => {
  return gsap.context(() => {
    gsap.from('[data-anim="stat"]', {
      y: 24,
      opacity: 0,
      duration: 0.65,
      stagger: 0.14,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: sectionRef.value,
        start: 'top 85%',
      },
    })
  }, sectionRef.value)
})
</script>

<template>
  <section ref="sectionRef" class="border-b border-slate-100 bg-white">
    <div class="container">
      <div class="grid sm:grid-cols-3 sm:divide-x sm:divide-slate-100">
        <div
          v-for="stat in stats"
          :key="stat.label"
          data-anim="stat"
          class="flex flex-col gap-1.5 border-b border-slate-100 px-6 py-10 last:border-b-0 sm:border-b-0 sm:px-8"
        >
          <p class="eyebrow">{{ stat.label }}</p>
          <p class="mono text-4xl font-semibold text-[var(--color-primary)]">{{ stat.value }}</p>
          <p class="text-sm leading-relaxed text-slate-500">{{ stat.hint }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
