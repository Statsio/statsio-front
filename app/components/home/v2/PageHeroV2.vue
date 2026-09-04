<script setup lang="ts">
import { computed } from 'vue'
import { useContentDomain } from '@/composables/useContentDomain'
import type { HomeHeadlinePart, HomeHeroStat } from '@/data/brands/home-content.types'

const props = defineProps<{
  badge: string
  /** Titre simple, ou fragments colorés via #title. */
  title?: string
  titleParts?: HomeHeadlinePart[]
  subtitle?: string
  /** Petite ligne mono (sources, périmètre…). */
  note?: string
  crumbs?: { label: string; to?: string }[]
  stats?: HomeHeroStat[]
  /** Illustration de fond : `chart` | `grid` | `search` | `map` — déclinée par marque. */
  heroKind?: 'chart' | 'grid' | 'search' | 'map'
}>()

const domain = useContentDomain()

const heroSrc = computed(() =>
  props.heroKind ? `/brand/listings/${props.heroKind}-hero-${domain.value}.png` : undefined,
)
</script>

<template>
  <section class="relative overflow-hidden border-b border-slate-200/80 bg-white px-4 pb-10 pt-9 sm:px-6 lg:px-8 lg:pb-12 lg:pt-12">
    <template v-if="heroSrc">
      <img
        :src="heroSrc"
        alt=""
        class="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      <div
        class="pointer-events-none absolute inset-0 bg-[linear-gradient(100deg,rgba(255,255,255,0.97)_0%,rgba(255,255,255,0.92)_42%,rgba(255,255,255,0.4)_64%,rgba(255,255,255,0)_100%)]"
        aria-hidden="true"
      />
    </template>
    <template v-else>
      <div
        class="page-hero-halo page-hero-halo--primary pointer-events-none absolute -right-28 -top-32 h-[420px] w-[420px] rounded-full"
        aria-hidden="true"
      />
      <div
        class="page-hero-halo page-hero-halo--accent pointer-events-none absolute -bottom-40 -left-24 h-[360px] w-[360px] rounded-full"
        aria-hidden="true"
      />
    </template>

    <div class="relative mx-auto max-w-[1120px]">
      <nav
        v-if="crumbs?.length"
        class="mb-5 flex flex-wrap items-center gap-2 text-[12.5px] font-semibold"
        aria-label="Fil d'Ariane"
      >
        <template v-for="(crumb, i) in crumbs" :key="crumb.label">
          <span v-if="i > 0" class="text-slate-300" aria-hidden="true">/</span>
          <NuxtLink v-if="crumb.to" :to="crumb.to" class="text-slate-500 transition-colors hover:text-primary">
            {{ crumb.label }}
          </NuxtLink>
          <span v-else class="text-primary">{{ crumb.label }}</span>
        </template>
      </nav>

      <div class="mb-4 flex flex-wrap items-center gap-2.5">
        <span class="rounded-[5px] border border-primary/25 bg-primary/10 px-2 py-1 font-mono text-[10px] font-semibold text-primary">
          {{ badge }}
        </span>
        <slot name="badge-extra" />
      </div>

      <h1 class="m-0 max-w-[24ch] text-[2rem] font-extrabold leading-[1.06] tracking-[-0.03em] text-slate-950 text-pretty sm:text-[2.6rem] lg:text-[3rem]">
        <slot name="title">
          <template v-if="titleParts">
            <span v-for="(part, i) in titleParts" :key="i" :style="part.color ? { color: part.color } : undefined">{{ part.text }}</span>
          </template>
          <template v-else>{{ title }}</template>
        </slot>
      </h1>

      <p v-if="subtitle" class="mt-4 max-w-[62ch] text-[16.5px] leading-relaxed text-slate-600 text-pretty">
        {{ subtitle }}
      </p>
      <p v-if="note" class="mt-2.5 font-mono text-[11px] leading-relaxed text-slate-400">{{ note }}</p>

      <div v-if="stats?.length" class="mt-8 flex flex-wrap gap-x-10 gap-y-5 border-t border-slate-200/80 pt-5">
        <div v-for="stat in stats" :key="stat.label">
          <div class="text-[9.5px] font-extrabold uppercase tracking-[0.09em] text-slate-400">{{ stat.label }}</div>
          <div class="mt-1.5 font-mono text-[19px] font-semibold tracking-[-0.01em] text-slate-950">{{ stat.value }}</div>
        </div>
      </div>

      <div v-if="$slots.default" class="mt-7">
        <slot />
      </div>
    </div>
  </section>
</template>

<style scoped>
.page-hero-halo--primary {
  background: radial-gradient(circle, color-mix(in srgb, var(--color-primary) 13%, transparent), transparent 70%);
}
.page-hero-halo--accent {
  background: radial-gradient(circle, color-mix(in srgb, var(--color-accent) 11%, transparent), transparent 70%);
}
@supports not (color: color-mix(in srgb, red, blue)) {
  .page-hero-halo--primary { background: radial-gradient(circle, var(--color-secondary), transparent 70%); opacity: 0.36; }
  .page-hero-halo--accent { background: radial-gradient(circle, var(--color-secondary), transparent 70%); opacity: 0.28; }
}
</style>
