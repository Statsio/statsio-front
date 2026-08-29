<script setup lang="ts">
definePageMeta({
  layout: 'content-dashboard',
  middleware: ['auth'],
  ssr: false,
  title: 'Contenu',
  robots: 'noindex,nofollow',
})

import { computed, onBeforeUnmount, ref, watch } from 'vue'
import ContentDashboardHeader from '@/components/contents/dashboard/ContentDashboardHeader.vue'
import ContentComingSoonCard from '@/components/contents/dashboard/ContentComingSoonCard.vue'
import StatsDataSettingsGeneralCard from '@/components/statsdata/settings/StatsDataSettingsGeneralCard.vue'
import StatsDataSettingsCategoriesCard from '@/components/statsdata/settings/StatsDataSettingsCategoriesCard.vue'
import StatsDataSettingsEmojiCard from '@/components/statsdata/settings/StatsDataSettingsEmojiCard.vue'
import StatsDataSettingsThumbnailCard from '@/components/statsdata/settings/StatsDataSettingsThumbnailCard.vue'
import StatsDataSettingsResponseDeadlineCard from '@/components/statsdata/settings/StatsDataSettingsResponseDeadlineCard.vue'
import StatsDataSettingsCard from '@/components/statsdata/settings/StatsDataSettingsCard.vue'
import { useContentDashboard } from '@/composables/useContentDashboard'

const { content, contentType, patch } = useContentDashboard()

const name = ref('')
const description = ref('')
const slug = ref('')
const categories = ref<string[]>([])
const emoji = ref<string | null>(null)
const responseDeadline = ref<string | null>(null)

const persistedThumbnailUrl = ref<string | null>(null)
const pendingThumbnailFile = ref<File | null>(null)
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
    emoji.value = doc.emoji ?? null
    responseDeadline.value = doc.response_deadline ? doc.response_deadline.slice(0, 10) : null
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

function onThumbnailSelect(file: File) {
  if (pendingPreviewUrl.value) URL.revokeObjectURL(pendingPreviewUrl.value)
  pendingThumbnailFile.value = file
  removeThumbnail.value = false
  pendingPreviewUrl.value = URL.createObjectURL(file)
}

function onThumbnailRemove() {
  if (pendingPreviewUrl.value) URL.revokeObjectURL(pendingPreviewUrl.value)
  pendingThumbnailFile.value = null
  pendingPreviewUrl.value = null
  removeThumbnail.value = true
}

onBeforeUnmount(() => {
  if (pendingPreviewUrl.value) URL.revokeObjectURL(pendingPreviewUrl.value)
})

async function save() {
  if (slugError.value) return
  saving.value = true
  try {
    const ok = await patch(
      {
        title: name.value,
        description: description.value || null,
        slug: slug.value || undefined,
        categories: categories.value,
        emoji: emoji.value,
        ...(contentType.value === 'survey' ? { response_deadline: responseDeadline.value } : {}),
      },
      pendingThumbnailFile.value,
      removeThumbnail.value,
    )
    if (ok) {
      if (pendingPreviewUrl.value) URL.revokeObjectURL(pendingPreviewUrl.value)
      pendingThumbnailFile.value = null
      pendingPreviewUrl.value = null
      removeThumbnail.value = false
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
            statsio.fr/data/
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
        :preview-url="thumbnailPreviewUrl"
        @select="onThumbnailSelect"
        @remove="onThumbnailRemove"
      />

      <StatsDataSettingsCategoriesCard v-model="categories" />

      <StatsDataSettingsEmojiCard v-model="emoji" />

      <StatsDataSettingsResponseDeadlineCard
        v-if="contentType === 'survey'"
        v-model="responseDeadline"
      />

      <ContentComingSoonCard
        title="Mots-clés"
        description="Des étiquettes libres pour affiner la recherche et les contenus liés."
        note="La gestion des mots-clés arrivera dans une prochaine version."
      >
        <div class="flex flex-wrap gap-2">
          <span
            v-for="tag in ['sécheresse', 'nappes', 'départements']"
            :key="tag"
            class="rounded-full bg-primary/10 px-3 py-1.5 text-[12px] font-bold text-primary"
          >
            {{ tag }}
          </span>
        </div>
      </ContentComingSoonCard>
    </div>
  </div>
</template>
