<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChannelDashboard } from '@/composables/useChannelDashboard'
import { useMyChannels } from '@/composables/useMyChannels'
import { useClickOutside } from '@/composables/useClickOutside'
import { getNameInitials, formatCompactNumber } from '@/lib/format'
import { channelBannerStyle, resolveChannelColors } from '@/lib/channel-brand'

const route = useRoute()
const router = useRouter()
const { channel, channelInitials } = useChannelDashboard()
const { channels, fetch: fetchChannels } = useMyChannels()

const brandStyle = computed(() => {
  const colors = resolveChannelColors(
    String(channel.value?.id ?? ''),
    channel.value?.profile?.custom_color_primary,
    channel.value?.profile?.custom_color_secondary,
  )
  return channelBannerStyle(colors.primary, colors.secondary)
})

function optionStyle(opt: { id: number; profile: { custom_color_primary?: string | null; custom_color_secondary?: string | null } }) {
  const colors = resolveChannelColors(String(opt.id), opt.profile.custom_color_primary, opt.profile.custom_color_secondary)
  return channelBannerStyle(colors.primary, colors.secondary)
}

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)

fetchChannels()

useClickOutside(rootRef, () => { open.value = false })

const currentChannelId = computed(() => Number(route.params.id))

// Sous-route active dans le dashboard (dashboard, dashboard/contenus, ...),
// préservée lors du changement de chaîne.
const currentSubPath = computed(() => {
  const base = `/channels/${currentChannelId.value}/dashboard`
  return route.path.startsWith(base) ? route.path.slice(base.length) : ''
})

function switchTo(id: number) {
  open.value = false
  if (id === currentChannelId.value) return
  router.push(`/channels/${id}/dashboard${currentSubPath.value}`)
}
</script>

<template>
  <div ref="rootRef" class="relative">
    <button
      type="button"
      class="flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-[0_1px_3px_rgba(20,20,30,0.06)] transition hover:border-slate-200"
      :aria-expanded="open"
      @click="open = !open"
    >
      <div
        class="flex h-[42px] w-[42px] shrink-0 items-center justify-center overflow-hidden rounded-[11px] text-sm font-bold text-white"
        :style="channel?.profile?.logo_url ? undefined : brandStyle"
      >
        <img v-if="channel?.profile?.logo_url" :src="channel.profile.logo_url" :alt="channel.profile.name" class="h-full w-full object-cover" />
        <span v-else>{{ channelInitials }}</span>
      </div>
      <div class="min-w-0 flex-1">
        <p class="truncate text-[14.5px] font-bold text-slate-950">{{ channel?.profile?.name ?? 'Chargement...' }}</p>
        <p class="text-[11.5px] text-slate-400">{{ formatCompactNumber(channel?.profile?.subscriber_count ?? 0) }} abonnés</p>
      </div>
      <span class="shrink-0 text-[11px] text-slate-400 transition-transform" :class="open ? 'rotate-180' : ''">▾</span>
    </button>

    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-1 scale-[0.98]"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="absolute top-[calc(100%+8px)] left-0 z-40 w-full overflow-hidden rounded-[14px] border border-slate-100 bg-white shadow-[0_12px_32px_rgba(20,20,30,0.14)]"
      >
        <p class="px-3.5 pb-1.5 pt-3 text-[11px] font-bold uppercase tracking-[0.04em] text-slate-400">Vos chaînes</p>

        <button
          v-for="opt in channels"
          :key="opt.id"
          type="button"
          class="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left"
          :class="opt.id === currentChannelId ? 'bg-slate-50' : 'hover:bg-slate-50'"
          @click="switchTo(opt.id)"
        >
          <span
            class="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg text-[11px] font-bold text-white"
            :style="opt.profile.logo_url ? undefined : optionStyle(opt)"
          >
            <img v-if="opt.profile.logo_url" :src="opt.profile.logo_url" :alt="opt.profile.name" class="h-full w-full object-cover" />
            <template v-else>{{ getNameInitials(opt.profile.name) }}</template>
          </span>
          <span class="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-slate-800">{{ opt.profile.name }}</span>
          <span v-if="opt.id === currentChannelId" class="text-[13px]" :style="{ color: opt.profile.custom_color_primary || 'var(--color-primary)' }">✓</span>
        </button>

        <div class="mx-0 my-1 h-px bg-slate-100" />

        <NuxtLink to="/mes-chaines" class="flex items-center gap-2.5 px-3.5 py-2.5">
          <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-[1.5px] border-dashed border-slate-300 text-sm text-primary">+</span>
          <span class="text-[13.5px] font-semibold text-slate-700">Gérer mes chaînes</span>
        </NuxtLink>
      </div>
    </Transition>
  </div>
</template>
