<script setup lang="ts">
import StatsDataActionButton from './StatsDataActionButton.vue'
import StatsDataShareMenu from './StatsDataShareMenu.vue'

defineProps<{
  isFavorite: boolean
  isFollowing: boolean
  canFollow: boolean
  canEdit: boolean
  shareUrl: string
  canWebShare: boolean
  shareTargets: { key: string; label: string; href: string }[]
}>()

defineEmits<{
  'toggle-favorite': []
  'toggle-follow': []
  'native-share': []
  'open-embed': []
}>()
</script>

<template>
  <div class="flex flex-wrap items-center gap-2.5 rounded-[18px] bg-white px-6 py-5 shadow-[var(--studio-shadow-card)]">
    <span class="min-w-[200px] flex-1 text-[14px] font-bold text-[var(--studio-ink)]">Ce StatsData vous a été utile&nbsp;?</span>

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
      @native-share="$emit('native-share')"
      @open-embed="$emit('open-embed')"
    />
  </div>
</template>
