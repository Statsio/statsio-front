<script setup lang="ts">
definePageMeta({
  layout: 'content-dashboard',
  middleware: ['auth'],
  ssr: false,
  title: 'Contenu',
  robots: 'noindex,nofollow',
})

import { computed, ref, watch } from 'vue'
import ContentDashboardHeader from '@/components/contents/dashboard/ContentDashboardHeader.vue'
import StatsDataSettingsGeneralCard from '@/components/statsdata/settings/StatsDataSettingsGeneralCard.vue'
import StatsDataSettingsCategoriesCard from '@/components/statsdata/settings/StatsDataSettingsCategoriesCard.vue'
import StatsDataSettingsThumbnailCard from '@/components/statsdata/settings/StatsDataSettingsThumbnailCard.vue'
import StatsDataSettingsCardVisualCard from '@/components/statsdata/settings/StatsDataSettingsCardVisualCard.vue'
import StatsDataSettingsResponseDeadlineCard from '@/components/statsdata/settings/StatsDataSettingsResponseDeadlineCard.vue'
import StatsDataSettingsSurveyKindCard from '@/components/statsdata/settings/StatsDataSettingsSurveyKindCard.vue'
import StatsDataSettingsIdentityCard from '@/components/statsdata/settings/StatsDataSettingsIdentityCard.vue'
import StatsDataSettingsCard from '@/components/statsdata/settings/StatsDataSettingsCard.vue'
import DossierPicker from '@/components/studio/DossierPicker.vue'
import type { SurveyKind } from '@/types/content-creation'
import { normalizeSubBrand, type SubBrand } from '@/types/sub-brand'
import { publicContentPath } from '@/lib/content-display'
import { useContentDashboard } from '@/composables/useContentDashboard'
import { syncContentDossiers } from '@/api/dossiers'

const { content, contentType, patch, slugOrId } = useContentDashboard()

/** Contenus qui affichent une miniature sur leur page publique et leurs cartes. */
const showThumbnail = computed(() => contentType.value !== 'survey')

/** Préfixe d'URL publique réel du type courant (ex. « statsio.fr/sondages/ »). */
const slugPrefix = computed(
  () => `statsio.fr${publicContentPath(contentType.value, '').replace(/\/+$/, '')}/`,
)

const name = ref('')
const description = ref('')
const slug = ref('')
const categories = ref<string[]>([])
const domain = ref<SubBrand>('statsio')
const dossierIds = ref<number[]>([])
const cardBlockId = ref<string | null>(null)
const responseDeadline = ref<string | null>(null)
const surveyKind = ref<SurveyKind>('single_question')
const requiresIdentity = ref(false)

const persistedThumbnailUrl = ref<string | null>(null)
const pendingThumbnailMediaId = ref<number | null>(null)
const removeThumbnail = ref(false)
const pendingPreviewUrl = ref<string | null>(null)

const saving = ref(false)

watch(
  content,
  (doc) => {
    if (!doc) return
    name.value = doc.title
    description.value = doc.description ?? ''
    slug.value = doc.slug ?? ''
    categories.value = [...(doc.categories ?? [])]
    domain.value = normalizeSubBrand(doc.sub_brand)
    dossierIds.value = (doc.dossiers ?? []).map((d) => d.id)
    cardBlockId.value = doc.card_block_id ?? null
    responseDeadline.value = doc.response_deadline ? doc.response_deadline.slice(0, 10) : null
    surveyKind.value = doc.survey_kind ?? 'single_question'
    requiresIdentity.value = doc.requires_identity_verification ?? false
    persistedThumbnailUrl.value = doc.thumbnail_url ?? null
  },
  { immediate: true },
)

const thumbnailPreviewUrl = computed(
  () => pendingPreviewUrl.value ?? (removeThumbnail.value ? null : persistedThumbnailUrl.value),
)

const slugError = computed(() =>
  slug.value && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.value)
    ? 'Uniquement des minuscules, chiffres et tirets.'
    : '',
)

function onThumbnailSelect(media: { id: number; url: string }) {
  pendingThumbnailMediaId.value = media.id
  removeThumbnail.value = false
  pendingPreviewUrl.value = media.url
}

function onThumbnailRemove() {
  pendingThumbnailMediaId.value = null
  pendingPreviewUrl.value = null
  removeThumbnail.value = true
}

async function save() {
  if (slugError.value) return
  saving.value = true
  // Figé maintenant : `patch()` réassigne `content`, ce qui refait passer le
  // watch ci-dessus et réécrit `dossierIds` avec l'état serveur (pré-sync).
  const selectedDossierIds = [...dossierIds.value]
  try {
    const ok = await patch(
      {
        title: name.value,
        description: description.value || null,
        slug: slug.value || undefined,
        categories: categories.value,
        sub_brand: domain.value,
        ...(contentType.value === 'statsdata' ? { card_block_id: cardBlockId.value } : {}),
        ...(contentType.value === 'survey'
          ? {
              response_deadline: responseDeadline.value,
              survey_kind: surveyKind.value,
              requires_identity_verification: requiresIdentity.value,
            }
          : {}),
      },
      pendingThumbnailMediaId.value,
      removeThumbnail.value,
    )
    if (ok) {
      pendingThumbnailMediaId.value = null
      pendingPreviewUrl.value = null
      removeThumbnail.value = false
    }

    const id = String(slugOrId.value)
    if (id) {
      const updated = await syncContentDossiers(id, selectedDossierIds)
      dossierIds.value = updated.map((d) => d.id)
      if (content.value) {
        content.value.dossiers = updated.map((d) => ({
          id: d.id,
          slug: d.slug,
          name: d.name,
          image_url: d.imageUrl ?? null,
        }))
      }
    }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <ContentDashboardHeader
      title="Contenu"
      subtitle="Titre, description, adresse et classement de la page."
      save-label="Enregistrer"
      :saving="saving"
      @save="save"
    />

    <div class="flex flex-col gap-5">
      <StatsDataSettingsGeneralCard v-model:name="name" v-model:description="description" />

      <StatsDataSettingsCard
        title="Adresse de la page"
        description="L'identifiant unique du contenu dans son URL publique."
      >
        <div
          class="flex items-center overflow-hidden rounded-[10px] border-[1.5px]"
          :class="slugError ? 'border-rose-300' : 'border-[#18181f]/[0.14]'"
        >
          <span
            class="shrink-0 border-r-[1.5px] border-[#18181f]/10 bg-slate-50 px-3 py-3 font-mono text-[12px] text-[#18181f]/45"
          >
            {{ slugPrefix }}
          </span>
          <input
            v-model="slug"
            type="text"
            spellcheck="false"
            class="min-w-0 flex-1 px-3.5 py-3 font-mono text-[12.5px] text-[#18181f] outline-none"
          />
        </div>
        <p v-if="slugError" class="mt-1.5 text-[11.5px] text-rose-600">{{ slugError }}</p>
        <p v-else class="mt-1.5 text-[11.5px] text-[#18181f]/45">
          Changer l'adresse casse les liens déjà partagés vers l'ancienne.
        </p>
      </StatsDataSettingsCard>

      <StatsDataSettingsThumbnailCard
        v-if="showThumbnail"
        :preview-url="thumbnailPreviewUrl"
        @select="onThumbnailSelect"
        @remove="onThumbnailRemove"
      />

      <StatsDataSettingsCategoriesCard v-model:categories="categories" v-model:domain="domain" />

      <StatsDataSettingsCard
        title="Dossiers"
        description="Rangez ce contenu dans un ou plusieurs dossiers éditoriaux suivis."
      >
        <DossierPicker
          v-if="content?.slug || content?.id"
          v-model="dossierIds"
          :document-id="String(slugOrId)"
          :seed-from-current="false"
        />
      </StatsDataSettingsCard>

      <StatsDataSettingsCardVisualCard
        v-if="contentType === 'statsdata' && content?.slug"
        v-model="cardBlockId"
        :slug="content.slug"
        :categories="categories"
      />

      <template v-if="contentType === 'survey'">
        <StatsDataSettingsSurveyKindCard v-model="surveyKind" />
        <StatsDataSettingsResponseDeadlineCard v-model="responseDeadline" />
        <StatsDataSettingsIdentityCard v-model="requiresIdentity" />
      </template>
    </div>
  </div>
</template>
