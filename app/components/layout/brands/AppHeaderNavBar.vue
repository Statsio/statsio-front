<script setup lang="ts">
import { RouterLink } from 'vue-router'
import AppNavIcon from '@/components/layout/AppNavIcon.vue'
import type { HeaderNavItem } from '@/components/layout/brands/header-nav.types'
import { fetchPinnedDossiers } from '@/api/dossiers'

defineProps<{ items: HeaderNavItem[] }>()

const emit = defineEmits<{ hover: [item: HeaderNavItem] }>()

// Dossiers épinglés depuis le back-office (toggle « Épinglé dans le header »).
// Affichés en badges après les rubriques ; sans destination pour le moment.
const { data: pinnedDossiers } = useAsyncData('header-pinned-dossiers', () => fetchPinnedDossiers(), {
  default: () => [],
})
</script>

<template>
  <nav class="hidden items-center gap-0.5 lg:flex">
    <component
      :is="item.href.startsWith('/') ? RouterLink : 'a'"
      v-for="item in items"
      :key="item.label"
      :to="item.href.startsWith('/') ? item.href : undefined"
      :href="item.href.startsWith('/') ? undefined : item.href"
      class="group inline-flex items-center gap-1.5 rounded-[10px] px-2.5 py-2 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 [&.router-link-active]:bg-slate-100 [&.router-link-active]:text-slate-900"
      @mouseenter="emit('hover', item)"
    >
      <AppNavIcon :kind="item.icon" class="h-[16px] w-[16px] shrink-0" />
      <span>{{ item.label }}</span>
    </component>

    <template v-if="pinnedDossiers && pinnedDossiers.length">
      <span class="mx-1.5 h-4 w-px shrink-0 bg-slate-200" aria-hidden="true"></span>
      <button
        v-for="dossier in pinnedDossiers"
        :key="dossier.id"
        type="button"
        class="group inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/20 bg-primary/[0.06] px-2.5 py-1 text-[12px] font-bold text-primary transition hover:border-primary/40 hover:bg-primary/10"
      >
        <svg viewBox="0 0 24 24" class="h-3 w-3 shrink-0" fill="currentColor" aria-hidden="true">
          <path
            d="M9 2a1 1 0 0 0 0 2h.72l.53 5.32-2.9 2.05A1 1 0 0 0 7 12v2a1 1 0 0 0 1 1h3v6a1 1 0 0 0 2 0v-6h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-.35-.63l-2.9-2.05L15.28 4H16a1 1 0 1 0 0-2H9Z"
          />
        </svg>
        <span>{{ dossier.name }}</span>
      </button>
    </template>
  </nav>
</template>
