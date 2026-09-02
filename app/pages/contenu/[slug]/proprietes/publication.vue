<script setup lang="ts">
definePageMeta({
  layout: 'content-dashboard',
  middleware: ['auth'],
  ssr: false,
  title: 'Publication',
  robots: 'noindex,nofollow',
})

import { computed, onMounted, ref, watch } from 'vue'
import ContentDashboardHeader from '@/components/contents/dashboard/ContentDashboardHeader.vue'
import ContentComingSoonCard from '@/components/contents/dashboard/ContentComingSoonCard.vue'
import StatsDataSettingsCard from '@/components/statsdata/settings/StatsDataSettingsCard.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import { useContentDashboard } from '@/composables/useContentDashboard'
import { useMyChannels } from '@/composables/useMyChannels'

const { content, patch } = useContentDashboard()
const { channels, loading: channelsLoading, fetch: fetchChannels } = useMyChannels()

const publishedAs = ref<'user' | 'channel'>('user')
const channelId = ref<number | null>(null)
const saving = ref(false)

watch(
  content,
  (doc) => {
    if (!doc) return
    publishedAs.value = doc.published_as === 'channel' ? 'channel' : 'user'
    channelId.value = doc.channel_id ?? null
  },
  { immediate: true },
)

onMounted(fetchChannels)

const channelOptions = computed(() =>
  channels.value.map((c) => ({
    value: c.id as number,
    label: c.profile?.name ?? `Chaîne #${c.id}`,
  })),
)

const invalid = computed(() => publishedAs.value === 'channel' && !channelId.value)

function selectAuthor(kind: 'user' | 'channel') {
  publishedAs.value = kind
  if (kind === 'user') channelId.value = null
}

function onChannelChange(v: unknown) {
  const raw = Array.isArray(v) ? v[0] : v
  channelId.value = raw != null ? Number(raw) : null
}

async function save() {
  if (invalid.value) return
  saving.value = true
  try {
    await patch({
      published_as: publishedAs.value,
      channel_id: publishedAs.value === 'channel' ? channelId.value : null,
    })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <ContentDashboardHeader
      title="Publication"
      subtitle="Au nom de qui ce contenu paraît, et qui peut le voir."
      save-label="Enregistrer"
      :saving="saving"
      @save="save"
    />

    <div class="flex flex-col gap-5">
      <StatsDataSettingsCard
        title="Publier en tant que"
        description="Le contenu apparaît signé par votre profil ou par l'une de vos chaînes."
      >
        <div class="flex flex-col gap-2.5">
          <button
            type="button"
            class="flex items-center gap-3.5 rounded-xl border px-4 py-3.5 text-left transition-colors"
            :class="
              publishedAs === 'user'
                ? 'border-primary bg-primary/5'
                : 'border-[#18181f]/10 bg-white'
            "
            @click="selectAuthor('user')"
          >
            <span
              class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2"
              :class="publishedAs === 'user' ? 'border-primary' : 'border-[#18181f]/25'"
            >
              <span v-if="publishedAs === 'user'" class="h-[9px] w-[9px] rounded-full bg-primary" />
            </span>
            <span>
              <span class="block text-[13.5px] font-bold text-[#18181f]">En mon nom</span>
              <span class="mt-0.5 block text-[12.5px] text-[#18181f]/50"
                >Contenu lié à votre profil personnel.</span
              >
            </span>
          </button>

          <button
            type="button"
            class="flex items-center gap-3.5 rounded-xl border px-4 py-3.5 text-left transition-colors"
            :class="
              publishedAs === 'channel'
                ? 'border-primary bg-primary/5'
                : 'border-[#18181f]/10 bg-white'
            "
            @click="selectAuthor('channel')"
          >
            <span
              class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2"
              :class="publishedAs === 'channel' ? 'border-primary' : 'border-[#18181f]/25'"
            >
              <span
                v-if="publishedAs === 'channel'"
                class="h-[9px] w-[9px] rounded-full bg-primary"
              />
            </span>
            <span>
              <span class="block text-[13.5px] font-bold text-[#18181f]">Avec une chaîne</span>
              <span class="mt-0.5 block text-[12.5px] text-[#18181f]/50"
                >Contenu lié à l'une de vos chaînes éditoriales.</span
              >
            </span>
          </button>

          <div v-if="publishedAs === 'channel'" class="pt-1">
            <p v-if="channelsLoading" class="text-[13px] text-[#18181f]/50">
              Chargement de vos chaînes…
            </p>
            <AppSelect
              v-else-if="channelOptions.length"
              :model-value="channelId ?? null"
              :options="channelOptions"
              placeholder="Choisir une chaîne…"
              @update:model-value="onChannelChange"
            />
            <NuxtLink
              v-else
              to="/user/chaines?create=1"
              class="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:brightness-105"
            >
              Créer une chaîne
            </NuxtLink>
            <p v-if="invalid && channelOptions.length" class="mt-1.5 text-[11.5px] text-rose-600">
              Sélectionnez la chaîne de publication.
            </p>
          </div>
        </div>
      </StatsDataSettingsCard>

      <ContentComingSoonCard
        title="Options de publication"
        description="Commentaires, export des données, notification aux abonnés, intégration."
        note="Ces réglages seront pris en charge par l'API prochainement."
      >
        <div class="flex flex-col gap-3">
          <div
            v-for="opt in [
              'Commentaires',
              'Téléchargement des données',
              'Envoyer aux abonnés',
              'Intégration autorisée',
            ]"
            :key="opt"
            class="flex items-center justify-between gap-4"
          >
            <span class="text-[13.5px] font-semibold text-slate-500">{{ opt }}</span>
            <span class="h-6 w-[42px] rounded-full bg-slate-200" />
          </div>
        </div>
      </ContentComingSoonCard>

      <ContentComingSoonCard
        title="Date de publication"
        description="Programmer la mise en ligne à une date future."
        note="La publication différée n'est pas encore disponible."
      >
        <div class="h-11 w-44 rounded-[10px] border border-slate-200 bg-slate-50" />
      </ContentComingSoonCard>
    </div>
  </div>
</template>
