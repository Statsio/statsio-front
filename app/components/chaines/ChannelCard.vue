<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { formatCompactNumber, getNameInitials } from '@/lib/format'
import type { Channel } from '@/api/channels'

const props = defineProps<{ channel: Channel }>()

const DEFAULT_STATUS = { label: 'Anonymisée', bg: 'rgba(24,24,31,0.08)', color: 'rgba(24,24,31,0.55)' }

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  active: { label: 'Active', bg: 'rgba(16,185,129,0.14)', color: '#10b981' },
  suspended: { label: 'Suspendue', bg: 'rgba(245,158,11,0.16)', color: '#b45309' },
  banned: { label: 'Bannie', bg: 'rgba(225,29,72,0.14)', color: '#e11d48' },
  anonymized: DEFAULT_STATUS,
}

const status = computed(() => STATUS_META[props.channel.status] ?? DEFAULT_STATUS)

const primaryColor = computed(() => props.channel.profile.custom_color_primary || 'var(--color-primary)')

const banner = computed(() => {
  const primary = props.channel.profile.custom_color_primary
  if (!primary) return 'linear-gradient(135deg, #f1f5f9, #e2e8f0)'
  const secondary = props.channel.profile.custom_color_secondary || '#18181f'
  return `linear-gradient(135deg, ${primary}, ${secondary})`
})

const initials = computed(() => getNameInitials(props.channel.profile.name))
</script>

<template>
  <div class="card">
    <div class="relative h-16 w-full" :style="{ background: banner }">
      <img
        v-if="channel.profile.banner_url"
        :src="channel.profile.banner_url"
        :alt="`Bannière ${channel.profile.name}`"
        class="h-full w-full object-cover"
      />
      <span
        class="absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10.5px] font-bold"
        :style="{ background: status.bg, color: status.color }"
      >
        {{ status.label }}
      </span>
    </div>

    <div class="-mt-[26px] px-[22px] pb-[22px]">
      <img
        v-if="channel.profile.logo_url"
        :src="channel.profile.logo_url"
        :alt="channel.profile.name"
        class="mb-3 h-[52px] w-[52px] rounded-[14px] border-[3px] border-white object-cover"
      />
      <div
        v-else
        class="mb-3 flex h-[52px] w-[52px] items-center justify-center rounded-[14px] border-[3px] border-white text-[17px] font-bold text-white"
        :style="{ background: primaryColor }"
      >
        {{ initials }}
      </div>

      <div class="text-[17px] font-bold text-slate-950">{{ channel.profile.name }}</div>
      <p v-if="channel.profile.description" class="my-1 line-clamp-2 text-[13px] text-slate-500">
        {{ channel.profile.description }}
      </p>

      <div class="mb-[18px] mt-4 flex gap-[22px]">
        <div>
          <div class="font-mono text-[15px] font-semibold text-slate-950">
            {{ formatCompactNumber(channel.profile.subscriber_count) }}
          </div>
          <div class="text-[11px] text-slate-400">Abonnés</div>
        </div>
        <div>
          <div class="font-mono text-[15px] font-semibold text-slate-950">
            {{ formatCompactNumber(channel.profile.view_count) }}
          </div>
          <div class="text-[11px] text-slate-400">Vues</div>
        </div>
        <div>
          <div class="font-mono text-[15px] font-semibold" :class="channel.profile.is_featured ? 'text-amber-500' : 'text-slate-300'">
            ★
          </div>
          <div class="text-[11px] text-slate-400">{{ channel.profile.is_featured ? 'En vedette' : 'Standard' }}</div>
        </div>
      </div>

      <RouterLink
        :to="`/channels/${channel.id}/dashboard`"
        class="inline-block rounded-[10px] bg-slate-950 px-5 py-[11px] text-[13.5px] font-bold text-white transition hover:brightness-110"
      >
        Gérer la chaîne →
      </RouterLink>
    </div>
  </div>
</template>
