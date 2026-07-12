<script setup lang="ts">
import { computed } from 'vue'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { channelCategoryLabels, type Channel } from '@/api/channels'
import { formatCompactNumber } from '@/lib/format'

const props = defineProps<{
  channel: Channel
}>()

const profile = computed(() => props.channel.profile)

const initials = computed(() =>
  (profile.value?.name ?? '')
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase(),
)

const categoryLabels = computed(() =>
  (profile.value?.categories ?? []).map((slug) => channelCategoryLabels[slug] ?? slug),
)

const handle = computed(() => profile.value?.handle ?? '')
const detailPath = computed(() => `/channels/${encodeURIComponent(handle.value)}`)
</script>

<template>
  <article
    class="group flex h-full flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)] transition hover:-translate-y-1 hover:border-primary/20"
  >
    <div class="relative h-28 shrink-0 overflow-hidden bg-slate-950">
      <img
        v-if="profile?.banner_url"
        :src="profile.banner_url"
        :alt="`Bannière ${profile.name}`"
        class="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
      />
      <div v-else class="h-full w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950" />

      <AppAvatar
        :src="profile?.logo_url ?? undefined"
        :initials="initials"
        :alt="`Logo ${profile?.name ?? ''}`"
        size="lg"
        class="absolute -bottom-6 left-5 border-4 border-white"
      />
    </div>

    <div class="flex flex-1 flex-col gap-4 px-5 pb-5 pt-9">
      <div class="min-w-0">
        <h2 class="truncate text-xl font-semibold tracking-[-0.03em] text-slate-950">
          {{ profile?.name }}
        </h2>
        <p class="truncate text-sm font-medium text-slate-400">@{{ handle }}</p>
      </div>

      <p v-if="profile?.description" class="line-clamp-2 text-sm leading-6 text-slate-600">
        {{ profile.description }}
      </p>

      <div v-if="categoryLabels.length" class="flex flex-wrap gap-2">
        <span
          v-for="label in categoryLabels.slice(0, 3)"
          :key="label"
          class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600"
        >
          {{ label }}
        </span>
      </div>

      <div class="mt-auto grid grid-cols-2 gap-3 pt-1">
        <div class="rounded-[1.25rem] bg-slate-950 px-4 py-3 text-white">
          <p class="text-[11px] uppercase tracking-[0.16em] text-slate-400">Abonnés</p>
          <p class="mt-1 text-lg font-semibold">{{ formatCompactNumber(profile?.subscriber_count ?? 0) }}</p>
        </div>
        <div class="rounded-[1.25rem] bg-slate-50 px-4 py-3">
          <p class="text-[11px] uppercase tracking-[0.16em] text-slate-400">Vues</p>
          <p class="mt-1 text-lg font-semibold text-slate-950">{{ formatCompactNumber(profile?.view_count ?? 0) }}</p>
        </div>
      </div>

      <AppButton as="router-link" :to="detailPath" variant="secondary" size="md" full-width>
        Voir la chaîne
      </AppButton>
    </div>
  </article>
</template>
