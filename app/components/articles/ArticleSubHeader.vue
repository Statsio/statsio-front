<script setup lang="ts">
import StatsDataShareMenu from '@/components/statsdata/detail/StatsDataShareMenu.vue'
import DsButton from '@/components/ds/DsButton.vue'
import DsMeta from '@/components/ds/DsMeta.vue'
import DsTypeGlyph from '@/components/ds/DsTypeGlyph.vue'

/**
 * Sous-barre d'un article — charte « Tranches » : badge Article, titre,
 * durée de lecture, Favori et Partager. Reste collée sous le header au scroll.
 */
defineProps<{
  title: string
  readingMinutes: number
  isFavorite: boolean
  isFollowing: boolean
  canFollow: boolean
  canEdit: boolean
  shareUrl: string
  canWebShare: boolean
  shareTargets: { key: string; label: string; href: string }[]
  canEmbed?: boolean
}>()

defineEmits<{
  'toggle-favorite': []
  'toggle-follow': []
  'native-share': []
  'open-embed': []
}>()
</script>

<template>
  <div class="artsub ds-sticky-bar">
    <div class="artsub__in ds-max">
      <span class="artsub__ttl">
        <span class="artsub__badge"><DsTypeGlyph kind="article" :size="12" />Article</span>
        <span class="artsub__name">{{ title }}</span>
      </span>
      <span class="artsub__spacer" />
      <div class="artsub__acts">
        <DsMeta class="artsub__hide-m">{{ readingMinutes }} min de lecture</DsMeta>
        <DsButton
          v-if="!canEdit"
          variant="secondary"
          size="sm"
          class="artsub__hide-m"
          :aria-pressed="isFavorite"
          @click="$emit('toggle-favorite')"
        >
          {{ isFavorite ? '★ En favori' : '☆ Favori' }}
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
    </div>
  </div>
</template>

<style scoped>
.artsub {
  border-bottom: 2px solid var(--ds-ol);
  background: var(--ds-bg);
}
.artsub__in {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 58px;
  padding-block: 10px;
}
.artsub__ttl {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  gap: 10px;
  color: var(--ds-text);
  font: 700 14.5px/1.2 var(--ds-ui);
}
.artsub__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.artsub__badge {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  border: 2px solid var(--ds-ol);
  border-radius: 3px;
  background: var(--ds-tint);
  color: var(--ds-ol);
  font: 500 10.5px/1 var(--ds-num);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.artsub__spacer {
  display: none;
}
.artsub__acts {
  display: flex;
  flex: none;
  align-items: center;
  gap: 8px;
}
@media (max-width: 620px) {
  .artsub__name,
  .artsub__hide-m {
    display: none;
  }
}
</style>
