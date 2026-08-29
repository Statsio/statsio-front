<script setup lang="ts">
definePageMeta({
  layout: 'content-dashboard',
  middleware: ['auth'],
  ssr: false,
  title: 'Historique',
  robots: 'noindex,nofollow',
})

import ContentDashboardHeader from '@/components/contents/dashboard/ContentDashboardHeader.vue'
import ContentComingSoonCard from '@/components/contents/dashboard/ContentComingSoonCard.vue'

const PLACEHOLDER = [
  { label: 'Publication de la version courante', when: "aujourd'hui", rev: 'v1.4' },
  { label: "Ajout d'une source de données", when: 'hier', rev: 'v1.3' },
  { label: 'Modification du chapô', when: 'il y a 3 jours', rev: 'v1.2' },
  { label: 'Première publication', when: 'la semaine dernière', rev: 'v1.0' },
]
</script>

<template>
  <div>
    <ContentDashboardHeader
      title="Historique"
      subtitle="Chaque enregistrement et publication, restaurables."
    />

    <ContentComingSoonCard
      title="Versions du contenu"
      description="Un journal horodaté des modifications, avec restauration d'une version antérieure."
      note="Le suivi des versions n'est pas encore enregistré côté serveur."
    >
      <div class="divide-y divide-slate-100 rounded-2xl border border-slate-200">
        <div v-for="v in PLACEHOLDER" :key="v.rev" class="flex items-center gap-3.5 px-5 py-3.5">
          <span class="h-2.5 w-2.5 shrink-0 rounded-full bg-slate-300" />
          <span class="flex-1">
            <span class="block text-[13.5px] font-bold text-slate-500">{{ v.label }}</span>
            <span class="block text-[11.5px] text-slate-400">{{ v.when }}</span>
          </span>
          <span class="font-mono text-[11px] text-slate-400">{{ v.rev }}</span>
          <span class="text-[11.5px] font-bold text-slate-400">Restaurer</span>
        </div>
      </div>
    </ContentComingSoonCard>
  </div>
</template>
