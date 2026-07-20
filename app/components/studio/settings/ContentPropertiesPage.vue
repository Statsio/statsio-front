<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchStatsDataDocument, saveStatsDataDocument, deleteStatsDataDocument } from '@/api/studio'
import { CONTENT_TYPE_META } from '@/lib/content-display'
import type { ContentVisibility } from '@/types/studio'
import StatsDataSettingsBreadcrumb from '@/components/statsdata/settings/StatsDataSettingsBreadcrumb.vue'
import StatsDataSettingsHeader from '@/components/statsdata/settings/StatsDataSettingsHeader.vue'
import StatsDataSettingsGeneralCard from '@/components/statsdata/settings/StatsDataSettingsGeneralCard.vue'
import StatsDataSettingsThumbnailCard from '@/components/statsdata/settings/StatsDataSettingsThumbnailCard.vue'
import StatsDataSettingsCategoriesCard from '@/components/statsdata/settings/StatsDataSettingsCategoriesCard.vue'
import StatsDataSettingsResponseDeadlineCard from '@/components/statsdata/settings/StatsDataSettingsResponseDeadlineCard.vue'
import StatsDataSettingsEmojiCard from '@/components/statsdata/settings/StatsDataSettingsEmojiCard.vue'
import StatsDataSettingsVisibilityCard from '@/components/statsdata/settings/StatsDataSettingsVisibilityCard.vue'
import StatsDataSettingsStudioCard from '@/components/statsdata/settings/StatsDataSettingsStudioCard.vue'
import StatsDataSettingsDangerZoneCard from '@/components/statsdata/settings/StatsDataSettingsDangerZoneCard.vue'

const route = useRoute()
const router = useRouter()
const id = String(route.params.slug ?? '')

const loading = ref(true)
const error = ref<string | null>(null)
const isSaving = ref(false)
const isSaved = ref(false)
const isDeleting = ref(false)

const docType = ref<'statsdata' | 'article' | 'survey'>('statsdata')
const docSlug = ref('')
const ownerName = ref('')

const name = ref('')
const description = ref('')
const visibility = ref<ContentVisibility>('private')
const categories = ref<string[]>([])
const emoji = ref<string | null>(null)
const responseDeadline = ref<string | null>(null)

const persistedThumbnailUrl = ref<string | null>(null)
const pendingThumbnailFile = ref<File | null>(null)
const removeThumbnail = ref(false)
const pendingPreviewUrl = ref<string | null>(null)

const studioPath = computed(() => `/studio/${docType.value}/${docSlug.value || id}`)
const subtitle = computed(() => `${CONTENT_TYPE_META[docType.value].label} · ${ownerName.value}`)
const thumbnailPreviewUrl = computed(() => pendingPreviewUrl.value ?? (removeThumbnail.value ? null : persistedThumbnailUrl.value))

onMounted(async () => {
  try {
    const doc = await fetchStatsDataDocument(id)
    name.value = doc.title
    description.value = doc.description ?? ''
    visibility.value = doc.visibility ?? 'private'
    categories.value = doc.categories ?? []
    emoji.value = doc.emoji ?? null
    responseDeadline.value = doc.response_deadline ? doc.response_deadline.slice(0, 10) : null
    docType.value = doc.type ?? 'statsdata'
    docSlug.value = doc.slug ?? id
    ownerName.value = `${doc.author?.name ?? 'Anonyme'} · ${doc.published_as === 'channel' ? 'Chaîne' : 'Perso'}`
    persistedThumbnailUrl.value = doc.thumbnail_url ?? null
  } catch {
    error.value = 'Document introuvable.'
  } finally {
    loading.value = false
  }
})

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
  isSaving.value = true
  try {
    const updated = await saveStatsDataDocument(
      id,
      {
        title: name.value,
        description: description.value || null,
        visibility: visibility.value,
        categories: categories.value,
        emoji: emoji.value,
        response_deadline: responseDeadline.value,
      },
      pendingThumbnailFile.value,
      removeThumbnail.value,
    )

    if (pendingPreviewUrl.value) URL.revokeObjectURL(pendingPreviewUrl.value)
    persistedThumbnailUrl.value = updated?.thumbnail_url ?? null
    pendingThumbnailFile.value = null
    pendingPreviewUrl.value = null
    removeThumbnail.value = false

    isSaved.value = true
    setTimeout(() => { isSaved.value = false }, 2500)
  } finally {
    isSaving.value = false
  }
}

async function confirmDelete() {
  isDeleting.value = true
  try {
    await deleteStatsDataDocument(id)
    router.push('/contenus')
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <main class="pb-24 pt-4">
    <section class="section pb-10">
      <div class="container max-w-3xl flex flex-col gap-6">

        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center py-32">
          <svg class="w-8 h-8 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="py-24 text-center text-slate-500">
          <p>{{ error }}</p>
        </div>

        <template v-else>
          <StatsDataSettingsBreadcrumb />

          <StatsDataSettingsHeader
            :subtitle="subtitle"
            :is-saving="isSaving"
            :is-saved="isSaved"
            @save="save"
          />

          <StatsDataSettingsGeneralCard v-model:name="name" v-model:description="description" />

          <StatsDataSettingsCategoriesCard v-model="categories" />

          <StatsDataSettingsResponseDeadlineCard v-if="docType === 'survey'" v-model="responseDeadline" />

          <StatsDataSettingsEmojiCard v-model="emoji" />

          <StatsDataSettingsThumbnailCard
            :preview-url="thumbnailPreviewUrl"
            @select="onThumbnailSelect"
            @remove="onThumbnailRemove"
          />

          <StatsDataSettingsVisibilityCard v-model="visibility" />

          <StatsDataSettingsStudioCard :studio-path="studioPath" />

          <StatsDataSettingsDangerZoneCard
            :content-name="name"
            :is-deleting="isDeleting"
            @confirm="confirmDelete"
          />
        </template>
      </div>
    </section>
  </main>
</template>
