<script setup lang="ts">
import { computed } from 'vue'
import DsBox from '@/components/ds/DsBox.vue'
import DsButton from '@/components/ds/DsButton.vue'
import DsLabel from '@/components/ds/DsLabel.vue'
import ChannelCatalogTile from './ChannelCatalogTile.vue'
import ChannelLead from './ChannelLead.vue'
import { groupChannelDossiers } from '@/lib/channel-detail'
import { publicContentPath, publicDossierPath } from '@/lib/content-display'
import { formatCatalogCount } from '@/lib/catalog-format'
import { useContentBasePath } from '@/composables/useContentBasePath'
import type { CatalogItem } from '@/types/catalog'
import type { ContentType } from '@/types/content-creation'
import type { ChannelProfileTab } from '@/composables/useChannelProfile'

const props = defineProps<{
  channelName: string
  description: string
  articles: CatalogItem[]
  statsData: CatalogItem[]
  surveys: CatalogItem[]
  loading: boolean
  isFavorited: (item: CatalogItem) => boolean
}>()
const emit = defineEmits<{
  favorite: [item: CatalogItem]
  'view-tab': [tab: ChannelProfileTab]
}>()

const basePath = useContentBasePath()

type Row = { item: CatalogItem; type: ContentType }

const rows = computed<Row[]>(() => {
  const all: Row[] = [
    ...props.statsData.map((item) => ({ item, type: 'statsdata' as const })),
    ...props.articles.map((item) => ({ item, type: 'article' as const })),
    ...props.surveys.map((item) => ({ item, type: 'survey' as const })),
  ]
  return all.sort(
    (a, b) =>
      new Date(b.item.updated_at ?? b.item.created_at ?? 0).getTime() -
      new Date(a.item.updated_at ?? a.item.created_at ?? 0).getTime(),
  )
})

const lead = computed(() => rows.value.find((row) => row.item.is_featured) ?? rows.value[0] ?? null)
const openSurvey = computed(
  () => props.surveys.find((item) => item.is_closed === false) ?? null,
)
const latest = computed(() =>
  rows.value
    .filter((row) => row !== lead.value && row.item.id !== openSurvey.value?.id)
    .slice(0, 4),
)
const dossiers = computed(() => groupChannelDossiers(rows.value.map((row) => row.item)))
const surveyTo = computed(() =>
  openSurvey.value ? publicContentPath('survey', openSurvey.value.slug, basePath.value) : '',
)
</script>

<template>
  <div class="over">
    <div class="over__main">
      <p v-if="!loading && !rows.length" class="over__empty">Cette chaîne n’a encore rien publié.</p>

      <section v-if="lead" class="over__blk" aria-labelledby="une-h">
        <div class="over__h">
          <h2 id="une-h">
            <template v-if="lead.item.is_featured">À la une <em>de la chaîne</em></template>
            <template v-else>Dernière <em>parution</em></template>
          </h2>
          <span v-if="lead.item.is_featured" class="over__meta">Choisi et épinglé par {{ channelName }}</span>
        </div>
        <ChannelLead :item="lead.item" :type="lead.type" />
      </section>

      <section v-if="latest.length" class="over__blk" aria-labelledby="new-h">
        <div class="over__h">
          <h2 id="new-h">Dernières <em>parutions</em></h2>
          <DsButton size="sm" variant="secondary" @click="emit('view-tab', 'articles')">
            Tout voir <span aria-hidden="true">→</span>
          </DsButton>
        </div>
        <div class="over__grid">
          <ChannelCatalogTile
            v-for="row in latest"
            :key="row.item.id"
            :item="row.item"
            :type="row.type"
            :favorited="isFavorited(row.item)"
            @favorite="emit('favorite', row.item)"
          />
        </div>
      </section>

      <section v-if="openSurvey" class="over__blk" aria-label="Sondage en cours">
        <DsBox class="over__poll">
          <div class="over__poll-top">
            <DsLabel>Sondage en cours · <b>question rapide</b></DsLabel>
            <span class="over__open"><i />Ouvert</span>
          </div>
          <h3>{{ openSurvey.title }}</h3>
          <p v-if="openSurvey.description" class="over__poll-ex">{{ openSurvey.description }}</p>
          <p class="over__meta">
            {{ formatCatalogCount(openSurvey.responses_count ?? 0) }} réponses
          </p>
          <DsButton size="sm" :to="surveyTo">Répondre <span aria-hidden="true">→</span></DsButton>
        </DsBox>
      </section>

      <section v-if="dossiers.length" class="over__blk" aria-labelledby="dos-h">
        <div class="over__h">
          <h2 id="dos-h">
            Rangée dans <em>{{ dossiers.length }} dossier{{ dossiers.length > 1 ? 's' : '' }}</em>
          </h2>
          <DsButton size="sm" variant="secondary" :to="`${basePath}/dossiers`">
            Tous les dossiers <span aria-hidden="true">→</span>
          </DsButton>
        </div>
        <div class="over__dossiers">
          <DsBox
            v-for="dossier in dossiers"
            :key="dossier.slug"
            as="article"
            interactive
            class="over__dmini"
          >
            <span class="over__fold" aria-hidden="true">
              <span>
                <i v-if="dossier.byType.statsdata" :style="{ height: `${10 + dossier.byType.statsdata * 4}px` }" />
                <i v-if="dossier.byType.article" class="is-article" :style="{ height: `${10 + dossier.byType.article * 4}px` }" />
                <i v-if="dossier.byType.survey" class="is-survey" :style="{ height: `${10 + dossier.byType.survey * 4}px` }" />
              </span>
            </span>
            <div>
              <NuxtLink :to="publicDossierPath(dossier.slug, basePath)"><h3>{{ dossier.name }}</h3></NuxtLink>
              <span class="over__meta">
                <b>{{ dossier.count }}</b> contenu{{ dossier.count > 1 ? 's' : '' }} de la chaîne
              </span>
            </div>
          </DsBox>
        </div>
      </section>
    </div>

    <aside v-if="description" class="over__side" aria-label="La chaîne en bref">
      <DsBox as="section" class="over__sbx">
        <DsLabel>À propos</DsLabel>
        <h2>En quelques mots</h2>
        <p>{{ description }}</p>
        <button type="button" class="over__more" @click="emit('view-tab', 'apropos')">
          Lire la fiche →
        </button>
      </DsBox>
    </aside>
  </div>
</template>

<style scoped>
.over {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 330px;
  gap: 44px;
  align-items: start;
  padding-block: 32px 0;
}
.over__blk {
  margin-bottom: 48px;
}
.over__h {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 18px;
}
.over__h h2,
.over__sbx h2,
.over__poll h3 {
  margin: 0;
  font-family: var(--ds-display);
  font-weight: 800;
  font-stretch: 90%;
  letter-spacing: -0.015em;
}
.over__h h2 {
  font-size: clamp(26px, 2.8vw, 36px);
  line-height: 1;
}
.over__h h2 em {
  font-style: normal;
  color: var(--ds-accent);
}
.over__meta {
  color: var(--ds-faint);
  font: 400 12px var(--ds-num);
}
.over__meta b {
  color: var(--ds-text);
  font-weight: 500;
}
.over__grid,
.over__dossiers {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}
.over__empty {
  color: var(--ds-muted);
  font-size: 15px;
}
.over__poll {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 22px 24px;
}
.over__poll-top {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
}
.over__poll h3 {
  font-size: clamp(24px, 2.4vw, 32px);
  line-height: 1.02;
}
.over__poll-ex {
  margin: 0;
  color: var(--ds-muted);
}
.over__open {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 4px 7px;
  border: 2px solid var(--ds-ok);
  border-radius: 999px;
  color: var(--ds-ok);
  font: 500 10px/1 var(--ds-num);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.over__open i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}
.over__dmini {
  display: grid;
  grid-template-columns: 86px minmax(0, 1fr);
  gap: 14px;
  align-items: center;
  padding: 14px;
}
.over__dmini h3 {
  margin: 0;
  font: 800 22px/1 var(--ds-display);
  font-stretch: 92%;
}
.over__dmini a:hover h3 {
  color: var(--ds-link);
}
.over__fold {
  position: relative;
  width: 86px;
  height: 64px;
}
.over__fold::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 38px;
  height: 12px;
  border: 2px solid var(--ds-ol);
  border-bottom: 0;
  border-radius: 5px 5px 0 0;
  background: var(--ds-surface);
}
.over__fold > span {
  position: absolute;
  inset: 10px 0 0;
  display: flex;
  gap: 3px;
  align-items: flex-end;
  overflow: hidden;
  padding-left: 8px;
  border: 2px solid var(--ds-ol);
  border-radius: 0 4px 4px 4px;
  background: var(--ds-tint);
}
.over__fold i {
  width: 14px;
  border: 1.5px solid var(--ds-ol);
  border-bottom: 0;
  border-radius: 3px 3px 0 0;
  background: var(--ds-t1);
}
.over__fold i.is-article {
  background: var(--ds-t2);
}
.over__fold i.is-survey {
  background: var(--ds-t5);
}
.over__side {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.over__sbx {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px 18px 16px;
}
.over__sbx h2 {
  font-size: 23px;
  line-height: 1;
  font-stretch: 94%;
}
.over__sbx p {
  margin: 0;
  color: var(--ds-muted);
  font-size: 14px;
}
.over__more {
  align-self: flex-start;
  padding: 0;
  border: 0;
  background: none;
  color: var(--ds-link);
  font: 700 14px var(--ds-ui);
  text-decoration: underline;
  text-underline-offset: 4px;
  cursor: pointer;
}
@media (max-width: 1040px) {
  .over {
    grid-template-columns: minmax(0, 1fr);
  }
}
@media (max-width: 620px) {
  .over__grid,
  .over__dossiers {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
