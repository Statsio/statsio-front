<script setup lang="ts">
definePageMeta({ layout: 'default' })
import { computed, onMounted } from 'vue'
import TvChannelBanner from '@/components/tv/TvChannelBanner.vue'
import TvProgrammeCard from '@/components/tv/TvProgrammeCard.vue'
import TvScheduleGrid from '@/components/tv/TvScheduleGrid.vue'
import TvPopularProgrammeCard from '@/components/tv/TvPopularProgrammeCard.vue'
import { useChannelDetail, type ChannelTab } from '@/composables/useChannelDetail'
import { useNowNext } from '@/composables/useNowNext'
import type { TvProgramme } from '@/types/tv-schedule'

const {
  auth,
  detail,
  schedule,
  popularProgrammes,
  isLoading,
  isToggling,
  tab,
  staticChannel,
  logoUrl,
  now,
  referenceMinutes,
  load,
  toggleFollow,
} = useChannelDetail()

usePageSeo({
  title: computed(() => detail.value?.displayName),
  description: computed(() => detail.value?.description ?? undefined),
})

const TABS: Array<{ id: ChannelTab; label: string }> = [
  { id: 'now', label: 'En ce moment' },
  { id: 'grid', label: 'Programme du jour' },
  { id: 'popular', label: 'Programmes populaires' },
]

const { rows } = useNowNext(() => (schedule.value ? [schedule.value] : []), () => referenceMinutes.value)

const nowCards = computed(() => {
  const row = rows.value[0]
  if (!row) return []
  const list: { programme: TvProgramme; slotLabel: string; highlightSlot: boolean }[] = []
  if (row.current) list.push({ programme: row.current, slotLabel: 'En ce moment', highlightSlot: true })
  if (row.next) list.push({ programme: row.next, slotLabel: 'Ensuite', highlightSlot: false })
  return list
})

const fullDayWindow = { startMinutes: 0, endMinutes: 24 * 60, label: 'Programme du jour' }

onMounted(() => load())
</script>

<template>
  <main class="pb-24">
    <section class="section pt-8">
      <div class="container flex flex-col gap-6">

        <!-- Loading -->
        <div v-if="isLoading" class="flex items-center justify-center py-24">
          <div class="h-8 w-8 animate-spin rounded-full border-2 border-tvstats-primary border-t-transparent" />
        </div>

        <template v-else-if="detail">
          <TvChannelBanner
            :detail="detail"
            :static-channel="staticChannel"
            :logo-url="logoUrl"
            :is-toggling="isToggling"
            :is-authenticated="auth.isAuthenticated"
            @toggle-follow="toggleFollow"
          />

          <!-- Tabs -->
          <div class="flex flex-wrap gap-2">
            <button
              v-for="t in TABS"
              :key="t.id"
              type="button"
              class="rounded-full px-4 py-2 text-[13.5px] font-bold transition"
              :class="tab === t.id ? 'bg-slate-950 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'"
              @click="tab = t.id"
            >
              {{ t.label }}
            </button>
          </div>

          <!-- Now / next -->
          <div v-if="tab === 'now'" class="flex flex-wrap gap-4">
            <TvProgrammeCard
              v-for="c in nowCards"
              :key="c.programme.id"
              class="min-w-[260px] flex-1"
              :programme="c.programme"
              :slot-label="c.slotLabel"
              :highlight-slot="c.highlightSlot"
            />
            <p v-if="nowCards.length === 0" class="text-sm text-slate-400">
              Programme non disponible pour cette chaîne.
            </p>
          </div>

          <!-- Grid: today's full schedule for this channel -->
          <TvScheduleGrid
            v-else-if="tab === 'grid' && schedule"
            :schedules="[schedule]"
            :time-window="fullDayWindow"
            :now="now"
          />

          <!-- Popular programmes -->
          <div v-else-if="tab === 'popular'" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <TvPopularProgrammeCard
              v-for="p in popularProgrammes"
              :key="p.programId"
              :programme="p"
            />
            <p v-if="popularProgrammes.length === 0" class="text-sm text-slate-400">
              Pas encore assez de données d'audience pour cette chaîne.
            </p>
          </div>
        </template>

      </div>
    </section>
  </main>
</template>
