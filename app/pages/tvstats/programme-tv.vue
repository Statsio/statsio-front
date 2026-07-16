<script setup lang="ts">
definePageMeta({
  layout: 'default',
  title: 'Programme TV',
  description: 'Consultez le programme TV du jour et de la semaine : grille horaire complète des chaînes TNT avec détails et critiques des émissions.',
})
import { computed, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import TvScheduleFilters, { type DisplayMode } from '@/components/tv/TvScheduleFilters.vue'
import TvScheduleCardView from '@/components/tv/TvScheduleCardView.vue'
import TvScheduleGrid from '@/components/tv/TvScheduleGrid.vue'
import TvScheduleEmptyState from '@/components/tv/TvScheduleEmptyState.vue'
import { useTvSchedule } from '@/composables/useTvSchedule'

const displayMode = ref<DisplayMode>('card')

const {
  schedules,
  isLoading,
  error,
  selectedPreset,
  selectedDate,
  timeWindow,
  referenceMinutes,
  currentLabel,
  now,
  formattedDate,
  load,
  selectPreset,
  selectDate,
} = useTvSchedule()

const isEmpty = computed(() => schedules.value.every((s) => s.programmes.length === 0))
</script>

<template>
  <main class="pb-24">
    <section class="section pt-4">
      <div class="container flex flex-col gap-6">

        <div class="max-w-3xl">
          <h1 class="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">Programme TV</h1>
          <p class="mt-3 text-base leading-7 text-slate-600">
            Tous les programmes, chaîne par chaîne, avec le score d'audience calculé à partir des téléspectateurs de TVStats qui ont déclaré vouloir regarder ou avoir déjà vu chaque programme.
          </p>
        </div>

        <TvScheduleFilters
          :selected-preset="selectedPreset"
          :selected-date="selectedDate"
          :display-mode="displayMode"
          @select-preset="selectPreset"
          @select-date="selectDate"
          @update:display-mode="displayMode = $event"
        />

        <p class="-mt-2 text-sm font-semibold capitalize text-slate-500">{{ formattedDate }}</p>

        <!-- Loading skeleton -->
        <div
          v-if="isLoading"
          class="animate-pulse rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]"
        >
          <div class="mb-4 h-8 w-48 rounded-full bg-slate-200" />
          <div v-for="i in 8" :key="i" class="mb-3 flex items-center gap-3">
            <div class="h-14 w-20 shrink-0 rounded-xl bg-slate-200" />
            <div class="flex flex-1 gap-2 overflow-hidden">
              <div class="h-14 w-48 shrink-0 rounded-xl bg-slate-100" />
              <div class="h-14 w-64 shrink-0 rounded-xl bg-slate-100" />
              <div class="h-14 w-32 shrink-0 rounded-xl bg-slate-100" />
              <div class="h-14 w-56 shrink-0 rounded-xl bg-slate-100" />
            </div>
          </div>
        </div>

        <!-- Error state -->
        <div
          v-else-if="error"
          class="flex flex-col items-center gap-4 rounded-[2rem] border border-red-200 bg-red-50 p-8 text-center"
        >
          <p class="text-sm font-semibold text-red-700">{{ error }}</p>
          <AppButton variant="outline" size="md" @click="load()">Réessayer</AppButton>
        </div>

        <!-- Empty state -->
        <TvScheduleEmptyState v-else-if="isEmpty" />

        <!-- Card view: now/next for all channels -->
        <TvScheduleCardView
          v-else-if="displayMode === 'card'"
          :schedules="schedules"
          :reference-minutes="referenceMinutes"
          :current-label="currentLabel"
        />

        <!-- Grid view: EPG timeline (horizontal scroll on mobile) -->
        <TvScheduleGrid
          v-else
          :schedules="schedules"
          :time-window="timeWindow"
          :now="now"
        />

      </div>
    </section>
  </main>
</template>
