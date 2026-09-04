<script setup lang="ts">
import { RouterLink } from 'vue-router'
import StatsDataActionButton from '@/components/statsdata/detail/StatsDataActionButton.vue'
import StatsDataShareMenu from '@/components/statsdata/detail/StatsDataShareMenu.vue'

defineProps<{
  title: string
  editHref?: string | null
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
      <span class="mono shrink-0 rounded-[5px] bg-[#eaf1fe] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#2563eb]">
        Article
      </span>
      <span class="hidden max-w-[420px] shrink truncate text-[13px] font-bold text-[var(--studio-ink)] sm:block">
        {{ title }}
      </span>

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
          <span class="hidden md:inline">Favori</span>
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

        <RouterLink
          v-if="editHref"
          :to="editHref"
          class="hidden h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-[var(--studio-line-strong)] text-[13px] text-[var(--studio-muted)] transition-colors hover:bg-[var(--studio-wash)] sm:flex"
          title="Modifier dans le Studio"
          aria-label="Modifier dans le Studio"
        >
          ✎
        </RouterLink>
      </div>
    </div>
  </div>
</template>
