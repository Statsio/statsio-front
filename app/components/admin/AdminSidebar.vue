<script setup lang="ts">
import { useRoute, RouterLink } from 'vue-router'

type NavItem = { label: string; to: string }
type NavSection = { title: string; items: NavItem[]; soon?: boolean }

const sections: NavSection[] = [
  {
    title: 'Général',
    items: [
      { label: 'Dashboard', to: '/admin' },
      { label: 'Utilisateurs', to: '/admin/users' },
    ],
  },
  {
    title: 'TVStats',
    items: [
      { label: 'Chaînes', to: '/admin/tvstats/channels' },
      { label: 'Catégories', to: '/admin/tvstats/categories' },
      { label: 'Questions', to: '/admin/tvstats/review-questions' },
      { label: 'Programmes', to: '/admin/tvstats/programs' },
      { label: 'Diffusions', to: '/admin/tvstats/broadcasts' },
    ],
  },
  {
    title: 'Data',
    items: [
      { label: 'Provenances', to: '/admin/data/provenances' },
    ],
  },
  {
    title: 'MediStats',
    soon: true,
    items: [],
  },
]

const route = useRoute()

function isActive(to: string) {
  if (to === '/admin') return route.path === '/admin'
  return route.path === to || route.path.startsWith(to + '/')
}
</script>

<template>
  <aside class="flex h-full w-60 flex-col bg-slate-950 text-slate-300">
    <!-- Brand -->
    <div class="flex h-16 shrink-0 items-center gap-2.5 border-b border-slate-800 px-5">
      <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-xs font-bold text-white">S</div>
      <div>
        <p class="text-sm font-bold tracking-tight text-white">Statsio</p>
        <p class="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Admin</p>
      </div>
    </div>

    <!-- Nav -->
    <nav class="flex-1 overflow-y-auto py-4">
      <div v-for="section in sections" :key="section.title" class="mb-6">
        <p class="mb-1.5 px-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600">{{ section.title }}</p>
        <p v-if="section.soon" class="px-5 text-xs italic text-slate-700">Bientôt disponible</p>
        <RouterLink
          v-for="item in section.items"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-2.5 px-5 py-2 text-sm font-medium transition-colors"
          :class="isActive(item.to) ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'"
        >
          <span class="h-1.5 w-1.5 rounded-full transition-colors" :class="isActive(item.to) ? 'bg-white' : 'bg-slate-700'" />
          {{ item.label }}
        </RouterLink>
      </div>
    </nav>

    <!-- Back to app -->
    <div class="shrink-0 border-t border-slate-800 p-4">
      <RouterLink to="/" class="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-500 transition hover:bg-white/5 hover:text-slate-300">
        <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Retour à l'application
      </RouterLink>
    </div>
  </aside>
</template>
