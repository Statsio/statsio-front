<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { StatsDataDocument } from '@/api/studio'

const props = defineProps<{
  doc: StatsDataDocument
  isFollowing?: boolean
  canFollow?: boolean
}>()

defineEmits<{ 'toggle-follow': [] }>()

const isChannel = computed(() => props.doc.published_as === 'channel' && !!props.doc.channel)
const name = computed(() => (isChannel.value ? props.doc.channel?.name : props.doc.author?.name) || 'Anonyme')
const logoUrl = computed(() => (isChannel.value ? props.doc.channel?.logo_url : null))
const accent = computed(() => props.doc.channel?.custom_color_primary ?? null)
const initials = computed(() =>
  name.value.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || '?',
)
const profileHref = computed(() => {
  if (!isChannel.value) return null
  if (props.doc.channel?.handle) return `/channels/${props.doc.channel.handle}`
  return props.doc.channel?.id ? `/channels/${props.doc.channel.id}` : null
})
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[12.5px] text-[var(--studio-muted)]">
    <span
      class="flex h-[22px] w-[22px] shrink-0 items-center justify-center overflow-hidden rounded-full text-[9px] font-extrabold text-white"
      :style="{ background: accent ? undefined : 'linear-gradient(135deg,#8b5cf6,#3b82f6)', backgroundColor: accent ?? undefined }"
    >
      <img v-if="logoUrl" :src="logoUrl" alt="" class="h-full w-full object-cover" />
      <template v-else>{{ initials }}</template>
    </span>

    <span class="min-w-0">
      Par <span class="font-bold text-[var(--studio-ink)]">{{ name }}</span>
      <span v-if="isChannel" title="Chaîne vérifiée" class="text-[11px] text-[#3b82f6]">✔</span>
    </span>

    <template v-if="canFollow">
      <span class="h-[3px] w-[3px] rounded-full bg-[var(--studio-faint)]" />
      <button
        type="button"
        class="font-bold text-[var(--color-primary)] transition hover:opacity-70"
        @click="$emit('toggle-follow')"
      >
        {{ isFollowing ? '✓ Suivi' : '+ Suivre' }}
      </button>
    </template>

    <template v-if="profileHref">
      <span class="h-[3px] w-[3px] rounded-full bg-[var(--studio-faint)]" />
      <RouterLink :to="profileHref" class="font-semibold transition hover:text-[var(--studio-ink)]">
        Voir le profil →
      </RouterLink>
    </template>
  </div>
</template>
