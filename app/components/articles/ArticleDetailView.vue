<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import ArticleSubHeader from '@/components/articles/ArticleSubHeader.vue'
import ArticleHero from '@/components/articles/ArticleHero.vue'
import ArticleToc from '@/components/articles/ArticleToc.vue'
import ArticleBody from '@/components/articles/ArticleBody.vue'
import ArticleTeaserCard from '@/components/articles/ArticleTeaserCard.vue'
import StatsDataUsefulBar from '@/components/statsdata/detail/StatsDataUsefulBar.vue'
import StatsDataEmbedModal from '@/components/statsdata/detail/StatsDataEmbedModal.vue'
import ContentOwnerBar from '@/components/statsdata/detail/ContentOwnerBar.vue'
import ContentCommentsSection from '@/components/contents/ContentCommentsSection.vue'
import {
  fetchPublicArticles,
  fetchPublicStatsDataDocument,
  type StatsDataDocument,
} from '@/api/studio'
import { useStudioStore } from '@/stores/studio'
import { useStatsDataChrome } from '@/composables/useStatsDataChrome'
import { useContentBasePath } from '@/composables/useContentBasePath'
import { useContentDomain } from '@/composables/useContentDomain'
import { BLOCK_META, isFormBlock, isTextBlock } from '@/types/studio'
import type { StudioBlock } from '@/types/studio'
import { provideBlockSkin } from '@/lib/block-skin'
import { getHttpErrorStatus } from '@/lib/http-errors'
import { canonicalContentPath, publicContentListPath, publicContentPath } from '@/lib/content-display'
import { articleNode, breadcrumbNode } from '@/lib/structured-data'
import { sectionAnchorId } from '@/lib/slug'
import { stripInlineHtml } from '@/lib/inline-rich-text'

const props = withDefaults(defineProps<{ embed?: boolean }>(), { embed: false })

// Charte « Tranches » pour le hero et tous les blocs (texte, graphiques, StatsData lié).
provideBlockSkin('tranches')

const route = useRoute()
const requestUrl = useRequestURL()
const studio = useStudioStore()
const basePath = useContentBasePath()
const domain = useContentDomain()

const slug = computed(() => String(route.params.slug ?? ''))

const article = ref<StatsDataDocument | null>(null)
const relatedArticles = ref<StatsDataDocument[]>([])

const {
  isFavorite,
  isFollowing,
  canFollowChannel,
  toggleFavoriteAction,
  toggleFollowAction,
  shareUrl,
  embedUrl,
  embedSnippet,
  canWebShare,
  nativeShare,
  shareTargets,
} = useStatsDataChrome(article, { contentType: 'article' })

const showEmbedModal = ref(false)
const canEmbed = computed(() => article.value?.embed_enabled !== false)

const canonicalPath = computed(() => canonicalContentPath(route.path))

function channelPublicUrl(handle?: string | null) {
  return handle ? `${requestUrl.origin}/channels/${handle}` : undefined
}

usePageSeo({
  title: computed(() => article.value?.title),
  description: computed(() => article.value?.description ?? undefined),
  image: computed(() => article.value?.thumbnail_url ?? undefined),
  canonical: canonicalPath,
  robots: computed(() => (props.embed ? 'noindex,follow' : undefined)),
  type: 'article',
  jsonLd: computed(() => {
    const doc = article.value
    if (!doc || props.embed) return []
    return [
      breadcrumbNode(
        [
          { name: 'Accueil', path: '/' },
          { name: 'Articles', path: publicContentListPath('article') },
          { name: doc.title, path: canonicalPath.value },
        ],
        requestUrl.origin,
      ),
      articleNode(
        {
          url: `${requestUrl.origin}${canonicalPath.value}`,
          headline: doc.title,
          description: doc.description ?? undefined,
          image: doc.thumbnail_url ?? undefined,
          datePublished: doc.first_published_at ?? doc.created_at,
          dateModified: doc.last_published_at ?? doc.updated_at,
          section: doc.categories?.[0],
          authorName: doc.author?.name,
          channelName: doc.channel?.name ?? undefined,
          channelUrl: channelPublicUrl(doc.channel?.handle),
        },
        requestUrl.origin,
      ),
    ]
  }),
})

// ─── Blocs dérivés ───────────────────────────────────────────────────────────

function stripHtml(html?: string) {
  return (html ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const contentBlocks = computed<StudioBlock[]>(() =>
  (studio.blocks ?? []).filter((b) => !isFormBlock(b.type)),
)

const readingMinutes = computed(() => {
  let words = 0
  for (const block of contentBlocks.value) {
    words += isTextBlock(block.type)
      ? stripHtml(block.config.content).split(' ').filter(Boolean).length
      : 60
  }
  return Math.max(1, Math.round(words / 200))
})

// Sommaire : en-têtes de section (titre + ancre) dans l'ordre, + blocs `heading`
// avec du contenu (articles édités « à la main »).
const tocEntries = computed(() => {
  const out: { id: string; label: string; level: number }[] = []
  for (const section of studio.currentPageSections) {
    const anchor = sectionAnchorId(section)
    const label = stripInlineHtml(section.title)
    if (label && anchor) {
      out.push({ id: anchor, label, level: 2 })
    }
    const zones = Object.keys(studio.blocksByZone).filter((z) => z.startsWith(`${section.id}-`))
    for (const zone of zones) {
      for (const b of studio.blocksByZone[zone] ?? []) {
        if (b.type !== 'heading') continue
        const heading = stripHtml(b.config.content)
        if (heading) {
          out.push({
            id: `block-${b.id}`,
            label: heading,
            level: b.config.headingLevel === 3 ? 3 : 2,
          })
        }
      }
    }
  }
  return out
})

// Statsdata réutilisés dans l'article, dédupliqués : plusieurs blocs `sd-embed`
// peuvent pointer vers le même Statsdata source — on ne le liste qu'une fois
// (ancre = premier bloc rencontré).
const linkedDocs = computed(() => {
  const order: string[] = []
  const map = new Map<
    string,
    { slug: string; title: string; href: string; blocks: { id: string; label: string }[] }
  >()
  for (const b of contentBlocks.value) {
    if (b.type !== 'sd-embed' || !b.config.sourceBlockId) continue
    const slug = b.config.sourceSlug || b.id
    let doc = map.get(slug)
    if (!doc) {
      doc = {
        slug,
        title: b.config.sourceDocTitle || b.config.sourceSlug || 'Statsdata',
        href: b.config.sourceSlug
          ? publicContentPath('statsdata', b.config.sourceSlug, basePath.value)
          : `#block-${b.id}`,
        blocks: [],
      }
      map.set(slug, doc)
      order.push(slug)
    }
    const type = b.config.sourceBlockType
    doc.blocks.push({
      id: `block-${b.id}`,
      label: type ? (BLOCK_META[type]?.label ?? 'Bloc') : 'Bloc',
    })
  }
  return order.map((key) => map.get(key)!)
})

const linkedCount = computed(() => linkedDocs.value.reduce((n, doc) => n + doc.blocks.length, 0))
const statsHref = computed(() => linkedDocs.value.find((d) => d.href.startsWith('/'))?.href ?? null)
const readHref = computed(() => (tocEntries.value[0] ? `#${tocEntries.value[0].id}` : '#article'))

const listPath = computed(() => publicContentListPath('article', basePath.value))

// Chargé côté serveur (SSR) : Google reçoit titre, description, h1 et contenu.
// Au chargement initial, le client reprend le payload et le store Pinia hydraté.
const { data: pageData, error: loadError, status: loadStatus } = await useAsyncData(
  `article-${slug.value}-${domain.value ?? ''}${props.embed ? '-embed' : ''}`,
  async () => {
    try {
      const [doc, articles] = await Promise.all([
        fetchPublicStatsDataDocument(slug.value),
        props.embed
          ? Promise.resolve([] as StatsDataDocument[])
          : fetchPublicArticles({ sub_brand: domain.value }),
      ])
      studio.initPage(
        {
          id: doc.id,
          type: 'article',
          title: doc.title,
          status: doc.status as 'draft' | 'published',
          slug: slug.value,
        },
        doc.sections,
        doc.blocks,
        doc.pages,
      )
      return { doc, related: articles.filter((item) => item.slug !== doc.slug).slice(0, 2) }
    } catch (e) {
      throw createError({
        statusCode: getHttpErrorStatus(e, 404),
        statusMessage: 'Cet article est introuvable ou non publié.',
      })
    }
  },
)
if (loadError.value || !pageData.value) {
  throw createError({
    statusCode: loadError.value?.statusCode ?? 404,
    statusMessage: 'Cet article est introuvable ou non publié.',
    fatal: true,
  })
}
article.value = pageData.value.doc
relatedArticles.value = pageData.value.related
const loading = computed(() => loadStatus.value === 'pending')

useViewerDocRefresh(article, () => fetchPublicStatsDataDocument(slug.value))
</script>

<template>
  <div class="art-public sd-public ds-scope min-h-screen">
    <div v-if="loading" class="flex items-center justify-center py-40">
      <svg class="h-8 w-8 animate-spin text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
    </div>

    <template v-else-if="article">
      <!-- Embed : corps seul (si l’intégration est autorisée) -->
      <template v-if="embed">
        <main v-if="canEmbed" class="mx-auto max-w-[880px] px-4 py-6 sm:px-6">
          <ArticleBody />
          <a :href="shareUrl" target="_blank" rel="noopener" class="art-embed-credit">Réalisé avec Statsio →</a>
        </main>
        <div v-else class="py-16 text-center text-sm text-slate-500">
          L’intégration de ce contenu est désactivée.
        </div>
      </template>

      <!-- Page publique complète -->
      <template v-else>
        <ContentOwnerBar
          v-if="article.can_edit"
          type="article"
          :slug="article.slug ?? slug"
          :status="article.status"
        />

        <ArticleSubHeader
          :title="article.title"
          :reading-minutes="readingMinutes"
          :is-favorite="isFavorite"
          :is-following="isFollowing"
          :can-follow="canFollowChannel"
          :can-edit="article.can_edit ?? false"
          :share-url="shareUrl"
          :can-web-share="canWebShare"
          :share-targets="shareTargets"
          :can-embed="canEmbed"
          @toggle-favorite="toggleFavoriteAction"
          @toggle-follow="toggleFollowAction"
          @native-share="nativeShare"
          @open-embed="showEmbedModal = true"
        />

        <ArticleHero
          :doc="article"
          :reading-minutes="readingMinutes"
          :linked-count="linkedCount"
          :is-following="isFollowing"
          :can-follow="canFollowChannel"
          :read-href="readHref"
          :stats-href="statsHref"
          @toggle-follow="toggleFollowAction"
        />

        <div class="ds-max">
          <div class="art-body">
            <aside class="art-side">
              <ArticleToc :entries="tocEntries" :linked="linkedDocs" />
            </aside>

            <main class="art-main">
              <ArticleBody />

              <StatsDataUsefulBar
                tone="tranches"
                question="Cet article vous a été utile ?"
                :is-favorite="isFavorite"
                :is-following="isFollowing"
                :can-follow="canFollowChannel"
                :can-edit="article.can_edit ?? false"
                :share-url="shareUrl"
                :can-web-share="canWebShare"
                :share-targets="shareTargets"
                :can-embed="canEmbed"
                @toggle-favorite="toggleFavoriteAction"
                @toggle-follow="toggleFollowAction"
                @native-share="nativeShare"
                @open-embed="showEmbedModal = true"
              />

              <ContentCommentsSection
                v-if="!embed"
                :slug="slug"
                :enabled="article.comments_enabled !== false"
              />

              <section v-if="relatedArticles.length" class="art-also">
                <p class="art-links__lbl">À lire aussi</p>
                <div class="grid gap-5 sm:grid-cols-2">
                  <ArticleTeaserCard
                    v-for="item in relatedArticles"
                    :key="item.slug"
                    :article="item"
                  />
                </div>
                <RouterLink :to="listPath" class="art-also__more">Tous les articles →</RouterLink>
              </section>
            </main>
          </div>
        </div>

        <StatsDataEmbedModal
          v-if="canEmbed"
          v-model:open="showEmbedModal"
          :snippet="embedSnippet"
          :preview-url="embedUrl"
        />
      </template>
    </template>
  </div>
</template>

<style scoped>
.art-embed-credit {
  display: block;
  margin-top: 16px;
  color: var(--ds-faint);
  font: 500 11px/1.3 var(--ds-num);
  letter-spacing: 0.06em;
  text-align: center;
  text-decoration: none;
}
.art-embed-credit:hover {
  color: var(--ds-link);
}
.art-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 32px;
  padding-block: 8px 96px;
}
.art-side {
  display: none;
}
.art-main {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 28px;
}
@media (min-width: 981px) {
  .art-body {
    grid-template-columns: 250px minmax(0, 1fr);
    gap: 56px;
  }
  .art-side {
    display: flex;
    flex-direction: column;
    align-self: start;
  }
}
</style>
