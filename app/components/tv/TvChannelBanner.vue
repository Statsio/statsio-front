<script setup lang="ts">
import type { ChannelDetail } from '@/api/tv-channel'
import type { TntChannel } from '@/data/tnt-channels'

const props = defineProps<{
  detail: ChannelDetail
  staticChannel: TntChannel | null
  logoUrl: string | null
  isToggling: boolean
  isAuthenticated: boolean
}>()

defineEmits<{ 'toggle-follow': [] }>()

const bannerBg = props.staticChannel?.fallbackBg ?? 'bg-slate-800'
</script>

<template>
  <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white">
    <div class="relative h-24" :class="bannerBg">
      <div class="absolute inset-0 bg-gradient-to-br from-transparent to-black/40" />
    </div>

    <div class="flex flex-wrap items-end gap-5 px-7 pb-6 -mt-8">
      <TvChannelLogo
        class="h-[76px] w-[76px] shrink-0 rounded-2xl border-4 border-white p-3 text-2xl"
        :src="logoUrl"
        :name="detail.displayName"
        :fallback-bg="staticChannel?.fallbackBg"
        :max-initials="2"
      />
      <div class="min-w-[220px] flex-1 pb-1">
        <h1 class="text-2xl font-bold text-slate-900">{{ detail.displayName }}</h1>
        <p v-if="detail.description" class="mt-1 max-w-lg text-[13.5px] text-slate-500">{{ detail.description }}</p>
      </div>
      <button
        type="button"
        class="mb-1 shrink-0 rounded-xl px-5 py-3 text-sm font-bold transition"
        :class="detail.isFollowing
          ? 'border border-tvstats-primary bg-tvstats-soft/20 text-tvstats-primary'
          : 'border border-slate-200 bg-white text-slate-900 hover:border-slate-300'"
        :disabled="isToggling"
        @click="$emit('toggle-follow')"
      >
        {{ detail.isFollowing ? '✓ Suivi' : '+ Suivre la chaîne' }}
      </button>
    </div>

    <div class="grid grid-cols-3 border-t border-slate-100">
      <div class="border-r border-slate-100 px-7 py-4">
        <p class="mb-1.5 text-[11.5px] text-slate-500">Score d'audience moyen</p>
        <p class="font-mono text-xl font-semibold text-slate-900">{{ detail.avgScore ?? '—' }}</p>
      </div>
      <div class="border-r border-slate-100 px-7 py-4">
        <p class="mb-1.5 text-[11.5px] text-slate-500">Téléspectateurs suivis</p>
        <p class="font-mono text-xl font-semibold text-slate-900">{{ detail.followersCount.toLocaleString('fr-FR') }}</p>
      </div>
      <div class="px-7 py-4">
        <p class="mb-1.5 text-[11.5px] text-slate-500">Programmes cette semaine</p>
        <p class="font-mono text-xl font-semibold text-slate-900">{{ detail.weekProgramCount }}</p>
      </div>
    </div>
  </div>
</template>
