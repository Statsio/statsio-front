<script setup lang="ts">
import StatsDataPageTabs from './StatsDataPageTabs.vue'
import StatsDataActionButton from './StatsDataActionButton.vue'
import StatsDataShareMenu from './StatsDataShareMenu.vue'

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
}>()

defineEmits<{
  'toggle-favorite': []
  'toggle-follow': []
  'native-share': []
  'open-embed': []
}>()
</script>

<template>
  <div class="sticky top-[158px] z-30 border-b border-[var(--studio-line)] bg-white/85 backdrop-blur lg:top-28">
    <div class="mx-auto flex max-w-[1180px] items-center gap-3.5 px-4 py-2.5 sm:px-6">
      <span class="mono shrink-0 rounded-[5px] bg-[var(--studio-tag)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--studio-tag-ink)]">
        StatsData
      </span>
      <span class="hidden max-w-[280px] shrink truncate text-[13px] font-bold text-[var(--studio-ink)] sm:block">
        {{ title }}
      </span>

      <StatsDataPageTabs
        v-if="pages.length > 1"
        :doc-slug="docSlug"
        :pages="pages"
        :active-page-id="activePageId"
        :accent-color="accentColor"
      />

      <div class="min-w-0 flex-1" />

      <div class="flex shrink-0 items-center gap-2">
        <StatsDataActionButton
          v-if="!canEdit"
          variant="toggle"
          size="sm"
          :active="isFavorite"
          @click="$emit('toggle-favorite')"
        >
          <span>{{ isFavorite ? '★' : '☆' }}</span>
          <span class="hidden md:inline">{{ isFavorite ? 'Favori' : 'Favori' }}</span>
        </StatsDataActionButton>

        <StatsDataActionButton
          v-if="canFollow && !canEdit"
          variant="toggle"
          size="sm"
          :active="isFollowing"
          class="hidden md:inline-flex"
          @click="$emit('toggle-follow')"
        >
          {{ isFollowing ? '✓ Suivi' : '+ Suivre' }}
        </StatsDataActionButton>

        <StatsDataShareMenu
          :share-url="shareUrl"
          :can-web-share="canWebShare"
          :targets="shareTargets"
          @native-share="$emit('native-share')"
          @open-embed="$emit('open-embed')"
        />
      </div>
    </div>
  </div>
</template>
