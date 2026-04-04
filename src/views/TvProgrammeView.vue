<script setup lang="ts">
import { computed, ref } from 'vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppPromoBanner from '@/components/layout/AppPromoBanner.vue'
import TvProgrammeCardIcon from '@/components/tv/TvProgrammeCardIcon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import adBreakIcon from '@/assets/icons/tv/ad-break.svg'
import audienceHistoryIcon from '@/assets/icons/tv/audience-history.svg'
import reviewStarIcon from '@/assets/icons/tv/review-star.svg'
import { promoItems } from '@/data/brands/tvstats/promo-items'
import { getRelativeDate, getTvProgrammesForDate, toDateInputValue, type TvTimePreset } from '@/data/tv-programmes'

const presetOptions: Array<{ id: Exclude<TvTimePreset, 'custom'>; label: string }> = [
  { id: 'yesterday', label: 'Hier' },
  { id: 'live', label: 'En ce moment' },
  { id: 'tonight', label: 'Ce soir' },
  { id: 'tomorrow', label: 'Demain' },
]
const ratingStars = [1, 2, 3, 4, 5] as const

const selectedPreset = ref<TvTimePreset>('tonight')
const selectedDate = ref(toDateInputValue(getRelativeDate(0)))

const effectiveDate = computed(() => {
  const date = new Date(selectedDate.value)
  date.setHours(0, 0, 0, 0)

  if (selectedPreset.value === 'yesterday') {
    return getRelativeDate(-1)
  }

  if (selectedPreset.value === 'tomorrow') {
    return getRelativeDate(1)
  }

  if (selectedPreset.value === 'live' || selectedPreset.value === 'tonight') {
    return getRelativeDate(0)
  }

  return date
})

const displayedSchedules = computed(() => getTvProgrammesForDate(effectiveDate.value, selectedPreset.value))

const formattedDate = computed(() =>
  new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(effectiveDate.value),
)

const handlePresetSelect = (preset: Exclude<TvTimePreset, 'custom'>) => {
  selectedPreset.value = preset
  if (preset === 'yesterday') {
    selectedDate.value = toDateInputValue(getRelativeDate(-1))
  } else if (preset === 'tomorrow') {
    selectedDate.value = toDateInputValue(getRelativeDate(1))
  } else {
    selectedDate.value = toDateInputValue(getRelativeDate(0))
  }
}

const handleDateInput = (value: string) => {
  selectedDate.value = value
  selectedPreset.value = 'custom'
}
</script>

<template>
  <div class="brand-theme-tvstats min-h-screen text-slate-900">
    <AppPromoBanner :items="promoItems" />
    <AppHeader />

    <main class="pb-24 pt-28">
      <section class="section pt-4">
        <div class="container flex flex-col gap-6">
          <div class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)] sm:p-6">
            <div class="mb-6 flex flex-col gap-4">
              <p class="eyebrow text-tvstats-primary">Programme TV & analyse d’antenne</p>
              <div class="max-w-4xl">
                <h1 class="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
                  La grille TV enrichie par les signaux publicitaires et le contexte d’antenne.
                </h1>
                <p class="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                  Comparez les chaînes, identifiez les rendez-vous clés et repérez ce qui distingue vraiment un programme: son univers, sa durée, son statut éditorial, sa catégorie et, en complément, son niveau d’exposition publicitaire.
                </p>
              </div>
            </div>

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
                  @click="handlePresetSelect(preset.id)"
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
                  @input="handleDateInput(($event.target as HTMLInputElement).value)"
                />
              </label>

              <div class="flex items-center justify-between gap-4 xl:justify-end">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Date affichée</p>
                  <p class="mt-1 text-sm font-semibold capitalize text-slate-900">{{ formattedDate }}</p>
                </div>
                <AppButton variant="secondary" size="md" @click="handlePresetSelect('tonight')">
                  Revenir à ce soir
                </AppButton>
              </div>
            </div>
          </div>

          <div class="grid gap-5">
            <article
              v-for="channel in displayedSchedules"
              :key="channel.id"
              class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]"
            >
              <div class="flex flex-col gap-5">
                <div class="flex items-center gap-4">
                  <div class="flex h-14 min-w-14 items-center justify-center rounded-[1.25rem] px-3 text-sm font-bold uppercase tracking-[0.12em]" :class="channel.toneClass">
                    {{ channel.name }}
                  </div>
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Chaîne</p>
                    <h2 class="text-2xl font-semibold tracking-[-0.03em] text-slate-950">{{ channel.name }}</h2>
                  </div>
                </div>

                <div class="grid gap-4 xl:grid-cols-2">
                  <article
                    v-for="programme in channel.programmes"
                    :key="`${channel.id}-${programme.title}-${programme.startsAt}`"
                    class="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50"
                  >
                    <img :src="programme.image" :alt="programme.imageAlt" class="h-44 w-full object-cover" loading="lazy" />

                    <div class="p-5">
                      <div class="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-tvstats-primary">
                            {{ programme.startsAt }} - {{ programme.endsAt }}
                          </p>
                          <h3 class="mt-2 text-xl font-semibold text-slate-950">{{ programme.title }}</h3>
                        </div>
                        <span class="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          {{ programme.durationMinutes }} min
                        </span>
                      </div>

                      <div class="mt-4 flex flex-wrap gap-2">
                        <span class="inline-flex items-center gap-2 rounded-full border border-tvstats-primary/15 bg-tvstats-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-tvstats-dark">
                          <TvProgrammeCardIcon kind="programme" class="h-4 w-4" />
                          {{ programme.category }}
                        </span>
                        <span class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                          <TvProgrammeCardIcon kind="programme" class="h-4 w-4" />
                          {{ programme.type }}
                        </span>
                      </div>

                      <p class="mt-4 text-sm leading-7 text-slate-600">
                        {{ programme.description }}
                      </p>

                      <div class="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-200/80 pt-4 text-xs text-slate-500">
                        <span class="inline-flex items-center gap-2.5 font-semibold uppercase tracking-[0.16em] text-slate-400">
                          <img :src="adBreakIcon" alt="" class="h-6 w-6" />
                          Repères pub
                        </span>
                        <span>{{ programme.avgAdBreaks }} coupures moyennes</span>
                        <span class="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" aria-hidden="true"></span>
                        <span>{{ programme.avgAdMinutes }} min au total</span>
                      </div>

                      <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                        <span class="inline-flex items-center gap-2.5 font-semibold uppercase tracking-[0.16em] text-slate-400">
                          <img :src="reviewStarIcon" alt="" class="h-5 w-5" />
                          Avis
                        </span>
                        <span class="inline-flex items-center gap-1">
                          <img
                            v-for="star in ratingStars"
                            :key="star"
                            :src="reviewStarIcon"
                            alt=""
                            class="h-4.5 w-4.5"
                            :class="star <= programme.reviewScore ? 'opacity-100' : 'opacity-30'"
                          />
                        </span>
                        <span>{{ programme.reviewScore }}/5</span>
                      </div>

                      <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                        <span class="inline-flex items-center gap-2.5 font-semibold uppercase tracking-[0.16em] text-slate-400">
                          <img :src="audienceHistoryIcon" alt="" class="h-5 w-5" />
                          Anciennes émissions
                        </span>
                        <span>Audience moyenne archive</span>
                        <span class="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" aria-hidden="true"></span>
                        <span>{{ programme.archiveAudience }}</span>
                      </div>
                    </div>
                  </article>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>
    </main>

    <AppFooter />
  </div>
</template>

<style scoped>
.brand-theme-tvstats {
  --color-primary: var(--color-tvstats-primary);
  --color-secondary: var(--color-tvstats-soft);
  --color-accent: var(--color-tvstats-secondary);
  --app-body-background:
    linear-gradient(90deg, rgba(15, 23, 42, 0.04) 1px, transparent 1px),
    linear-gradient(180deg, rgba(15, 23, 42, 0.04) 1px, transparent 1px),
    radial-gradient(900px 480px at 15% -10%, rgba(22, 101, 52, 0.14), transparent 70%), #f7fcf8;
  --app-badge-border: rgba(22, 101, 52, 0.26);
  --app-badge-surface: rgba(134, 239, 172, 0.16);
  --app-badge-text: #14532d;
  background: var(--app-body-background);
}
</style>
