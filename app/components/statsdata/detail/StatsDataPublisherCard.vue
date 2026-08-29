<script setup lang="ts">
import { computed } from 'vue'
import type { StatsDataDocument } from '@/api/studio'
import StatsDataActionButton from './StatsDataActionButton.vue'

const props = defineProps<{
  doc: StatsDataDocument
  isFollowing: boolean
  canFollow?: boolean
}>()

defineEmits<{ 'toggle-follow': [] }>()

const isChannel = computed(() => props.doc.published_as === 'channel' && !!props.doc.channel)
const name = computed(() => (isChannel.value ? props.doc.channel?.name : props.doc.author?.name) || 'Anonyme')
const handle = computed(() =>
  isChannel.value && props.doc.channel?.handle ? `@${props.doc.channel.handle}` : `statsio.fr/${props.doc.slug ?? ''}`,
)
const initials = computed(() =>
  name.value.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || '?',
)
const logoUrl = computed(() => (isChannel.value ? props.doc.channel?.logo_url : null))
const accent = computed(() => props.doc.channel?.custom_color_primary ?? null)

const kind = computed(() => (isChannel.value ? 'Chaîne éditoriale' : 'Auteur'))

const stats = computed(() => {
  const out: { label: string; value: string }[] = []
  if (props.doc.views_count != null) out.push({ label: 'Vues', value: new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(props.doc.views_count) })
  const n = props.doc.datasets?.length ?? 0
  if (n) out.push({ label: 'Sources', value: String(n) })
  if (props.doc.created_at) out.push({ label: 'Depuis', value: String(new Date(props.doc.created_at).getFullYear()) })
  return out
})

const profileHref = computed(() =>
  isChannel.value && props.doc.channel?.id ? `/channels/${props.doc.channel.id}` : null,
)
</script>

<template>
  <aside class="h-max rounded-[18px] border-[1.5px] border-[var(--studio-line-strong)] p-5">
    <p class="mb-3.5 text-[9.5px] font-extrabold uppercase tracking-[0.09em] text-[var(--studio-faint)]">Publié par</p>

    <div class="flex items-center gap-3">
      <span
        class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[14px] text-[15px] font-extrabold text-white"
        :style="{ background: accent ? undefined : 'linear-gradient(135deg,#8b5cf6,#3b82f6)', backgroundColor: accent ?? undefined }"
      >
        <img v-if="logoUrl" :src="logoUrl" alt="" class="h-full w-full object-cover" />
        <template v-else>{{ initials }}</template>
      </span>
      <div class="min-w-0">
        <div class="flex items-center gap-1.5">
          <span class="truncate text-[15px] font-extrabold text-[var(--studio-ink)]">{{ name }}</span>
          <span v-if="isChannel" title="Chaîne vérifiée" class="shrink-0 text-[11px] text-[#3b82f6]">✔</span>
        </div>
        <div class="mono mt-0.5 truncate text-[10.5px] text-[var(--studio-faint)]">{{ handle }}</div>
      </div>
    </div>

    <span class="mt-3 inline-flex rounded-md bg-[var(--studio-tag)] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.06em] text-[var(--studio-tag-ink)]">
      {{ kind }}
    </span>

    <div v-if="stats.length" class="my-4 flex border-y border-[var(--studio-line)] py-3">
      <div
        v-for="(s, i) in stats"
        :key="s.label"
        class="flex-1 text-center"
        :class="i > 0 ? 'border-l border-[var(--studio-line)]' : ''"
      >
        <div class="mono text-[14px] font-semibold text-[var(--studio-ink)]">{{ s.value }}</div>
        <div class="mt-1 text-[9px] font-bold uppercase tracking-[0.05em] text-[var(--studio-faint)]">{{ s.label }}</div>
      </div>
    </div>

    <div class="mt-4 flex gap-2">
      <StatsDataActionButton
        v-if="canFollow"
        variant="toggle"
        size="sm"
        :active="isFollowing"
        class="flex-1"
        @click="$emit('toggle-follow')"
      >
        {{ isFollowing ? '✓ Suivi' : '+ Suivre' }}
      </StatsDataActionButton>
      <StatsDataActionButton v-if="profileHref" as="a" :href="profileHref" size="sm" :class="canFollow ? '' : 'flex-1'">
        Profil
      </StatsDataActionButton>
    </div>
  </aside>
</template>
