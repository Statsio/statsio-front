<script setup lang="ts">
import { computed } from 'vue'
import type { CatalogItem } from '@/types/catalog'
import type { ContentCardFormat, ContentManageMeta } from '@/types/content-card'
import { CONTENT_TYPE_META } from '@/lib/content-display'
import { formatCatalogCount } from '@/lib/catalog-format'
import { getNameInitials } from '@/lib/format'

/**
 * Carte de contenu du créateur — reprise des maquettes « Dashboard Chaîne v2 »
 * (onglet Contenus) et « Mon Compte v2 » (Mes contenus). Type-agnostique :
 * seuls la couleur / le libellé de type changent, pas de barres de sondage ni de
 * faux graphique. Alimentée par un `CatalogItem` + son `ContentManageMeta`.
 */
const props = withDefaults(
  defineProps<{
    item: CatalogItem
    manage: ContentManageMeta
    format?: ContentCardFormat
    /** Masque la ligne propriétaire (dashboard chaîne : tout est publié par la même chaîne). */
    hideOwner?: boolean
  }>(),
  { format: 'card', hideOwner: false },
)

const typeMeta = computed(() => CONTENT_TYPE_META[props.item.type ?? 'statsdata'] ?? CONTENT_TYPE_META.statsdata)
const views = computed(() => (props.manage.live ? `${formatCatalogCount(props.manage.viewsCount)} vues` : '— vues'))

const ownerInitials = computed(() => props.item.publisher.initials || getNameInitials(props.manage.ownerLabel) || '?')
</script>

<template>
  <!-- ── format="row" : ligne de tableau (maquette « Contenus récents ») ──── -->
  <div
    v-if="format === 'row'"
    class="grid grid-cols-[minmax(0,2.4fr)_0.9fr_0.7fr_0.8fr] items-center border-t border-[rgba(20,20,30,0.06)] text-[12.5px] first:border-t-0"
  >
    <NuxtLink
      :to="manage.studioPath"
      class="truncate px-6 py-3.5 font-semibold text-[#18181f] hover:text-primary"
    >
      {{ item.title }}
    </NuxtLink>
    <div class="px-3 py-3.5">
      <span
        class="rounded-full px-2.5 py-1 text-[11px] font-bold"
        :style="{ color: typeMeta.color, background: typeMeta.bg }"
      >{{ typeMeta.label }}</span>
    </div>
    <div class="px-3 py-3.5 font-mono text-[rgba(24,24,31,0.6)]">{{ manage.live ? formatCatalogCount(manage.viewsCount) : '—' }}</div>
    <div class="px-6 py-3.5 font-bold" :style="{ color: manage.statusColor }">{{ manage.statusLabel }}</div>
  </div>

  <!-- ── format="card" : carte verticale (maquette onglet Contenus) ──────── -->
  <article
    v-else
    class="flex flex-col overflow-hidden rounded-[14px] border border-[rgba(20,20,30,0.08)] bg-white shadow-[0_1px_3px_rgba(20,20,30,0.05)]"
  >
    <div
      class="relative flex h-[112px] items-center justify-center font-mono text-[10.5px]"
      :style="{ background: typeMeta.bg, color: typeMeta.color }"
    >
      <img
        v-if="item.thumbnail_url"
        :src="item.thumbnail_url"
        :alt="item.title"
        class="absolute inset-0 h-full w-full object-cover"
      />
      <span v-else><span class="opacity-70">aperçu&nbsp;</span>{{ typeMeta.label }}</span>

      <span
        class="absolute right-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold"
        :style="{ background: manage.statusBg, color: manage.statusColor }"
      >{{ manage.statusLabel }}</span>
    </div>

    <div class="flex flex-1 flex-col px-[18px] pb-[18px] pt-4">
      <span class="text-[10.5px] font-extrabold uppercase tracking-[0.06em]" :style="{ color: typeMeta.color }">
        {{ typeMeta.label }}
      </span>

      <NuxtLink
        :to="manage.studioPath"
        class="my-[7px] mb-auto block text-[14.5px] font-bold leading-[1.35] text-[#18181f] text-pretty hover:text-primary"
      >
        {{ item.title }}
      </NuxtLink>

      <div v-if="!hideOwner" class="mt-3 flex items-center gap-2">
        <span
          class="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden border border-slate-200 bg-white text-[8.5px] font-extrabold text-[#18181f]"
          :class="item.publisher.is_channel ? 'rounded-[6px]' : 'rounded-full'"
        >
          <img v-if="item.publisher.logo_url" :src="item.publisher.logo_url" alt="" class="h-full w-full object-cover" />
          <span v-else>{{ ownerInitials }}</span>
        </span>
        <span class="truncate text-[11.5px] font-bold text-[#18181f]">{{ manage.ownerLabel }}</span>
      </div>

      <div class="mt-2 font-mono text-[10.5px] text-[rgba(24,24,31,0.45)]">{{ manage.date }} · {{ views }}</div>

      <div class="mt-3 flex items-center gap-2.5 border-t border-[rgba(20,20,30,0.07)] pt-3">
        <NuxtLink
          :to="manage.studioPath"
          class="rounded-full bg-[#f2ecfd] px-3.5 py-[7px] text-[11.5px] font-extrabold text-[#7c3aed]"
        >
          Éditer
        </NuxtLink>
        <NuxtLink
          v-if="manage.propertiesPath"
          :to="manage.propertiesPath"
          class="text-[11.5px] font-bold text-[rgba(24,24,31,0.5)] hover:text-primary"
        >
          Paramètres
        </NuxtLink>
        <NuxtLink
          v-if="manage.publicPath"
          :to="manage.publicPath"
          class="ml-auto text-[11.5px] font-bold text-[rgba(24,24,31,0.5)] hover:text-primary"
        >
          Voir en ligne ↗
        </NuxtLink>
      </div>
    </div>
  </article>
</template>
