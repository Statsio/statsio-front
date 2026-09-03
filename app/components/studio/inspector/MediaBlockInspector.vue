<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { fetchPublicCatalog } from '@/api/studio'
import { CONTENT_TYPE_META } from '@/lib/content-display'
import type { CatalogItem } from '@/types/catalog'
import type { BlockConfig, ContentType, StudioBlock } from '@/types/studio'
import InspectorSection from '@/components/studio/fields/InspectorSection.vue'
import FieldText from '@/components/studio/fields/FieldText.vue'
import FieldTextarea from '@/components/studio/fields/FieldTextarea.vue'
import FieldSegmented from '@/components/studio/fields/FieldSegmented.vue'
import FieldList from '@/components/studio/fields/FieldList.vue'
import FieldNote from '@/components/studio/fields/FieldNote.vue'
import FieldImage from '@/components/media/FieldImage.vue'

const props = defineProps<{ block: StudioBlock }>()
const studio = useStudioStore()

const TOKEN_HINT = '{{ colonne }}'

function set<K extends keyof BlockConfig>(key: K, value: BlockConfig[K]) {
  studio.updateBlockConfig(props.block.id, { [key]: value })
}

// ─── Grille de champs (field-grid) ──────────────────────────────────────────
const gridItems = computed(() => props.block.config.fieldGridItems ?? [])
function saveGrid(items: { label: string; value: string }[]) {
  set('fieldGridItems', items.length ? items : undefined)
}
function addGridItem() { saveGrid([...gridItems.value, { label: '', value: '' }]) }
function updateGridItem(i: number, key: 'label' | 'value', v: string) {
  saveGrid(gridItems.value.map((it, idx) => (idx === i ? { ...it, [key]: v } : it)))
}
function removeGridItem(i: number) { saveGrid(gridItems.value.filter((_, idx) => idx !== i)) }

// ─── Image (bloc image) — via le sélecteur de médias partagé ─────────────────
const imageUrl = computed({
  get: () => props.block.config.imageUrl ?? '',
  set: (v: string) => set('imageUrl', v || undefined),
})
const imageMediaId = computed({
  get: () => props.block.config.imageMediaId,
  set: (v: number | undefined) => set('imageMediaId', v),
})
const linkImage = computed({
  get: () => props.block.config.linkImage ?? '',
  set: (v: string) => set('linkImage', v || undefined),
})
const linkImageMediaId = computed({
  get: () => props.block.config.linkImageMediaId,
  set: (v: number | undefined) => set('linkImageMediaId', v),
})

const WIDTHS = [
  { label: 'Petite', value: 'sm' },
  { label: 'Moyenne', value: 'md' },
  { label: 'Grande', value: 'lg' },
  { label: 'Pleine', value: 'full' },
]
const ALIGNS = [
  { label: 'Gauche', value: 'left' },
  { label: 'Centre', value: 'center' },
  { label: 'Droite', value: 'right' },
]

// ─── Button / link-card / retenir (inline) ──────────────────────────────────

const isStatsdataDoc = computed(() => studio.content?.type === 'statsdata')

const BUTTON_VARIANTS = [
  { label: 'Primaire', value: 'primary' },
  { label: 'Sombre', value: 'secondary' },
  { label: 'Contour', value: 'outline' },
]
const BUTTON_SIZES = [
  { label: 'SM', value: 'sm' },
  { label: 'MD', value: 'md' },
  { label: 'LG', value: 'lg' },
]
const RETENIR_COLORS = [
  { v: 'violet', bg: 'bg-[var(--color-primary)]', ring: 'ring-violet-400' },
  { v: 'emerald', bg: 'bg-emerald-500', ring: 'ring-emerald-400' },
  { v: 'amber', bg: 'bg-amber-400', ring: 'ring-amber-400' },
  { v: 'blue', bg: 'bg-blue-500', ring: 'ring-blue-400' },
]

// Carte de lien : cible (URL externe / contenu publié / page de ce Statsdata).
const linkMode = computed(() => props.block.config.linkMode ?? 'url')
const LINK_MODES = computed(() => [
  { label: 'URL externe', value: 'url' },
  { label: 'Contenu du site', value: 'content' },
  ...(isStatsdataDoc.value ? [{ label: 'Page de ce contenu', value: 'page' }] : []),
])

const CONTENT_TYPES: { label: string; value: ContentType }[] = [
  { label: 'Article', value: 'article' },
  { label: 'StatsData', value: 'statsdata' },
  { label: 'Sondage', value: 'survey' },
]
const contentSearchType = ref<ContentType>(props.block.config.linkContentType ?? 'article')
const contentQuery = ref('')
const contentResults = ref<CatalogItem[]>([])
const contentSearching = ref(false)

let contentSearchToken = 0
watch([contentQuery, contentSearchType], async ([q]) => {
  const token = ++contentSearchToken
  if (!q.trim()) { contentResults.value = []; return }
  contentSearching.value = true
  try {
    const res = await fetchPublicCatalog({ type: contentSearchType.value, q: q.trim(), per_page: 8 })
    if (token === contentSearchToken) contentResults.value = res.data
  } catch {
    if (token === contentSearchToken) contentResults.value = []
  } finally {
    if (token === contentSearchToken) contentSearching.value = false
  }
})

function pickContent(item: CatalogItem) {
  studio.updateBlockConfig(props.block.id, {
    linkContentType: contentSearchType.value,
    linkContentSlug: item.slug,
    linkTitle: item.title,
    linkDescription: item.description ?? '',
    linkImage: item.thumbnail_url ?? '',
    linkImageMediaId: undefined,
    linkDomain: undefined,
  })
  contentQuery.value = ''
  contentResults.value = []
}
function changeContent() {
  studio.updateBlockConfig(props.block.id, { linkContentSlug: undefined, linkContentType: undefined })
}
const pickedContentLabel = computed(() => {
  const t = props.block.config.linkContentType
  return t ? CONTENT_TYPE_META[t].label : ''
})

const availablePages = computed(() => studio.pages)
function pickPage(pageId: string) {
  const page = studio.pages.find((p) => p.id === pageId)
  studio.updateBlockConfig(props.block.id, {
    linkPageId: pageId,
    linkTitle: page?.title ?? '',
    linkDescription: page?.description ?? '',
  })
}
function changePage() {
  studio.updateBlockConfig(props.block.id, { linkPageId: undefined })
}
const pickedPage = computed(() => studio.pages.find((p) => p.id === props.block.config.linkPageId))
</script>

<template>
  <div class="flex flex-col gap-5 px-4 py-4">
    <!-- IMAGE -->
    <template v-if="block.type === 'image'">
      <InspectorSection label="Image">
        <FieldImage v-model="imageUrl" v-model:media-id="imageMediaId" ratio="video" />
        <FieldText
          :model-value="block.config.imageAlt ?? ''"
          label="Texte alternatif"
          placeholder="Description de l'image"
          @update:model-value="set('imageAlt', $event)"
        />
        <FieldText
          :model-value="block.config.imageCaption ?? ''"
          label="Légende"
          placeholder="Source : …"
          @update:model-value="set('imageCaption', $event)"
        />
      </InspectorSection>
      <InspectorSection label="Mise en page">
        <FieldSegmented
          :model-value="block.config.imageWidth ?? 'full'"
          label="Largeur"
          :options="WIDTHS"
          @update:model-value="set('imageWidth', $event as BlockConfig['imageWidth'])"
        />
        <FieldSegmented
          :model-value="block.config.imageAlign ?? 'center'"
          label="Alignement"
          :options="ALIGNS"
          @update:model-value="set('imageAlign', $event as BlockConfig['imageAlign'])"
        />
      </InspectorSection>
    </template>

    <!-- VIDEO -->
    <template v-else-if="block.type === 'video'">
      <InspectorSection label="Vidéo">
        <FieldText
          :model-value="block.config.videoUrl ?? ''"
          label="Lien vidéo"
          hint="YouTube · Vimeo · Dailymotion"
          placeholder="https://www.youtube.com/watch?v=…"
          @update:model-value="set('videoUrl', $event)"
        />
        <FieldText
          :model-value="block.config.videoCaption ?? ''"
          label="Légende"
          placeholder="Description de la vidéo"
          @update:model-value="set('videoCaption', $event)"
        />
        <FieldNote>Lecteur intégré en iframe au ratio 16:9, avec badge du fournisseur détecté automatiquement.</FieldNote>
      </InspectorSection>
    </template>

    <!-- MAP -->
    <template v-else-if="block.type === 'map'">
      <InspectorSection label="Point GPS">
        <FieldText :model-value="block.config.mapLat ?? ''" label="Latitude" :placeholder="`ex. 45.75781 ou ${TOKEN_HINT}`" @update:model-value="set('mapLat', $event)" />
        <FieldText :model-value="block.config.mapLng ?? ''" label="Longitude" :placeholder="`ex. 4.83201 ou ${TOKEN_HINT}`" @update:model-value="set('mapLng', $event)" />
        <FieldText :model-value="block.config.mapLabel ?? ''" label="Libellé" placeholder="Nom du lieu (optionnel)" @update:model-value="set('mapLabel', $event)" />
        <FieldNote>Les jetons {{ TOKEN_HINT }} sont résolus — utile sur une page générée par valeur.</FieldNote>
      </InspectorSection>
    </template>

    <!-- FIELD-GRID -->
    <template v-else-if="block.type === 'field-grid'">
      <InspectorSection label="Grille de champs">
        <FieldSegmented
          :model-value="String(block.config.fieldGridColumns ?? 3)"
          label="Colonnes"
          :options="[{ label: '2', value: '2' }, { label: '3', value: '3' }, { label: '4', value: '4' }]"
          @update:model-value="set('fieldGridColumns', Number($event) as 2 | 3 | 4)"
        />
        <div class="flex flex-col gap-2">
          <div v-for="(it, i) in gridItems" :key="i" class="flex items-center gap-1.5">
            <input :value="it.label" type="text" placeholder="Libellé" class="mb-input w-[110px] shrink-0" @change="updateGridItem(i, 'label', ($event.target as HTMLInputElement).value)" />
            <input :value="it.value" type="text" placeholder="Valeur ({{ '{{jeton}}' }} ok)" class="mb-input min-w-0 flex-1" @change="updateGridItem(i, 'value', ($event.target as HTMLInputElement).value)" />
            <button type="button" class="shrink-0 text-[12px] text-[var(--studio-faint)] hover:text-red-400" @click="removeGridItem(i)">✕</button>
          </div>
          <button type="button" class="text-[11px] font-bold text-[var(--color-primary)]" @click="addGridItem">+ Ajouter une paire</button>
        </div>
      </InspectorSection>
    </template>

    <!-- BUTTON -->
    <template v-else-if="block.type === 'button'">
      <InspectorSection label="Contenu">
        <FieldText :model-value="block.config.buttonLabel ?? ''" label="Label du bouton" placeholder="En savoir plus" @update:model-value="set('buttonLabel', $event)" />
        <FieldText :model-value="block.config.buttonUrl ?? ''" label="URL de destination" placeholder="https://…" @update:model-value="set('buttonUrl', $event)" />
      </InspectorSection>
      <InspectorSection label="Style">
        <FieldSegmented :model-value="block.config.buttonVariant ?? 'primary'" label="Variante" :options="BUTTON_VARIANTS" @update:model-value="set('buttonVariant', $event as BlockConfig['buttonVariant'])" />
        <FieldSegmented :model-value="block.config.buttonSize ?? 'md'" label="Taille" :options="BUTTON_SIZES" @update:model-value="set('buttonSize', $event as BlockConfig['buttonSize'])" />
        <FieldSegmented :model-value="block.config.buttonAlign ?? 'center'" label="Alignement" :options="ALIGNS" @update:model-value="set('buttonAlign', $event as BlockConfig['buttonAlign'])" />
      </InspectorSection>
    </template>

    <!-- LINK-CARD -->
    <template v-else-if="block.type === 'link-card'">
      <InspectorSection label="Destination">
        <FieldSegmented :model-value="linkMode" label="Type de lien" :options="LINK_MODES" @update:model-value="set('linkMode', $event as BlockConfig['linkMode'])" />

        <template v-if="linkMode === 'url'">
          <FieldText :model-value="block.config.linkUrl ?? ''" label="URL" placeholder="https://…" @update:model-value="set('linkUrl', $event)" />
        </template>

        <template v-else-if="linkMode === 'content'">
          <template v-if="!block.config.linkContentSlug">
            <FieldSegmented :model-value="contentSearchType" label="Type de contenu" :options="CONTENT_TYPES" @update:model-value="contentSearchType = $event as ContentType" />
            <input v-model="contentQuery" type="search" class="studio-input" placeholder="Rechercher un contenu publié…" />
            <p v-if="contentSearching" class="text-[12px] text-[var(--studio-faint)]">Recherche…</p>
            <div v-else-if="contentResults.length" class="flex flex-col gap-1.5">
              <button
                v-for="item in contentResults" :key="item.slug" type="button"
                class="flex flex-col items-start rounded-[10px] border-[1.5px] border-[var(--studio-line)] bg-white px-3 py-2 text-left transition-colors hover:border-[var(--color-primary)]"
                @click="pickContent(item)"
              >
                <span class="text-[13px] font-bold text-[var(--studio-ink)]">{{ item.title }}</span>
                <span class="text-[11.5px] text-[var(--studio-faint)]">{{ item.publisher.name }}</span>
              </button>
            </div>
            <p v-else-if="contentQuery.trim()" class="text-[12px] text-[var(--studio-faint)]">Aucun résultat.</p>
          </template>
          <div v-else class="flex items-center justify-between gap-2 rounded-[10px] bg-[var(--studio-wash)] px-3 py-2">
            <span class="min-w-0 truncate text-[13px] font-bold text-[var(--studio-ink)]">
              {{ pickedContentLabel }} · {{ block.config.linkTitle || block.config.linkContentSlug }}
            </span>
            <button type="button" class="shrink-0 text-[12px] font-bold text-[var(--color-primary)]" @click="changeContent">Changer</button>
          </div>
        </template>

        <template v-else-if="linkMode === 'page'">
          <template v-if="!pickedPage">
            <p v-if="!availablePages.length" class="text-[12px] text-[var(--studio-faint)]">Ce Statsdata n'a pas encore d'autre page.</p>
            <div v-else class="flex flex-col gap-1.5">
              <button
                v-for="p in availablePages" :key="p.id" type="button"
                class="flex items-center gap-1.5 rounded-[10px] border-[1.5px] border-[var(--studio-line)] bg-white px-3 py-2 text-left transition-colors hover:border-[var(--color-primary)]"
                @click="pickPage(p.id)"
              >
                <span v-if="p.icon">{{ p.icon }}</span>
                <span class="text-[13px] font-bold text-[var(--studio-ink)]">{{ p.title }}</span>
              </button>
            </div>
          </template>
          <div v-else class="flex items-center justify-between gap-2 rounded-[10px] bg-[var(--studio-wash)] px-3 py-2">
            <span class="min-w-0 truncate text-[13px] font-bold text-[var(--studio-ink)]">{{ pickedPage.title }}</span>
            <button type="button" class="shrink-0 text-[12px] font-bold text-[var(--color-primary)]" @click="changePage">Changer</button>
          </div>
        </template>
      </InspectorSection>

      <InspectorSection label="Présentation">
        <FieldText :model-value="block.config.linkTitle ?? ''" label="Titre" placeholder="Titre affiché" @update:model-value="set('linkTitle', $event)" />
        <FieldTextarea :model-value="block.config.linkDescription ?? ''" label="Description" :rows="3" placeholder="Résumé ou accroche…" @update:model-value="set('linkDescription', $event)" />
        <FieldText v-if="linkMode === 'url'" :model-value="block.config.linkDomain ?? ''" label="Domaine" placeholder="lemonde.fr" @update:model-value="set('linkDomain', $event)" />
        <FieldImage v-model="linkImage" v-model:media-id="linkImageMediaId" label="Image (optionnel)" ratio="wide" />
      </InspectorSection>
    </template>

    <!-- RETENIR -->
    <template v-else>
      <InspectorSection label="À retenir">
        <FieldText :model-value="block.config.retenirTitle ?? ''" label="Titre du bloc" placeholder="À retenir" @update:model-value="set('retenirTitle', $event)" />
        <FieldList
          :model-value="block.config.retenirItems ?? []"
          label="Points clés"
          add-label="+ Ajouter un point"
          placeholder="Point important…"
          reorderable
          @update:model-value="set('retenirItems', $event.length ? $event : undefined)"
        />
        <div>
          <label class="mb-1.5 block text-xs font-semibold text-[var(--studio-muted)]">Couleur</label>
          <div class="flex gap-3">
            <button
              v-for="c in RETENIR_COLORS" :key="c.v" type="button"
              class="h-8 w-8 shrink-0 rounded-full border-2 transition-all"
              :class="[c.bg, (block.config.retenirColor ?? 'violet') === c.v ? `ring-2 ring-offset-2 ${c.ring} scale-110 border-transparent` : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105']"
              @click="set('retenirColor', c.v as BlockConfig['retenirColor'])"
            />
          </div>
        </div>
      </InspectorSection>
    </template>
  </div>
</template>

<style scoped>
@reference "tailwindcss";
.mb-input {
  box-sizing: border-box;
  padding: 8px 10px;
  border-radius: 9px;
  border: 1.5px solid var(--studio-line-strong);
  font-size: 12px;
  color: var(--studio-ink);
  background: #fff;
}
.mb-input:focus { outline: none; border-color: var(--color-primary); }
</style>
