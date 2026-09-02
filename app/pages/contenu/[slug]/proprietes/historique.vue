<script setup lang="ts">
definePageMeta({
  layout: 'content-dashboard',
  middleware: ['auth'],
  ssr: false,
  title: 'Historique',
  robots: 'noindex,nofollow',
})

import { ref, watch } from 'vue'
import ContentDashboardHeader from '@/components/contents/dashboard/ContentDashboardHeader.vue'
import StatsDataSettingsCard from '@/components/statsdata/settings/StatsDataSettingsCard.vue'
import { fetchContentVersions, restoreContentVersion, type StudioContentVersionRow } from '@/api/studio'
import { useContentDashboard } from '@/composables/useContentDashboard'

const { content, reload } = useContentDashboard()
const notifications = useAppNotifications()

const versions = ref<StudioContentVersionRow[]>([])
const loading = ref(true)
const restoringVersion = ref<number | null>(null)

watch(
  content,
  async (doc) => {
    if (!doc?.slug && !doc?.id) return
    loading.value = true
    try {
      versions.value = await fetchContentVersions(doc.slug || doc.id)
    } catch {
      versions.value = []
    } finally {
      loading.value = false
    }
  },
  { immediate: true },
)

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

async function restore(version: number) {
  const id = content.value?.slug || content.value?.id
  if (!id) return
  if (!window.confirm(`Recharger la version ${version} dans le brouillon ? Vos modifications en cours seront remplacées (la page publique ne change pas).`)) return
  restoringVersion.value = version
  try {
    await restoreContentVersion(id, version)
    await reload()
    notifications.success(`Version ${version} rechargée dans le brouillon. Ouvrez le Studio pour la retravailler ou la republier.`)
  } catch {
    notifications.error("La version n'a pas pu être restaurée.")
  } finally {
    restoringVersion.value = null
  }
}
</script>

<template>
  <div>
    <ContentDashboardHeader
      title="Historique"
      subtitle="Chaque publication est archivée. Restaurez une version antérieure dans le brouillon, puis republiez-la."
    />

    <StatsDataSettingsCard
      title="Versions publiées"
      description="La page publique affiche toujours la dernière version publiée. Restaurer recharge une version dans le brouillon sans toucher au public."
    >
      <p v-if="loading" class="py-4 text-[13px] text-slate-400">Chargement…</p>

      <p v-else-if="!versions.length" class="py-4 text-[13px] text-slate-400">
        Ce contenu n'a pas encore été publié — aucune version archivée.
      </p>

      <div v-else class="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200">
        <div v-for="v in versions" :key="v.version" class="flex items-center gap-3.5 px-5 py-3.5">
          <span
            class="h-2.5 w-2.5 shrink-0 rounded-full"
            :class="v.is_current ? 'bg-emerald-500' : 'bg-slate-300'"
          />
          <span class="min-w-0 flex-1">
            <span class="block truncate text-[13.5px] font-bold text-slate-800">
              Publication de la version {{ v.version }}
              <span v-if="v.is_current" class="ml-1 text-[11px] font-semibold text-emerald-600">· en ligne</span>
            </span>
            <span class="block truncate text-[11.5px] text-slate-400">
              {{ v.author_name }}<span v-if="v.published_as === 'channel'"> (chaîne)</span> · {{ formatDate(v.created_at) }}
            </span>
          </span>
          <span class="shrink-0 font-mono text-[11px] text-slate-400">v{{ v.version }}</span>
          <button
            v-if="!v.is_current"
            type="button"
            class="shrink-0 text-[11.5px] font-bold text-primary disabled:opacity-40"
            :disabled="restoringVersion !== null"
            @click="restore(v.version)"
          >
            {{ restoringVersion === v.version ? 'Restauration…' : 'Restaurer' }}
          </button>
        </div>
      </div>
    </StatsDataSettingsCard>
  </div>
</template>
