<script setup lang="ts">
import { computed } from 'vue'
import { useContentDomain } from '@/composables/useContentDomain'

const props = defineProps<{
  crumbs: { label: string; to?: string }[]
  badge: string
  badgeClass?: string
  kicker: string
  title?: string
  subtitle: string
  /** Chemin de l'illustration `…-hero-light.png` ; les variantes de marque
   *  (`…-hero-tvstats.png`, `…-hero-medistats.png`) sont choisies automatiquement. */
  heroSrc?: string
  heroClass?: string
  stats: { label: string; value: string }[]
}>()

const domain = useContentDomain()

const resolvedHeroSrc = computed(() => {
  if (!props.heroSrc) return undefined
  if (domain.value === 'statsio') return props.heroSrc
  return props.heroSrc.replace(/-light\.(png|webp|jpe?g)$/i, `-${domain.value}.$1`)
})
</script>

<template>
  <section class="relative overflow-hidden border-b border-slate-200/80 bg-white px-4 pb-11 pt-10 sm:px-6 lg:px-8 lg:pb-12 lg:pt-14" :class="heroClass">
    <img
      v-if="resolvedHeroSrc"
      :src="resolvedHeroSrc"
      alt=""
      class="pointer-events-none absolute inset-0 h-full w-full object-cover"
    />
    <div
      class="pointer-events-none absolute inset-0 bg-[linear-gradient(100deg,rgba(255,255,255,0.97)_0%,rgba(255,255,255,0.92)_42%,rgba(255,255,255,0.4)_64%,rgba(255,255,255,0)_100%)]"
      aria-hidden="true"
    />
    <div class="relative mx-auto max-w-[1240px]">
      <nav class="mb-5 flex flex-wrap items-center gap-2 text-[12.5px] font-semibold" aria-label="Fil d'Ariane">
        <template v-for="(crumb, i) in crumbs" :key="crumb.label">
          <span v-if="i > 0" class="text-slate-300" aria-hidden="true">/</span>
          <NuxtLink v-if="crumb.to" :to="crumb.to" class="text-slate-500 transition-colors hover:text-primary">
            {{ crumb.label }}
          </NuxtLink>
          <span v-else class="text-primary">{{ crumb.label }}</span>
        </template>
      </nav>

      <div class="mb-4 flex flex-wrap items-center gap-2.5">
        <slot name="badge">
          <span class="mono rounded-[5px] border border-primary/25 bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary" :class="badgeClass">
            {{ badge }}
          </span>
        </slot>
        <span class="mono text-[10.5px] font-semibold tracking-[0.1em] text-slate-500">{{ kicker }}</span>
      </div>

      <h1 class="max-w-[23ch] text-[2.15rem] font-extrabold leading-[1.04] tracking-[-0.03em] text-slate-950 text-pretty sm:text-5xl lg:text-[52px]">
        <slot name="title">{{ title }}</slot>
      </h1>
      <p class="mt-4 max-w-[58ch] text-[17px] leading-relaxed text-slate-600 text-pretty">{{ subtitle }}</p>

      <div class="mt-8 flex flex-wrap gap-8 border-t border-slate-200/80 pt-5">
        <div v-for="stat in stats" :key="stat.label">
          <div class="text-[9.5px] font-extrabold uppercase tracking-[0.09em] text-slate-400">{{ stat.label }}</div>
          <div class="mono mt-1.5 text-[19px] font-semibold tracking-[-0.01em] text-slate-950">{{ stat.value }}</div>
        </div>
      </div>
    </div>
  </section>
</template>
