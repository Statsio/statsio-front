<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import TvScheduleGrid from '@/components/tv/TvScheduleGrid.vue'
import { useTvSchedule } from '@/composables/useTvSchedule'
import type { TimePreset, TvProgramme } from '@/types/tv-schedule'

const router = useRouter()

function goToBroadcast(programme: TvProgramme) {
  if (programme.broadcastId != null) {
    router.push({ name: 'tvstats-broadcast', params: { id: programme.broadcastId } })
  }
}

const presetOptions: Array<{ id: Exclude<TimePreset, 'custom'>; label: string }> = [
  { id: 'yesterday', label: 'Hier' },
  { id: 'morning', label: 'Matin' },
  { id: 'afternoon', label: 'Après-midi' },
  { id: 'live', label: 'En ce moment' },
  { id: 'tonight', label: 'Ce soir' },
  { id: 'night', label: 'Nuit' },
  { id: 'tomorrow', label: 'Demain' },
]

const {
  schedules,
  isLoading,
  error,
  selectedPreset,
  selectedDate,
  timeWindow,
  now,
  formattedDate,
  load,
  selectPreset,
  selectDate,
} = useTvSchedule()

const mobileLogoFailed = ref<Record<string, boolean>>({})
</script>

<template>
  <main class="pb-24 pt-28">
    <section class="section pt-4">
      <div class="container flex flex-col gap-6">

        <!-- Header card -->
        <div class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)] sm:p-6">
          <div class="mb-6 flex flex-col gap-4">
            <p class="eyebrow text-tvstats-primary">Programme TV & analyse d'antenne</p>
            <div class="max-w-4xl">
              <h1 class="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
                La grille TV enrichie par les signaux publicitaires et le contexte d'antenne.
              </h1>
              <p class="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                Comparez les chaînes, identifiez les rendez-vous clés et repérez ce qui distingue vraiment un programme : son univers, sa durée, son statut éditorial, sa catégorie et, en complément, son niveau d'exposition publicitaire.
              </p>
            </div>
          </div>

          <!-- Filter bar -->
          <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px_auto] xl:items-end">
            <div class="flex flex-wrap gap-2">
              <button
                v-for="preset in presetOptions"
                :key="preset.id"
                type="button"
                class="rounded-full border px-4 py-2 text-sm font-semibold transition"
                :class="
                  selectedPreset === preset.id
                    ? 'border-tvstats-primary bg-tvstats-primary text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                "
                @click="selectPreset(preset.id)"
              >
                {{ preset.label }}
              </button>
            </div>

            <label class="flex flex-col gap-2">
              <span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Jour précis</span>
              <input
                :value="selectedDate"
                type="date"
                class="min-h-12 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-tvstats-primary/40 focus:bg-white focus:ring-4 focus:ring-tvstats-primary/10"
                @input="selectDate(($event.target as HTMLInputElement).value)"
              />
            </label>

            <div class="flex items-center justify-between gap-4 xl:justify-end">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Date affichée</p>
                <p class="mt-1 text-sm font-semibold capitalize text-slate-900">{{ formattedDate }}</p>
              </div>
              <AppButton variant="secondary" size="md" @click="selectPreset('tonight')">
                Revenir à ce soir
              </AppButton>
            </div>
          </div>
        </div>

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

        <template v-else>
          <!-- Desktop EPG grid -->
          <TvScheduleGrid
            class="hidden lg:block"
            :schedules="schedules"
            :time-window="timeWindow"
            :now="now"
          />

          <!-- Mobile: card list -->
          <div class="flex flex-col gap-4 lg:hidden">
            <article
              v-for="schedule in schedules"
              :key="schedule.channel.id"
              class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]"
            >
              <div class="mb-4 flex items-center gap-3">
                <div class="flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100 p-2">
                  <img
                    v-if="schedule.logoUrl && !mobileLogoFailed[schedule.channel.id]"
                    :src="schedule.logoUrl"
                    :alt="schedule.channel.displayName"
                    class="h-full w-full object-contain"
                    loading="lazy"
                    @error="mobileLogoFailed[schedule.channel.id] = true"
                  />
                  <div
                    v-else
                    class="flex h-full w-full items-center justify-center rounded-lg text-xs font-bold text-white"
                    :class="schedule.channel.fallbackBg"
                  >
                    {{ schedule.channel.displayName.slice(0, 3).toUpperCase() }}
                  </div>
                </div>
                <div>
                  <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Chaîne {{ schedule.channel.number }}
                  </p>
                  <h2 class="text-xl font-semibold tracking-[-0.03em] text-slate-950">
                    {{ schedule.channel.displayName }}
                  </h2>
                </div>
              </div>

              <div v-if="schedule.programmes.length > 0" class="flex flex-col gap-2">
                <div
                  v-for="programme in schedule.programmes.slice(0, 5)"
                  :key="programme.id"
                  class="flex gap-3 rounded-2xl border p-3 transition"
                  :class="[
                    programme.isLive
                      ? 'border-tvstats-primary/20 bg-tvstats-soft/30'
                      : 'border-slate-100 bg-slate-50',
                    programme.broadcastId != null ? 'cursor-pointer hover:shadow-sm' : '',
                  ]"
                  @click="goToBroadcast(programme)"
                >
                  <div class="w-14 shrink-0 text-right">
                    <p class="text-xs font-semibold text-tvstats-primary">{{ programme.startTime }}</p>
                    <p class="text-[10px] text-slate-400">{{ programme.durationMinutes }}min</p>
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <p class="truncate text-sm font-semibold text-slate-900">{{ programme.title }}</p>
                      <span
                        v-if="programme.isLive"
                        class="shrink-0 rounded-full bg-tvstats-primary px-1.5 py-0.5 text-[9px] font-semibold uppercase text-white"
                      >
                        LIVE
                      </span>
                    </div>
                    <p v-if="programme.genres.length" class="mt-0.5 text-[11px] text-slate-500">
                      {{ programme.genres.slice(0, 2).join(' · ') }}
                    </p>
                  </div>
                </div>
              </div>
              <p v-else class="text-sm text-slate-400">
                Programme non disponible pour cette chaîne.
              </p>
            </article>
          </div>
        </template>

      </div>
    </section>
  </main>
</template>
