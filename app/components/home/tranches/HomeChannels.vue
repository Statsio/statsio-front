<script setup lang="ts">
import { RouterLink } from 'vue-router'
import DsBox from '@/components/ds/DsBox.vue'
import DsButton from '@/components/ds/DsButton.vue'
import DsLabel from '@/components/ds/DsLabel.vue'
import DsMeta from '@/components/ds/DsMeta.vue'
import DsRichTitle from '@/components/ds/DsRichTitle.vue'
import DsSectionHead from '@/components/ds/DsSectionHead.vue'
import DsTypeGlyph from '@/components/ds/DsTypeGlyph.vue'
import { publicChannelListPath, publicChannelPath } from '@/lib/content-display'
import { CHANNEL_KIND_STYLE } from '@/lib/channel-catalog-display'
import { formatCatalogCount, formatRelativePublished } from '@/lib/catalog-format'
import type { ChannelCatalogFeatured, ChannelCatalogItem } from '@/types/channel-catalog'
import type { HomeTranchesContent } from '@/data/brands/statsio/home-tranches'

/**
 * « Qui publie ? » : les chaînes en tendance. L'abonnement passe par l'API
 * existante (optimiste, géré par le parent via `follow`).
 */
const props = defineProps<{
  content: HomeTranchesContent['channels']
  channels: ChannelCatalogItem[]
  featured: ChannelCatalogFeatured | null
  basePath: string
  isFollowing: (c: ChannelCatalogItem) => boolean
  followersOf: (c: ChannelCatalogItem) => number
  busyId: number | null
}>()
const emit = defineEmits<{ follow: [channel: ChannelCatalogItem] }>()

/** Dernier titre publié : seulement connu pour la chaîne mise en avant. */
function lastTitle(c: ChannelCatalogItem): string | null {
  return props.featured?.id === c.id ? (props.featured.posts[0]?.title ?? null) : null
}

function metaLine(c: ChannelCatalogItem): string {
  const parts = [CHANNEL_KIND_STYLE[c.kind]?.label, c.verified ? 'vérifiée' : null].filter(Boolean)
  return parts.join(' · ')
}
</script>

<template>
  <section id="chaines" class="ds-band" aria-labelledby="ch-title">
    <div class="ds-max ch">
      <DsSectionHead :label="content.label" heading-id="ch-title">
        <template #title><DsRichTitle :parts="content.title" /></template>
        <template #action>
          <DsButton variant="secondary" :to="publicChannelListPath(basePath)">
            {{ content.allLabel }} <span aria-hidden="true">→</span>
          </DsButton>
        </template>
      </DsSectionHead>

      <div class="ch__grid">
        <DsBox v-for="c in channels" :key="c.id" class="ch__card">
          <RouterLink :to="publicChannelPath(c.handle, basePath)" class="ch__id">
            <span class="ch__logo">
              <img v-if="c.logo_url" :src="c.logo_url" alt="" class="h-full w-full object-cover" />
              <DsTypeGlyph v-else kind="chaine" :size="24" />
            </span>
            <span class="min-w-0">
              <b class="ch__name">{{ c.name }}<span v-if="c.verified" class="ch__check" title="Chaîne vérifiée"> ✔</span></b>
              <DsMeta>{{ metaLine(c) }}</DsMeta>
            </span>
          </RouterLink>
          <p v-if="c.description" class="ch__desc">{{ c.description }}</p>
          <div class="ch__last">
            <DsLabel>Dernière publication</DsLabel>
            <span v-if="lastTitle(c)" class="ch__last-title">{{ lastTitle(c) }}</span>
            <span v-else class="ch__last-title">
              {{ formatCatalogCount(c.publications_count) }} publication{{ c.publications_count > 1 ? 's' : '' }}
            </span>
          </div>
          <div class="ch__acts">
            <DsMeta>{{ c.last_published_at ? formatRelativePublished(c.last_published_at) : `${formatCatalogCount(followersOf(c))} abonnés` }}</DsMeta>
            <DsButton
              size="sm"
              :variant="isFollowing(c) ? 'secondary' : 'primary'"
              :disabled="busyId === c.id"
              :aria-pressed="isFollowing(c)"
              @click="emit('follow', c)"
            >
              {{ isFollowing(c) ? 'Suivi ✓' : 'Suivre' }}
            </DsButton>
          </div>
        </DsBox>
      </div>
    </div>
  </section>
</template>

<style scoped>
.ch {
  padding-block: 80px;
}
.ch__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 22px;
}
@media (min-width: 900px) {
  .ch__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
.ch__card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 22px;
}
.ch__id {
  display: flex;
  align-items: center;
  gap: 12px;
}
.ch__id:hover .ch__name {
  color: var(--ds-link);
}
.ch__logo {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  overflow: hidden;
  border: 2px solid var(--ds-divide);
  border-radius: 4px;
  background: var(--ds-tint);
  color: var(--ds-link);
}
.ch__name {
  display: block;
  font: 800 24px/1 var(--ds-display);
  font-stretch: 95%;
}
.ch__check {
  color: var(--ds-link);
  font-family: var(--ds-ui);
  font-size: 15px;
}
.ch__desc {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: var(--ds-muted);
  font-size: 14.5px;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}
.ch__last {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 12px;
  border-top: 2px solid var(--ds-divide);
  font-size: 14.5px;
}
.ch__acts {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: auto;
}
</style>
