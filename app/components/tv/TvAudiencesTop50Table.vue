<script setup lang="ts">
import { ref } from 'vue'
import type { Top50Record } from '@/types/tv-audiences'
import { TNT_CHANNELS } from '@/data/tnt-channels'

defineProps<{ records: Top50Record[] }>()

const logoFailed = ref<Record<string, boolean>>({})

const CATEGORY_LABELS: Record<string, string> = {
  sport:         'Sport',
  fiction:       'Fiction',
  info:          'Info',
  divertissement:'Divertissement',
  film:          'Film',
}

const CATEGORY_COLORS: Record<string, string> = {
  sport:         'text-blue-700 bg-blue-50 border-blue-200',
  fiction:       'text-violet-700 bg-violet-50 border-violet-200',
  info:          'text-red-700 bg-red-50 border-red-200',
  divertissement:'text-orange-700 bg-orange-50 border-orange-200',
  film:          'text-green-700 bg-green-50 border-green-200',
}

const RANK_STYLES: Record<number, string> = {
  1: 'text-yellow-500',
  2: 'text-slate-400',
  3: 'text-amber-600',
}

function getChannel(channelId: string) {
  return TNT_CHANNELS.find((c) => c.id === channelId)
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(dateStr + 'T12:00:00'),
  )
}
</script>

<template>
  <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white">
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-slate-100 text-left">
            <th class="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">#</th>
            <th class="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Chaîne</th>
            <th class="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Programme</th>
            <th class="hidden px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 sm:table-cell">Date</th>
            <th class="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Audience</th>
            <th class="hidden px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 md:table-cell">PDA</th>
            <th class="hidden px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 lg:table-cell">Catégorie</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-50">
          <tr
            v-for="record in records"
            :key="record.rank"
            class="transition-colors hover:bg-slate-50"
          >
            <!-- Rank -->
            <td class="px-4 py-3">
              <span
                class="text-sm font-bold"
                :class="RANK_STYLES[record.rank] ?? 'text-slate-500'"
              >
                {{ record.rank }}
              </span>
            </td>

            <!-- Channel logo -->
            <td class="px-4 py-3">
              <div class="flex h-8 w-11 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100 p-1">
                <img
                  v-if="!logoFailed[record.channelId]"
                  :src="getChannel(record.channelId)?.logoUrl"
                  :alt="record.channelName"
                  class="h-full w-full object-contain"
                  loading="lazy"
                  @error="logoFailed[record.channelId] = true"
                />
                <span
                  v-else
                  class="text-[9px] font-bold text-slate-600"
                >{{ record.channelName.slice(0, 3) }}</span>
              </div>
            </td>

            <!-- Programme -->
            <td class="px-4 py-3">
              <p class="max-w-xs text-sm font-semibold text-slate-800">{{ record.programme }}</p>
            </td>

            <!-- Date (hidden on xs) -->
            <td class="hidden px-4 py-3 text-slate-500 sm:table-cell">
              <span class="text-xs">{{ formatDate(record.date) }}</span>
            </td>

            <!-- Audience -->
            <td class="px-4 py-3 text-right">
              <span class="text-sm font-bold text-slate-900 tabular-nums">{{ record.audience.toFixed(1) }}M</span>
            </td>

            <!-- PDA (hidden on xs/sm) -->
            <td class="hidden px-4 py-3 text-right md:table-cell">
              <span class="text-xs font-semibold text-slate-500 tabular-nums">{{ record.pda.toFixed(1) }}%</span>
            </td>

            <!-- Category (hidden on xs/sm/md) -->
            <td class="hidden px-4 py-3 lg:table-cell">
              <span
                class="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
                :class="CATEGORY_COLORS[record.category] ?? 'text-slate-600 bg-slate-50 border-slate-200'"
              >
                {{ CATEGORY_LABELS[record.category] ?? record.category }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
