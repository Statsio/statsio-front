<script setup lang="ts">
import { RouterLink } from 'vue-router'
import AppSectionHeader from '@/components/ui/AppSectionHeader.vue'
import TvScheduleNowNext from '@/components/tv/TvScheduleNowNext.vue'
import TvAudiencesRankingTable from '@/components/tv/TvAudiencesRankingTable.vue'
import { useTvSchedule } from '@/composables/useTvSchedule'
import { useTvAudiences } from '@/composables/useTvAudiences'

const { schedules, referenceMinutes, currentLabel, selectPreset } = useTvSchedule()
selectPreset('live')

const { sortedYearData, selectedYear, maxPda, isLoading: audiencesLoading } = useTvAudiences()
</script>

<template>
  <section class="bg-white">
    <div class="container py-20">
      <AppSectionHeader eyebrow="En direct" title="Le programme, maintenant">
        <RouterLink
          to="/tvstats/programme-tv"
          class="text-sm font-semibold text-[var(--color-primary)] transition-opacity hover:opacity-70"
        >
          Voir toute la grille →
        </RouterLink>
      </AppSectionHeader>

      <div class="mt-10 grid gap-8 lg:grid-cols-[1.3fr_0.9fr] lg:items-stretch">
        <!--
          Sur lg+, la grille du programme (nombreuses chaînes) est bornée à la hauteur
          de la colonne audiences : le conteneur défilant est en position absolue pour
          ne pas peser sur la hauteur de la ligne, puis remplit la cellule étirée.
        -->
        <div class="flex min-h-0 flex-col">
          <p class="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Programme en direct
          </p>
          <div class="relative flex-1 lg:min-h-0">
            <div
              class="lg:absolute lg:inset-0 lg:overflow-y-auto lg:overscroll-contain lg:rounded-[2rem] [scrollbar-width:thin]"
            >
              <TvScheduleNowNext
                :schedules="schedules"
                :reference-minutes="referenceMinutes"
                :current-label="currentLabel"
              />
            </div>
          </div>
        </div>

        <div class="flex min-h-0 flex-col">
          <p class="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Classement audiences {{ selectedYear }}
          </p>
          <TvAudiencesRankingTable
            v-if="!audiencesLoading"
            :data="sortedYearData.slice(0, 6)"
            :year="selectedYear"
            :max-pda="maxPda"
          />
        </div>
      </div>
    </div>
  </section>
</template>
