<script setup lang="ts">
import { computed } from 'vue'
import DsBox from '@/components/ds/DsBox.vue'
import DsButton from '@/components/ds/DsButton.vue'
import DsLabel from '@/components/ds/DsLabel.vue'
import DsMeta from '@/components/ds/DsMeta.vue'
import DsRichTitle from '@/components/ds/DsRichTitle.vue'
import DsSwatch from '@/components/ds/DsSwatch.vue'
import DsTypeGlyph from '@/components/ds/DsTypeGlyph.vue'
import DossierComposition from '@/components/dossiers/listing/DossierComposition.vue'
import DossierContentThumb from '@/components/dossiers/listing/DossierContentThumb.vue'
import { DOSSIER_CONTENT_TYPES, compositionParts } from '@/lib/dossiers-listing'
import { accentLastWord, type DossierFrise } from '@/lib/dossier-detail'
import type { CatalogItem } from '@/types/catalog'
import type { DossierContentCounts, DossierContentType } from '@/types/dossier'

const props = defineProps<{
  name: string
  description: string | null
  category: string | null
  opened: string
  counts: DossierContentCounts
  contentCount: number
  contributors: number
  updated: string
  following: boolean
  shareLabel: string
  type: DossierContentType | ''
  pile: CatalogItem[]
  frise: DossierFrise | null
  visibleIds: Set<string>
}>()

const emit = defineEmits<{
  'toggle-type': [type: DossierContentType]
  follow: []
  share: []
  open: [id: string]
}>()

const title = computed(() => accentLastWord(props.name))
const parts = computed(() => compositionParts(props.counts))
const typeCount = (type: DossierContentType) => props.counts[type] ?? 0

const PILE = [
  { x: '-30%', y: '8%', r: '-9deg' },
  { x: '-9%', y: '-6%', r: '-3deg' },
  { x: '12%', y: '4%', r: '4deg' },
  { x: '31%', y: '-8%', r: '10deg' },
]
const pileCards = computed(() => [...props.pile].slice(0, 4).reverse())

const friseHeight = computed(() => (props.frise ? 88 + (props.frise.maxLane + 1) * 32 : 0))
</script>

<template>
  <div class="dd-hero">
    <div class="dd-top">
      <span class="dd-tab">
        <svg width="16" height="14" viewBox="0 0 16 14" aria-hidden="true">
          <path
            d="M1 2.2C1 1.5 1.5 1 2.2 1H6l1.6 1.8h6.2c.7 0 1.2.5 1.2 1.2v7.8c0 .7-.5 1.2-1.2 1.2H2.2c-.7 0-1.2-.5-1.2-1.2Z"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linejoin="round"
          />
          <path d="M1 5.2h14" stroke="currentColor" stroke-width="1.8" />
        </svg>
        Dossier<span v-if="category" class="long">&nbsp;· {{ category }}</span> ·
        <b>{{ contentCount }} contenus</b>
      </span>
      <div class="dd-sheets" role="group" aria-label="Ouvrir le dossier à un intercalaire">
        <button
          v-for="meta in DOSSIER_CONTENT_TYPES"
          :key="meta.value"
          type="button"
          class="dd-sheet"
          :aria-pressed="type === meta.value"
          :aria-label="`Ouvrir à l'intercalaire ${meta.label}, ${typeCount(meta.value)}`"
          :style="{ background: meta.color, color: meta.ink }"
          @click="emit('toggle-type', meta.value)"
        >
          <DsTypeGlyph :kind="meta.glyph" :size="12" mono />
          <span>{{ meta.value === 'article' ? 'Articles' : meta.value === 'survey' ? 'Sondages' : 'StatsData' }}</span>
          {{ typeCount(meta.value) }}
        </button>
      </div>
    </div>

    <DsBox class="dd-box">
      <div class="dd-tx">
        <div class="dd-kicker">
          <span v-if="category" class="dd-kind">
            <DsSwatch color="var(--ds-t2)" :size="9" />{{ category }}
          </span>
          <DsMeta v-if="opened">Dossier ouvert le {{ opened }}</DsMeta>
        </div>
        <h1 class="dd-title">
          <DsRichTitle :parts="title" />
        </h1>
        <p v-if="description" class="dd-ex">{{ description }}</p>
        <DossierComposition :counts="counts" legend />
        <dl class="dd-facts">
          <div>
            <dt>Contenus</dt>
            <dd><b class="ds-tnum">{{ contentCount }}</b></dd>
          </div>
          <div>
            <dt>Chaînes</dt>
            <dd><b class="ds-tnum">{{ contributors }}</b></dd>
          </div>
          <div>
            <dt>Dernier ajout</dt>
            <dd>{{ updated }}</dd>
          </div>
        </dl>
        <div class="dd-acts">
          <DsButton :variant="following ? 'secondary' : 'primary'" :aria-pressed="following" @click="emit('follow')">
            <template v-if="following">
              <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
              </svg>
              Dossier suivi
            </template>
            <template v-else>+ Suivre le dossier</template>
          </DsButton>
          <DsButton variant="secondary" @click="emit('share')">
            <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="M8 1.5v9M4.5 5 8 1.5 11.5 5M2.5 9v4.5h11V9"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <span>{{ shareLabel }}</span>
          </DsButton>
        </div>
      </div>

      <div class="dd-pile" aria-hidden="true">
        <figure
          v-for="(item, index) in pileCards"
          :key="item.id"
          :style="{
            '--x': PILE[index]?.x,
            '--y': PILE[index]?.y,
            '--r': PILE[index]?.r,
            zIndex: index + 1,
          }"
          :title="item.title"
          @click="emit('open', item.id)"
        >
          <DossierContentThumb :type="item.type === 'article' || item.type === 'survey' ? item.type : 'statsdata'" :src="item.thumbnail_url" :seed="item.id" />
          <figcaption>
            <DsTypeGlyph
              :kind="item.type === 'article' ? 'article' : item.type === 'survey' ? 'sondage' : 'statsdata'"
              :size="12"
            />
            <span>{{ item.title }}</span>
          </figcaption>
        </figure>
        <span class="dd-cnt">
          <b class="ds-tnum">{{ contentCount }}</b>
          <span>contenus rangés</span>
        </span>
      </div>

      <div v-if="frise" class="dd-frise">
        <div class="dd-frise__h">
          <DsLabel as="span">Frise du dossier · <b>chaque ajout à sa date</b></DsLabel>
          <span class="dd-frise__leg">
            <span v-for="part in parts" :key="part.value">
              <DsTypeGlyph :kind="part.glyph" :size="13" :style="{ color: part.color }" />
              {{ part.label }}
            </span>
          </span>
        </div>
        <div class="dd-fz-wrap">
          <div class="dd-fz" role="group" :aria-label="frise.label" :style="{ height: `${friseHeight}px` }">
            <div
              v-for="(tick, index) in frise.ticks"
              :key="`${tick.label}-${index}`"
              class="dd-tick"
              :class="{ 'is-year': tick.year }"
              :style="{ left: `${tick.left}%` }"
            >
              <span>{{ tick.label }}</span>
            </div>
            <div class="dd-axis" />
            <div
              v-if="frise.nowLeft != null"
              class="dd-now"
              :class="{ 'is-end': frise.nowLeft > 82 }"
              :style="{ left: `${frise.nowLeft}%` }"
            >
              <span>Aujourd'hui</span>
            </div>
            <button
              v-for="mark in frise.marks"
              :key="mark.id"
              type="button"
              class="dd-fmk"
              :class="{ 'is-off': !visibleIds.has(mark.id) }"
              :style="{
                left: `${mark.left}%`,
                bottom: `${30 + mark.lane * 32}px`,
                '--stem': `${8 + mark.lane * 32}px`,
              }"
              :aria-label="`${mark.title}, ${mark.day}`"
              @click="emit('open', mark.id)"
            >
              <DsTypeGlyph
                :kind="mark.type === 'article' ? 'article' : mark.type === 'survey' ? 'sondage' : 'statsdata'"
                :size="15"
                mono
                :style="{ color: DOSSIER_CONTENT_TYPES.find((meta) => meta.value === mark.type)?.color }"
              />
              <span class="dd-ftip">{{ mark.title }}<small>{{ mark.day }}</small></span>
            </button>
          </div>
        </div>
      </div>
    </DsBox>
  </div>
</template>
