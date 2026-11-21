<script setup lang="ts">
import StatsDataPageTabs from './StatsDataPageTabs.vue'
import StatsDataShareMenu from './StatsDataShareMenu.vue'
import DsButton from '@/components/ds/DsButton.vue'
import DsTypeGlyph from '@/components/ds/DsTypeGlyph.vue'

/**
 * Sous-barre d'une page StatsData — charte « Tranches » : badge de type,
 * titre, onglets de pages (sélecteur en mobile), Favori / Suivre / Partager.
 * Reste collée sous le header au scroll.
 */
defineProps<{
  title: string
  docSlug: string
  pages: { id: string; title: string; slug?: string; icon?: string }[]
  activePageId?: string | null
  accentColor?: string | null
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
  <div class="sdsub ds-sticky-bar">
    <div class="sdsub__in ds-max">
      <span class="sdsub__ttl">
        <span class="sdsub__badge"><DsTypeGlyph kind="statsdata" :size="12" />StatsData</span>
        <span class="sdsub__name">{{ title }}</span>
      </span>

      <StatsDataPageTabs
        v-if="pages.length > 1"
        :doc-slug="docSlug"
        :pages="pages"
        :active-page-id="activePageId"
        :accent-color="accentColor"
      />
      <span v-else class="sdsub__spacer" />

      <div class="sdsub__acts">
        <DsButton
          v-if="!canEdit"
          variant="secondary"
          size="sm"
          class="sdsub__hide-m"
          :aria-pressed="isFavorite"
          @click="$emit('toggle-favorite')"
        >
          {{ isFavorite ? '★ En favori' : '☆ Favori' }}
        </DsButton>
        <DsButton
          v-if="canFollow && !canEdit"
          variant="secondary"
          size="sm"
          class="sdsub__hide-m"
          :aria-pressed="isFollowing"
          @click="$emit('toggle-follow')"
        >
          {{ isFollowing ? '✓ Suivi' : '+ Suivre' }}
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
.sdsub {
  border-bottom: 2px solid var(--ds-ol);
  background: var(--ds-bg);
}
.sdsub__in {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 58px;
  padding-block: 10px;
}
.sdsub__ttl {
  display: flex;
  min-width: 0;
  flex: 0 1 auto;
  align-items: center;
  gap: 10px;
  color: var(--ds-text);
  font: 700 14.5px/1.2 var(--ds-ui);
}
.sdsub__name {
  overflow: hidden;
  max-width: 320px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sdsub__badge {
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
.sdsub__spacer {
  flex: 1;
}
.sdsub__acts {
  display: flex;
  flex: none;
  gap: 8px;
}
@media (max-width: 1100px) {
  .sdsub__hide-m {
    display: none;
  }
  .sdsub__name {
    max-width: 220px;
  }
}
@media (max-width: 620px) {
  .sdsub__name {
    display: none;
  }
}
</style>
