<script setup lang="ts">
import { computed, nextTick, watch } from 'vue'
import StatsDataSection from './StatsDataSection.vue'
import BlockRenderer from '@/components/studio/blocks/BlockRenderer.vue'
import BlockCard from '@/components/studio/blocks/BlockCard.vue'
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
      <div v-else-if="item.block" :id="`block-${item.block.id}`" data-block-anim class="min-w-0 scroll-mt-40">
        <BlockCard :block="item.block" :readonly="true">
          <BlockRenderer :block="item.block" :readonly="true" />
        </BlockCard>
      </div>
    </template>
  </template>

  <div v-else class="sd-empty">
    <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
      <circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4" />
      <path d="M20 20 L20 3 A17 17 0 0 1 37 20 Z" fill="var(--ds-tint)" stroke="currentColor" stroke-width="2" />
    </svg>
    <p>Aucun contenu sur cette page.</p>
  </div>
</template>
