<script setup lang="ts">
import StatsDataActionButton from './StatsDataActionButton.vue'
import StatsDataShareMenu from './StatsDataShareMenu.vue'
import DsButton from '@/components/ds/DsButton.vue'

defineProps<{
  isFavorite: boolean
  isFollowing: boolean
  canFollow: boolean
  canEdit: boolean
  shareUrl: string
  canWebShare: boolean
  shareTargets: { key: string; label: string; href: string }[]
  canEmbed?: boolean
  /** `tranches` : bandeau Bold Outline (pages StatsData et Article). */
  tone?: 'default' | 'tranches'
  /** Question du bandeau. Défaut : « Ce StatsData vous a été utile ? ». */
  question?: string
}>()

defineEmits<{
  'toggle-favorite': []
  'toggle-follow': []
  'native-share': []
  'open-embed': []
}>()
</script>

<template>
  <div v-if="tone === 'tranches'" class="sduse">
    <span class="sduse__q">{{ question || 'Ce StatsData vous a été utile ?' }}</span>
    <DsButton
      v-if="!canEdit"
      variant="secondary"
      size="sm"
      :aria-pressed="isFavorite"
      @click="$emit('toggle-favorite')"
    >
      {{ isFavorite ? '★ En favori' : '☆ Favori' }}
    </DsButton>
    <DsButton
      v-if="canFollow && !canEdit"
      variant="secondary"
      size="sm"
      :aria-pressed="isFollowing"
      @click="$emit('toggle-follow')"
    >
      {{ isFollowing ? '✓ Suivi' : '+ Suivre la chaîne' }}
    </DsButton>
    <StatsDataShareMenu
      tone="tranches"
      :share-url="shareUrl"
      :can-web-share="canWebShare"
      :targets="shareTargets"
      :can-embed="canEmbed !== false"
      @native-share="$emit('native-share')"
      @open-embed="$emit('open-embed')"
    />
  </div>

  <div v-else class="flex flex-wrap items-center gap-2.5 rounded-[18px] bg-white px-6 py-5 shadow-[var(--studio-shadow-card)]">
    <span class="min-w-[200px] flex-1 text-[14px] font-bold text-[var(--studio-ink)]">{{ question || 'Ce StatsData vous a été utile ?' }}</span>

    <StatsDataActionButton
      v-if="!canEdit"
      variant="toggle"
      :active="isFavorite"
      @click="$emit('toggle-favorite')"
    >
      <span>{{ isFavorite ? '★' : '☆' }}</span>
      <span>{{ isFavorite ? 'En favori' : 'Favori' }}</span>
    </StatsDataActionButton>

    <StatsDataActionButton
      v-if="canFollow && !canEdit"
      variant="toggle"
      :active="isFollowing"
      @click="$emit('toggle-follow')"
    >
      {{ isFollowing ? '✓ Suivi' : '+ Suivre la chaîne' }}
    </StatsDataActionButton>

    <StatsDataShareMenu
      :share-url="shareUrl"
      :can-web-share="canWebShare"
      :targets="shareTargets"
      :can-embed="canEmbed !== false"
      @native-share="$emit('native-share')"
      @open-embed="$emit('open-embed')"
    />
  </div>
</template>

<style scoped>
.sduse {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 18px 22px;
  border-block: 2px solid var(--ds-ol);
  background: var(--ds-tint);
}
.sduse__q {
  min-width: 200px;
  flex: 1;
  color: var(--ds-text);
  font: 800 22px/1.1 var(--ds-display);
  font-stretch: 90%;
}
</style>
