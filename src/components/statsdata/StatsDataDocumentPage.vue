<script setup lang="ts">
import { computed, provide } from 'vue'
import { RouterLink } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import { useAuthStore } from '@/stores/auth'
import { studioDataSourcesKey, studioStatsDataWidgetKey } from '@/lib/studio-inject-keys'
import { resolveStudioBlock } from '@/components/studio/blocks/studio-block-registry'
import { blockToPayload } from '@/types/studio-document'
import type { StatsDataDocumentDto } from '@/types/statsdata-document-api'
import { executeStatsDataQuery } from '@/api/statsdata-sources'
import type { StatsDataAnyQueryRequest } from '@/types/statsdata-query'

const props = defineProps<{
  document: StatsDataDocumentDto
}>()

const heroStats = computed(() => [
  { label: 'Blocs', value: String(props.document.blocks?.length ?? 0) },
  { label: 'Sources', value: String(props.document.dataSources?.length ?? 0) },
  { label: 'Mise à jour', value: formatUpdated(props.document.updated_at) },
])

const featurePanels = [
  {
    title: 'Comparaisons rapides',
    detail: 'Basculez entre territoires, périodes et segments sans casser la lecture.',
  },
  {
    title: 'Blocs réutilisables',
    detail: 'Tableaux, graphiques et exports dans un même flux.',
  },
  {
    title: 'Connexion éditoriale',
    detail: 'Chaque StatsData peut alimenter un article, une note interne ou un baromètre public.',
  },
]

const quickSignals = computed(() => [
  {
    label: 'Auteur',
    title: authorLabel.value ?? '—',
    detail: props.document.visibility ? `Visibilité: ${props.document.visibility}` : 'Visibilité: —',
  },
  {
    label: 'Identifiant',
    title: props.document.slug || '—',
    detail: props.document.id ? `ID: ${props.document.id}` : 'ID: —',
  },
  {
    label: 'Édition',
    title: canEdit.value ? 'Vous pouvez modifier' : 'Lecture seule',
    detail: canEdit.value ? 'Accès au studio et aux propriétés.' : 'Connectez-vous pour modifier si vous êtes l’auteur.',
  },
])

const authStore = useAuthStore()

const canEdit = computed(() => {
  const uid = authStore.user?.id
  const createdById = props.document.created_by?.id
  if (uid == null || !createdById) return false
  return String(uid) === String(createdById)
})

provide(studioDataSourcesKey, computed(() => props.document.dataSources ?? []))

provide(
  studioStatsDataWidgetKey,
  computed(() => ({
    enabled: true,
    documentId: props.document.id,
    executeQuery: async (body: StatsDataAnyQueryRequest) => executeStatsDataQuery(props.document.id, body),
  })),
)

function formatUpdated(iso: string): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(date)
}

const authorLabel = computed(() => {
  const c = props.document.created_by
  if (!c) return null
  const name = [c.first_name, c.last_name].filter((x) => typeof x === 'string' && x.trim().length > 0).join(' ')
  return name || c.email || null
})
</script>

<template>
  <main class="pb-24 pt-32">
    <section class="section pb-10">
      <div class="container grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_320px] lg:items-start">
        <div class="flex flex-col gap-8">
          <div class="flex flex-col gap-5">
            <p class="eyebrow text-accent">StatsData & exploration</p>
            <div class="flex max-w-4xl flex-col gap-4">
              <h1 class="text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
                {{ document.title || 'Sans titre' }}
              </h1>
              <p v-if="document.subtitle" class="max-w-3xl text-lg leading-8 text-slate-600">
                {{ document.subtitle }}
              </p>
              <div class="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
                <span>Mis à jour le {{ formatUpdated(document.updated_at) }}</span>
                <span v-if="authorLabel">par {{ authorLabel }}</span>
                <span v-if="document.visibility">• {{ document.visibility }}</span>
              </div>
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-3">
            <div
              v-for="stat in heroStats"
              :key="stat.label"
              class="rounded-[1.75rem] border border-slate-200 bg-white/85 px-5 py-4 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.35)]"
            >
              <div class="flex flex-col gap-3">
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{{ stat.label }}</p>
                <p class="text-2xl font-semibold text-slate-950">{{ stat.value }}</p>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap gap-3">
            <AppButton as="router-link" to="/statsdata" variant="secondary" size="md">
              Revenir au catalogue
            </AppButton>
            <AppButton
              v-if="canEdit"
              as="router-link"
              :to="{ name: 'studio-statsdata-edit', params: { id: document.id } }"
              variant="primary"
              size="md"
            >
              Modifier dans le studio
            </AppButton>
            <AppButton
              v-if="canEdit"
              as="router-link"
              :to="{ name: 'statsdata-settings', params: { id: document.id } }"
              variant="outline"
              size="md"
            >
              Propriétés
            </AppButton>
            <AppButton v-else-if="!authStore.hasSession" as="router-link" to="/login" variant="outline" size="md">
              Se connecter pour modifier
            </AppButton>
          </div>

          <article
            class="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_40px_110px_-58px_rgba(59,130,246,0.45)]"
          >
            <div class="p-7 sm:p-9">
              <div
                v-if="!document.blocks?.length"
                class="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-16 text-center text-sm leading-relaxed text-slate-500"
              >
                Cette StatsData ne contient pas encore de blocs.
                <RouterLink
                  v-if="canEdit"
                  :to="{ name: 'studio-statsdata-edit', params: { id: document.id } }"
                  class="font-semibold text-primary"
                >
                  Ouvrir le studio
                </RouterLink>
              </div>
              <div v-else class="flex flex-col gap-10 lg:gap-12">
                <component
                  v-for="block in document.blocks"
                  :key="block.id"
                  :is="resolveStudioBlock(block.type)"
                  :payload="blockToPayload(block)"
                  :field-id="block.id"
                  :editable="false"
                />
              </div>
            </div>
          </article>
        </div>

        <aside class="flex flex-col gap-4">
          <div class="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white">
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Pourquoi ça marche</p>
            <div class="mt-5 flex flex-col gap-5">
              <div v-for="panel in featurePanels" :key="panel.title" class="rounded-[1.5rem] bg-white/8 p-4">
                <div class="flex flex-col gap-2">
                  <p class="text-sm font-semibold text-white">{{ panel.title }}</p>
                  <p class="text-sm leading-6 text-slate-300">{{ panel.detail }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="rounded-[2rem] border border-slate-200 bg-white p-6">
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">À propos</p>
            <div class="mt-5 flex flex-col gap-4">
              <div v-for="item in quickSignals" :key="item.title" class="rounded-[1.5rem] bg-slate-50 p-4">
                <div class="flex flex-col gap-2">
                  <p class="text-xs font-semibold uppercase tracking-[0.22em] text-primary">{{ item.label }}</p>
                  <p class="text-base font-semibold text-slate-950">{{ item.title }}</p>
                  <p class="text-sm leading-6 text-slate-500">{{ item.detail }}</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  </main>
</template>

