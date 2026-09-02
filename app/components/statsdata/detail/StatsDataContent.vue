<script setup lang="ts">
import { computed, nextTick, watch } from 'vue'
import StatsDataSection from './StatsDataSection.vue'
import BlockRenderer from '@/components/studio/blocks/BlockRenderer.vue'
import type { CanvasItemRef, Section, StudioBlock } from '@/types/studio'

const props = defineProps<{
  items: Array<{ ref: CanvasItemRef; section?: Section; block?: StudioBlock }>
}>()

const visibleItems = computed(() => props.items)

// Rejoue l'animation de révélation au scroll quand la liste change
// (chargement initial, changement d'onglet / de page).
watch(() => visibleItems.value, async () => {
  if (typeof window === 'undefined') return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  await nextTick()
  try {
    const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger'),
    ])
    gsap.registerPlugin(ScrollTrigger)
    const els = document.querySelectorAll<HTMLElement>('[data-block-anim]')
    els.forEach((el) => {
      gsap.from(el, {
        y: 28,
        opacity: 0,
        duration: 0.65,
        ease: 'power2.out',
        immediateRender: false,
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      })
    })
    requestAnimationFrame(() => ScrollTrigger.refresh())
  } catch { /* GSAP unavailable — content stays visible */ }
}, { immediate: true, deep: true })
</script>

<template>
  <template v-if="visibleItems.length > 0">
    <template v-for="item in visibleItems" :key="item.ref.kind + ':' + item.ref.id">
      <StatsDataSection v-if="item.section" :section="item.section" />
      <div v-else-if="item.block" data-block-anim class="min-w-0">
        <BlockRenderer :block="item.block" :readonly="true" />
      </div>
    </template>
  </template>

  <div v-else class="rounded-2xl border border-dashed border-[#18181f]/15 bg-[#18181f]/[0.02] py-20 text-center text-[#18181f]/40">
    <svg class="mx-auto mb-3 h-10 w-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12" />
    </svg>
    <p class="text-sm">Aucun contenu sur cette page.</p>
  </div>
</template>
