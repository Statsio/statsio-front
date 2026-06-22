<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchBroadcast, toggleBroadcastView } from '@/api/tv-broadcast'
import type { BroadcastDetail } from '@/api/tv-broadcast'
import { TNT_CHANNELS } from '@/data/tnt-channels'
import { useAuthStore } from '@/stores/auth'
import { apiHttp } from '@/lib/http'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const broadcast = ref<BroadcastDetail | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)
const isToggling = ref(false)
const dbLogoMap = ref<Map<string, string>>(new Map())

const broadcastId = computed(() => Number(route.params.id))

const channel = computed(() =>
  broadcast.value ? TNT_CHANNELS.find((c) => c.id === broadcast.value!.channelId) ?? null : null,
)

// Resolve logo: DB upload takes priority over static CDN URL
const channelLogoUrl = computed(() => {
  if (!channel.value) return null
  return dbLogoMap.value.get(channel.value.id) ?? channel.value.logoUrl
})

const formattedDate = computed(() => {
  if (!broadcast.value) return ''
  const d = new Date(broadcast.value.startAt)
  return d.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
})

const durationLabel = computed(() => {
  if (!broadcast.value) return ''
  const m = broadcast.value.durationMin
  return m >= 60 ? `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}` : `${m} min`
})

async function load() {
  isLoading.value = true
  error.value = null
  try {
    const [detail, channels] = await Promise.all([
      fetchBroadcast(broadcastId.value),
      apiHttp.get<{ slug: string; logo_url: string | null }[]>('/tv/channels').catch(() => ({ data: [] })),
    ])
    broadcast.value = detail
    dbLogoMap.value = new Map(
      channels.data.filter((c) => c.logo_url).map((c) => [c.slug, c.logo_url as string]),
    )
  } catch {
    error.value = 'Programme introuvable.'
  } finally {
    isLoading.value = false
  }
}

async function toggle(type: 'watched' | 'will_watch') {
  if (!auth.isAuthenticated) {
    router.push({ name: 'login' })
    return
  }
  if (isToggling.value || !broadcast.value) return
  isToggling.value = true
  try {
    const res = await toggleBroadcastView(broadcastId.value, type)
    broadcast.value.userViewType = res.userViewType
    broadcast.value.audience.viewers = res.viewers
    broadcast.value.audience.willWatch = res.willWatch
  } finally {
    isToggling.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-8">
    <!-- Back -->
    <button
      class="mb-6 flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-800"
      @click="router.back()"
    >
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      Retour
    </button>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-24">
      <div class="h-8 w-8 animate-spin rounded-full border-2 border-tvstats-primary border-t-transparent" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-red-600">
      {{ error }}
    </div>

    <!-- Content -->
    <template v-else-if="broadcast">
      <!-- Header card -->
      <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="flex items-start gap-4">
          <!-- Channel logo -->
          <div v-if="channel" class="flex shrink-0 flex-col items-center gap-1">
            <div class="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 p-1.5">
              <img
                :src="channelLogoUrl ?? undefined"
                :alt="channel.displayName"
                class="h-full w-full object-contain"
                @error="($event.target as HTMLImageElement).style.display = 'none'"
              />
            </div>
            <span class="text-[10px] font-semibold text-slate-400">{{ channel.number }}</span>
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span v-if="channel">{{ channel.displayName }}</span>
              <span>·</span>
              <span>{{ formattedDate }}</span>
            </div>
            <h1 class="mt-1 text-xl font-bold leading-tight text-slate-900 sm:text-2xl">
              {{ broadcast.program.title }}
            </h1>
            <div class="mt-2 flex flex-wrap items-center gap-2">
              <span
                v-if="broadcast.program.type"
                class="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500"
              >
                {{ broadcast.program.type }}
              </span>
              <span class="text-xs text-slate-400">
                {{ broadcast.startTime }} – {{ broadcast.endTime }} · {{ durationLabel }}
              </span>
            </div>
          </div>
        </div>

        <!-- Description -->
        <p
          v-if="broadcast.program.description"
          class="mt-4 border-t border-slate-100 pt-4 text-sm leading-relaxed text-slate-600"
        >
          {{ broadcast.program.description }}
        </p>
      </div>

      <!-- Audience card -->
      <div class="mt-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="mb-4 text-xs font-semibold uppercase tracking-widest text-tvstats-primary">
          Audience
        </h2>

        <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div class="text-center">
            <p class="text-2xl font-bold text-slate-900">{{ broadcast.audience.viewers.toLocaleString('fr-FR') }}</p>
            <p class="mt-0.5 text-[11px] text-slate-400">ont regardé</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-slate-900">{{ broadcast.audience.willWatch.toLocaleString('fr-FR') }}</p>
            <p class="mt-0.5 text-[11px] text-slate-400">vont regarder</p>
          </div>
          <div v-if="broadcast.audience.pda != null" class="text-center">
            <p class="text-2xl font-bold text-slate-900">{{ broadcast.audience.pda }}%</p>
            <p class="mt-0.5 text-[11px] text-slate-400">part d'audience</p>
          </div>
          <div v-if="broadcast.audience.rank != null" class="text-center">
            <p class="text-2xl font-bold text-slate-900">#{{ broadcast.audience.rank }}</p>
            <p class="mt-0.5 text-[11px] text-slate-400">classement</p>
          </div>
        </div>

        <!-- View buttons -->
        <div class="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            class="flex flex-1 items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition"
            :class="
              broadcast.userViewType === 'watched'
                ? 'border-tvstats-primary bg-tvstats-primary text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-700 hover:border-tvstats-primary/40 hover:bg-tvstats-soft/20'
            "
            :disabled="isToggling"
            @click="toggle('watched')"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {{ broadcast.userViewType === 'watched' ? 'J\'ai regardé ✓' : 'J\'ai regardé' }}
          </button>

          <button
            class="flex flex-1 items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition"
            :class="
              broadcast.userViewType === 'will_watch'
                ? 'border-tvstats-primary bg-tvstats-primary text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-700 hover:border-tvstats-primary/40 hover:bg-tvstats-soft/20'
            "
            :disabled="isToggling"
            @click="toggle('will_watch')"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {{ broadcast.userViewType === 'will_watch' ? 'Je vais regarder ✓' : 'Je vais regarder' }}
          </button>
        </div>

        <p v-if="!auth.isAuthenticated" class="mt-3 text-center text-xs text-slate-400">
          <a href="/login" class="underline hover:text-slate-600">Connectez-vous</a> pour enregistrer vos préférences.
        </p>
      </div>
    </template>
  </div>
</template>
