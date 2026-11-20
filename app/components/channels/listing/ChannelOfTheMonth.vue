<script setup lang="ts">
import { computed } from 'vue'
import DsBox from '@/components/ds/DsBox.vue'
import DsButton from '@/components/ds/DsButton.vue'
import DsLabel from '@/components/ds/DsLabel.vue'
import DsTypeGlyph from '@/components/ds/DsTypeGlyph.vue'
import ChannelActivity from './ChannelActivity.vue'
import ChannelAvatar from './ChannelAvatar.vue'
import ChannelBanner from './ChannelBanner.vue'
import ChannelFollowButton from './ChannelFollowButton.vue'
import ChannelHeading from './ChannelHeading.vue'
import ChannelMixBar from './ChannelMixBar.vue'
import ChannelStats from './ChannelStats.vue'
import { useContentBasePath } from '@/composables/useContentBasePath'
import { formatRelativePublished } from '@/lib/catalog-format'
import { publicContentPath } from '@/lib/content-display'
import { glyphForContentType } from '@/lib/ds/types'
import type { ChannelCatalogFeatured, ChannelCatalogFeaturedPost } from '@/types/channel-catalog'

/**
 * « La chaîne du mois » en tête de grille (vue par défaut, sans filtre) : la
 * carte de la chaîne en grand, et ses dernières parutions à droite.
 */
defineProps<{
  item: ChannelCatalogFeatured
  to: string
  following: boolean
  followers: number
}>()
const emit = defineEmits<{ follow: [] }>()

const basePath = useContentBasePath()
const month = computed(() =>
  new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
)

const POST_KIND: Record<string, string> = {
  statsdata: 'StatsData',
  survey: 'Sondage',
  article: 'Article',
}
const postTo = (post: ChannelCatalogFeaturedPost) =>
  publicContentPath(
    post.type === 'survey' ? 'survey' : post.type === 'statsdata' ? 'statsdata' : 'article',
    post.slug,
    basePath.value,
  )
</script>

<template>
  <DsBox as="article" class="cotm">
    <div class="cotm__l">
      <ChannelBanner :item="item" :to="to" :height="120" />
      <div class="cotm__lb">
        <div class="cotm__head">
          <ChannelAvatar :item="item" />
          <ChannelFollowButton :following="following" :name="item.name" @toggle="emit('follow')" />
        </div>
        <div>
          <DsLabel><b>La chaîne du mois</b> · {{ month }}</DsLabel>
          <ChannelHeading :item="item" :to="to" size="lg" class="cotm__name" />
        </div>
        <p v-if="item.description" class="cotm__desc">{{ item.description }}</p>
        <ChannelStats
          :followers="followers"
          :publications="item.publications_count"
          :statsdata="item.statsdata_count"
        />
        <ChannelMixBar :item="item" />
        <ChannelActivity :item="item" />
      </div>
    </div>

    <div class="cotm__r">
      <DsLabel>Dernières parutions</DsLabel>
      <ul v-if="item.posts.length" class="cotm__posts">
        <li v-for="post in item.posts" :key="post.slug">
          <NuxtLink :to="postTo(post)">
            <span class="cotm__gl"
              ><DsTypeGlyph :kind="glyphForContentType(post.type)" :size="16"
            /></span>
            <span>
              <span class="cotm__kind">{{ POST_KIND[post.type] ?? 'Article' }}</span>
              <b>{{ post.title }}</b>
              <span class="cotm__meta">{{ formatRelativePublished(post.updated_at) }}</span>
            </span>
          </NuxtLink>
        </li>
      </ul>
      <p v-else class="cotm__meta">Aucune parution pour le moment.</p>
      <DsButton :to="to" variant="secondary" size="sm" class="cotm__all"
        >Voir la chaîne <span aria-hidden="true">→</span></DsButton
      >
    </div>
  </DsBox>
</template>

<style scoped>
.cotm {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  margin-bottom: 28px;
  overflow: hidden;
}
@media (min-width: 861px) {
  .cotm {
    grid-template-columns: minmax(0, 6fr) minmax(0, 5fr);
  }
}
.cotm__l {
  display: flex;
  flex-direction: column;
  border-bottom: 2px solid var(--ds-ol);
}
@media (min-width: 861px) {
  .cotm__l {
    border-right: 2px solid var(--ds-ol);
    border-bottom: 0;
  }
}
.cotm__lb {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 24px 24px;
}
.cotm__head {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 10px;
  margin-top: -34px;
}
.cotm__name {
  margin-top: 10px;
}
.cotm__desc {
  margin: 0;
  color: var(--ds-muted);
  font-size: 14px;
  line-height: 1.5;
}
.cotm__r {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 22px 24px;
  background: var(--ds-tint);
}
.cotm__posts {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.cotm__posts a {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  padding: 10px;
  border: 2px solid var(--ds-divide);
  border-radius: 4px;
  background: var(--ds-surface);
  color: var(--ds-text);
  text-decoration: none;
  transition:
    border-color 0.15s,
    transform 0.15s,
    box-shadow 0.15s;
}
.cotm__posts a:hover {
  border-color: var(--ds-ol);
  box-shadow: 3px 3px 0 var(--ds-sh);
  transform: translate(-2px, -2px);
}
.cotm__posts a:focus-visible {
  outline: 2px solid var(--ds-focus);
  outline-offset: 2px;
}
.cotm__gl {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 2px solid var(--ds-ol);
  border-radius: 50%;
  color: var(--ds-link);
}
.cotm__kind {
  display: block;
  margin-bottom: 4px;
  color: var(--ds-link);
  font: 500 10px/1 var(--ds-num);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.cotm__posts b {
  display: block;
  font-size: 14.5px;
  font-weight: 700;
  line-height: 1.3;
}
.cotm__meta {
  color: var(--ds-faint);
  font: 400 12px var(--ds-num);
}
.cotm__all {
  align-self: flex-start;
}
</style>
