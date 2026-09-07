<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ChannelEntry } from '@/data/channels'
import { resolveChannelColors } from '@/lib/channel-brand'
import { formatCatalogCount } from '@/lib/catalog-format'
import { formatCompactNumber } from '@/lib/format'
import ChannelShareModal from '@/components/channels/detail/ChannelShareModal.vue'

const props = defineProps<{
  channel: ChannelEntry
  isOwner: boolean
  isFollowing: boolean
  isVerified: boolean
  categoryLabels: string[]
  articlesCount: number
  statsDataCount: number
  surveysCount: number
}>()

const emit = defineEmits<{ 'toggle-follow': [] }>()

const colors = computed(() =>
  resolveChannelColors(props.channel.slug, props.channel.customColorPrimary, props.channel.customColorSecondary),
)
const heroGradient = computed(() => `linear-gradient(120deg, ${colors.value.primary}, ${colors.value.secondary})`)

const themeLabel = computed(() => props.categoryLabels.join(' · ').toUpperCase() || 'CHAÎNE ÉDITORIALE')

const stats = computed(() => [
  { label: 'Abonnés', value: formatCompactNumber(props.channel.followers) },
  { label: 'Vues', value: formatCompactNumber(props.channel.viewCount ?? 0) },
  { label: 'Articles', value: formatCatalogCount(props.articlesCount) },
  { label: 'StatsData', value: formatCatalogCount(props.statsDataCount) },
  { label: 'Sondages', value: formatCatalogCount(props.surveysCount) },
])

const isShareOpen = ref(false)
</script>

<template>
  <section class="relative overflow-hidden text-white" :style="{ background: heroGradient }">
    <div class="relative mx-auto max-w-[1240px] px-4 pt-4 sm:px-6 lg:px-8">
      <nav class="mb-4 flex flex-wrap items-center gap-2 text-[12.5px] font-semibold" aria-label="Fil d'Ariane">
        <NuxtLink to="/chaines" class="text-white/70 transition-colors hover:text-white">Chaînes</NuxtLink>
        <span class="text-white/40" aria-hidden="true">/</span>
        <span class="min-w-0 truncate text-white">{{ channel.name }}</span>
      </nav>
    </div>

    <div class="relative h-[130px] w-full sm:h-[180px]">
      <img v-if="channel.bannerUrl" :src="channel.bannerUrl" alt="" class="h-full w-full object-cover" />
      <div class="absolute inset-0" :style="{ background: 'linear-gradient(120deg,rgba(0,0,0,0.12),rgba(0,0,0,0) 60%)' }" />
    </div>

    <div class="relative mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
      <div class="flex flex-wrap items-end gap-5 pb-6 pt-3.5">
        <span
          class="-mt-12 flex h-[88px] w-[88px] shrink-0 items-center justify-center overflow-hidden rounded-[18px] border-4 border-white/15 text-[26px] font-extrabold sm:-mt-[58px]"
          :style="{ background: heroGradient }"
        >
          <img v-if="channel.logoUrl" :src="channel.logoUrl" alt="" class="h-full w-full object-cover" />
          <span v-else>{{ channel.initials }}</span>
        </span>

        <div class="min-w-[260px] flex-1">
          <div class="mb-1.5 flex flex-wrap items-center gap-2.5">
            <span class="mono rounded-[5px] bg-white/95 px-2 py-1 text-[9.5px] font-semibold tracking-[0.09em] text-slate-900">
              {{ themeLabel }}
            </span>
          </div>
          <div class="flex items-center gap-2.5">
            <h1 class="text-[28px] font-extrabold leading-[1.05] tracking-[-0.02em] sm:text-[34px]">{{ channel.name }}</h1>
            <span v-if="isVerified" class="text-[16px] text-sky-200" title="Chaîne vérifiée">✔</span>
          </div>
          <div class="mono mt-1.5 text-[12px] text-white/60">{{ channel.handle }}</div>
          <p v-if="channel.description" class="mt-3 max-w-[56ch] text-[14.5px] leading-[1.6] text-white/75 text-pretty">
            {{ channel.description }}
          </p>
        </div>

        <div class="flex shrink-0 items-center gap-2.5">
          <NuxtLink
            v-if="isOwner"
            :to="`/channels/${channel.slug}/dashboard/profil`"
            class="rounded-full border-[1.5px] border-white bg-white px-6 py-3 text-[13px] font-extrabold tracking-[0.03em] text-slate-900 transition hover:bg-white/90"
          >
            Modifier le profil
          </NuxtLink>
          <button
            v-else
            type="button"
            class="rounded-full border-[1.5px] px-6 py-3 text-[13px] font-extrabold tracking-[0.03em] transition"
            :class="
              isFollowing
                ? 'border-white/40 bg-white/15 text-white/90 hover:bg-white/20'
                : 'border-white bg-white text-slate-900 hover:bg-white/90'
            "
            @click="emit('toggle-follow')"
          >
            {{ isFollowing ? '✔ Abonné' : "S’abonner" }}
          </button>
          <button
            type="button"
            title="Partager la chaîne"
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[1.5px] border-white/40 bg-white/10 text-white transition hover:bg-white/20"
            @click="isShareOpen = true"
          >
            <span class="sr-only">Partager la chaîne</span>
            <svg viewBox="0 0 20 20" fill="none" class="h-4 w-4" aria-hidden="true">
              <path
                d="M14 7a2 2 0 100-4 2 2 0 000 4zM6 12a2 2 0 100-4 2 2 0 000 4zm8 7a2 2 0 100-4 2 2 0 000 4zM7.7 10.9l4.6 2.9M12.3 6.2 7.7 9.1"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <div class="flex flex-wrap gap-x-9 gap-y-4 border-t border-white/15 py-5">
        <div v-for="s in stats" :key="s.label">
          <div class="text-[9.5px] font-extrabold uppercase tracking-[0.09em] text-white/50">{{ s.label }}</div>
          <div class="mono mt-1.5 text-[18px] font-semibold tracking-[-0.01em]">{{ s.value }}</div>
        </div>
      </div>
    </div>

    <ChannelShareModal v-model:open="isShareOpen" :channel-name="channel.name" />
  </section>
</template>
