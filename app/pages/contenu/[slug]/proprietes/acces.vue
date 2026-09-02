<script setup lang="ts">
definePageMeta({
  layout: 'content-dashboard',
  middleware: ['auth'],
  ssr: false,
  title: 'Accès & partage',
  robots: 'noindex,nofollow',
})

import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import ContentDashboardHeader from '@/components/contents/dashboard/ContentDashboardHeader.vue'
import ContentComingSoonCard from '@/components/contents/dashboard/ContentComingSoonCard.vue'
import StatsDataSettingsCard from '@/components/statsdata/settings/StatsDataSettingsCard.vue'
import { deleteStatsDataDocument } from '@/api/studio'
import { useContentDashboard } from '@/composables/useContentDashboard'

const router = useRouter()
const notifications = useAppNotifications()
const { content, isPublishing, publicPath, unpublish } = useContentDashboard()

const isDeleting = ref(false)
const confirmingDelete = ref(false)
const copied = ref(false)

const shareUrl = computed(() => {
  if (typeof window === 'undefined' || !publicPath.value) {
    return content.value?.slug ? `https://statsio.fr/data/${content.value.slug}` : ''
  }
  return `${window.location.origin}${publicPath.value}`
})

const shareHint = computed(() =>
  content.value?.status === 'published'
    ? 'Lien public : partageable partout, visible dans la recherche Statsio.'
    : 'Contenu non publié : publiez-le pour obtenir un lien partageable.',
)

async function copyLink() {
  if (!shareUrl.value) return
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 1600)
  } catch {
    notifications.error("Le lien n'a pas pu être copié.")
  }
}

async function confirmDelete() {
  const id = content.value?.slug || content.value?.id
  if (!id) return
  isDeleting.value = true
  try {
    await deleteStatsDataDocument(id)
    notifications.success('Contenu supprimé.')
    router.push('/user/contenus')
  } catch {
    notifications.error("Le contenu n'a pas pu être supprimé.")
    isDeleting.value = false
  }
}
</script>

<template>
  <div>
    <ContentDashboardHeader
      title="Accès & partage"
      subtitle="Lien public, intégration et cycle de vie du contenu."
    />

    <div class="flex flex-col gap-5">
      <StatsDataSettingsCard title="Lien de partage" :description="shareHint">
        <div class="flex flex-wrap items-center gap-2.5">
          <span
            class="min-w-[240px] flex-1 truncate rounded-[10px] border-[1.5px] border-[#18181f]/10 bg-slate-50 px-3.5 py-3 font-mono text-[12px] text-[#18181f]/70"
          >
            {{ shareUrl || 'Aucun lien — le contenu est un brouillon' }}
          </span>
          <button
            type="button"
            :disabled="!shareUrl"
            class="rounded-full bg-[linear-gradient(135deg,var(--color-primary),var(--color-accent))] px-5 py-3 text-[11.5px] font-extrabold uppercase tracking-[0.06em] text-white disabled:opacity-40"
            @click="copyLink"
          >
            {{ copied ? 'Copié' : 'Copier' }}
          </button>
        </div>
      </StatsDataSettingsCard>

      <ContentComingSoonCard
        title="Autorisations"
        description="Indexation par les moteurs, iframe externe, accès API en lecture."
        note="Le contrôle fin des autorisations arrivera avec une prochaine version de l'API."
      >
        <div class="flex flex-col gap-3">
          <div
            v-for="opt in ['Indexation par les moteurs', 'Iframe externe', 'Accès API en lecture']"
            :key="opt"
            class="flex items-center justify-between gap-4"
          >
            <span class="text-[13.5px] font-semibold text-slate-500">{{ opt }}</span>
            <span class="h-6 w-[42px] rounded-full bg-slate-200" />
          </div>
        </div>
      </ContentComingSoonCard>

      <StatsDataSettingsCard
        danger
        title="Zone sensible"
        description="Dépublier retire la page du site mais conserve le contenu et ses sources. La suppression est définitive."
      >
        <div
          v-if="confirmingDelete"
          class="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-red-50 px-[18px] py-4"
        >
          <p class="text-[13.5px] font-semibold text-red-900">
            Confirmer la suppression de « {{ content?.title }} » ?
          </p>
          <div class="flex gap-2.5">
            <button
              type="button"
              class="rounded-[9px] bg-red-600 px-4 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              :disabled="isDeleting"
              @click="confirmDelete"
            >
              {{ isDeleting ? 'Suppression…' : 'Oui, supprimer' }}
            </button>
            <button
              type="button"
              class="rounded-[9px] border border-[#18181f]/[0.14] bg-white px-4 py-2.5 text-[13px] font-bold text-[#18181f]"
              :disabled="isDeleting"
              @click="confirmingDelete = false"
            >
              Annuler
            </button>
          </div>
        </div>

        <div v-else class="flex flex-wrap items-center gap-2.5">
          <button
            v-if="content?.status === 'published'"
            type="button"
            :disabled="isPublishing"
            class="rounded-full border-[1.5px] border-[#18181f]/[0.14] bg-white px-5 py-2.5 text-[12.5px] font-bold text-[#18181f] disabled:opacity-50"
            @click="unpublish"
          >
            {{ isPublishing ? 'Dépublication…' : 'Dépublier' }}
          </button>
          <button
            type="button"
            class="rounded-full border-[1.5px] border-red-300 bg-white px-5 py-2.5 text-[12.5px] font-bold text-red-600 transition-colors hover:bg-red-50"
            @click="confirmingDelete = true"
          >
            Supprimer le contenu
          </button>
        </div>
      </StatsDataSettingsCard>
    </div>
  </div>
</template>
