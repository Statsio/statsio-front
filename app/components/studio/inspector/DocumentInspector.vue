<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useStudioStore } from '@/stores/studio'
import { useStudioMetaStore } from '@/stores/studio-meta'
import { useMediaLibrary } from '@/composables/useMediaLibrary'
import { studioChecks } from '@/lib/studio-checks'
import { glyphForContentType } from '@/lib/ds/types'
import { contentPropertiesPath, publicContentPath } from '@/lib/content-display'
import { SUB_BRAND_OPTIONS, normalizeSubBrand, type SubBrand } from '@/types/sub-brand'
import DsTypeGlyph from '@/components/ds/DsTypeGlyph.vue'
import StudioIcon from '@/components/studio/ui/StudioIcon.vue'

/**
 * Inspecteur quand rien n'est sélectionné : propriétés du document + liste
 * « Avant de publier ». Titre → store `studio` (autosave) ; le reste → `studio-meta`.
 */
const studio = useStudioStore()
const meta = useStudioMetaStore()
const media = useMediaLibrary()

const type = computed(() => studio.content?.type ?? 'statsdata')
const TYPE_LABEL = { statsdata: 'StatsData', article: 'Article', survey: 'Sondage' } as const

const versionLabel = computed(() => {
  const v = studio.content?.published_version
  return v ? `v${v} publiée` : 'brouillon'
})

const domain = computed<SubBrand>(() => normalizeSubBrand(meta.doc?.sub_brand))
const hasCover = computed(() => !!meta.doc?.thumbnail_url?.trim())

const checks = computed(() =>
  studioChecks({
    type: type.value,
    title: studio.content?.title,
    description: meta.doc?.description,
    hasCover: hasCover.value,
    surveyKind: meta.doc?.survey_kind ?? studio.content?.survey_kind,
    blocks: studio.blocks,
  }),
)

const publicUrl = computed(() => {
  const slug = studio.content?.slug
  return slug ? `statsio.fr${publicContentPath(type.value, slug)}` : null
})
const settingsPath = computed(() => contentPropertiesPath(type.value, studio.content?.slug))

function setTitle(e: Event) {
  const v = (e.target as HTMLTextAreaElement).value.trim()
  if (v) studio.setTitle(v)
}
function setChapo(e: Event) {
  meta.patch({ description: (e.target as HTMLTextAreaElement).value.trim() || null }, 600)
}
function pickCover() {
  media.open({ mode: 'pick', directory: 'studio-content-thumbnails', onSelect: (m) => void meta.setThumbnail(m.id) })
}

function goTo(blockId: string) {
  studio.selectBlock(blockId)
  requestAnimationFrame(() => {
    document.querySelector(`[data-block-id="${blockId}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  })
}
</script>

<template>
  <div class="flex h-full flex-col gap-[18px] overflow-y-auto px-4 pb-12 pt-4">
    <div class="st-ins-h">
      <span class="st-tg"><DsTypeGlyph :kind="glyphForContentType(type)" :size="20" /></span>
      <div class="min-w-0">
        <span class="st-lbl">{{ TYPE_LABEL[type] }} · {{ versionLabel }}</span>
        <h2 class="st-h2">Propriétés</h2>
      </div>
    </div>

    <div class="st-fset">
      <div class="flex flex-col gap-1.5">
        <label class="st-lbl" for="d-title">Titre</label>
        <textarea id="d-title" class="studio-input resize-y" rows="2" :value="studio.content?.title ?? ''" @change="setTitle" />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="st-lbl" for="d-chapo">Chapô</label>
        <textarea
          id="d-chapo"
          class="studio-input resize-y"
          rows="3"
          :disabled="!meta.doc"
          :value="meta.doc?.description ?? ''"
          placeholder="Une ou deux phrases qui donnent envie de lire"
          @input="setChapo"
        />
      </div>
    </div>

    <div v-if="meta.doc" class="st-fset">
      <div class="flex flex-col gap-1.5">
        <span class="st-lbl">Domaine</span>
        <div class="st-seg" role="group" aria-label="Domaine">
          <button
            v-for="o in SUB_BRAND_OPTIONS"
            :key="o.value"
            type="button"
            :aria-pressed="domain === o.value"
            @click="meta.patch({ sub_brand: o.value })"
          >{{ o.label }}</button>
        </div>
      </div>

      <div class="flex flex-col gap-1.5">
        <span class="st-lbl">Dossier</span>
        <div class="flex flex-wrap gap-1.5">
          <span v-for="d in meta.doc.dossiers ?? []" :key="d.id" class="st-pill">{{ d.name }}</span>
          <span v-if="!(meta.doc.dossiers ?? []).length" class="st-meta">Aucun dossier · à choisir à la publication</span>
        </div>
      </div>

      <div v-if="type !== 'survey'" class="st-swr">
        <span>Image de couverture<small>Affichée dans le hero et sur la carte.</small></span>
        <button type="button" class="st-addl !py-0" @click="pickCover">
          <StudioIcon name="image" :size="14" />{{ hasCover ? 'Changer' : 'Choisir' }}
        </button>
      </div>

      <div class="flex flex-col gap-1.5">
        <span class="st-lbl">Adresse</span>
        <span class="st-meta break-all">{{ publicUrl ?? 'Attribuée au premier enregistrement' }}</span>
        <RouterLink v-if="settingsPath" :to="settingsPath" class="st-addl !py-0">Adresse, catégories, accès →</RouterLink>
      </div>
    </div>

    <div class="st-fset">
      <span class="st-lbl">Avant de publier</span>
      <ul class="st-check">
        <li v-for="c in checks" :key="c.id" :class="c.ok ? 'ok' : 'ko'">
          <i aria-hidden="true">{{ c.ok ? '✓' : '!' }}</i>
          <span>
            {{ c.label }}
            <button v-if="!c.ok && c.blockId" type="button" @click="goTo(c.blockId)">Voir</button>
          </span>
        </li>
      </ul>
    </div>

    <p class="st-hint">Cliquez sur un bloc du canevas pour le régler. Échap revient ici.</p>
    <p v-if="meta.error" class="st-notice" role="alert">{{ meta.error }}</p>
  </div>
</template>
