<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useStudioDatasetsStore } from '@/stores/studio-datasets'
import { blockColumnGroups, columnRefLabel, primarySourceId } from '@/lib/studio-columns'
import { blockDatasetIds } from '@/lib/studio-block-sources'
import { useColumnDrillIn } from '@/composables/useColumnDrillIn'
import { useSourceDrillIn } from '@/composables/useSourceDrillIn'
import type { DatasetMeta, StudioBlock } from '@/types/studio'
import FieldPicker from '@/components/studio/fields/FieldPicker.vue'
import FieldNote from '@/components/studio/fields/FieldNote.vue'
import FieldSegmented from '@/components/studio/fields/FieldSegmented.vue'
import AxisFieldRow from '@/components/studio/fields/AxisFieldRow.vue'
import TableColumnsField from '@/components/studio/fields/TableColumnsField.vue'
import BlockFiltersField from '@/components/studio/fields/BlockFiltersField.vue'
import { BASEMAPS } from '@/lib/map-basemaps'

const props = defineProps<{ block: StudioBlock; activeTab: string }>()
const studio = useStudioStore()
const datasets = useStudioDatasetsStore()
const drillIn = useColumnDrillIn()
const sourceDrill = useSourceDrillIn()

const CHART_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#f97316']

const block = computed(() => props.block)
const fm = computed(() => props.block.fieldMapping)
const cfg = computed(() => props.block.config)
const primaryId = computed(() => primarySourceId(props.block))
const hasSource = computed(() => Boolean(primaryId.value))

function updateConfig(key: string, value: unknown) { studio.updateBlockConfig(props.block.id, { [key]: value }) }
function updateMapping(key: string, value: unknown) { studio.updateBlockFieldMapping(props.block.id, { [key]: value }) }

watch(
  () => blockDatasetIds(props.block).join('|'),
  () => blockDatasetIds(props.block).forEach((id) => datasets.loadSchema(id)),
  { immediate: true },
)

const columnGroups = computed(() => blockColumnGroups(props.block, datasets))
const refLabel = (ref?: string | null) => (ref ? columnRefLabel(ref, props.block, datasets) : '')

const datasetName = computed(() =>
  props.block.datasetId
    ? (datasets.readyDatasets.find((d: DatasetMeta) => d.id === props.block.datasetId)?.name ?? 'Source sélectionnée')
    : 'Aucune source',
)

function pickColumn(title: string, current: string | null, onPick: (ref: string) => void, allowNone = false) {
  drillIn.open({
    block: props.block,
    title,
    allowNone,
    selected: current ? [current] : [],
    onCommit: (refs) => onPick(refs[0] ?? ''),
  })
}

// ─── Format des coordonnées : deux colonnes vs une seule ─────────────────────
const COORD_MODES = [
  { value: 'pair', label: 'Deux colonnes' },
  { value: 'single', label: 'Une colonne' },
]
const COORD_ORDERS = [
  { value: 'latlng', label: 'lat, lon' },
  { value: 'lnglat', label: 'lon, lat' },
]
const coordModeOverride = ref<'pair' | 'single' | null>(null)
const coordMode = computed<'pair' | 'single'>(() =>
  coordModeOverride.value ?? (fm.value.mapPointColumn ? 'single' : 'pair'),
)
function setCoordMode(mode: string | number) {
  coordModeOverride.value = mode as 'pair' | 'single'
  if (mode === 'single') studio.updateBlockFieldMapping(props.block.id, { latColumn: undefined, lngColumn: undefined })
  else studio.updateBlockFieldMapping(props.block.id, { mapPointColumn: undefined })
}

// ─── Auto-détection des colonnes de coordonnées ─────────────────────────────
const primaryColumns = computed<string[]>(() => {
  const g = columnGroups.value.find((grp) => grp.isPrimary) ?? columnGroups.value.find((grp) => !grp.sourceId)
  return g ? g.columns.map((c) => c.name) : []
})
watch(
  () => [hasSource.value, primaryColumns.value.join('|')].join('::'),
  () => {
    if (!hasSource.value || fm.value.latColumn || fm.value.lngColumn || fm.value.mapPointColumn) return
    const lat = primaryColumns.value.find((c) => /^(lat|latitude)$/i.test(c))
    const lng = primaryColumns.value.find((c) => /^(lng|lon|long|longitude)$/i.test(c))
    if (lat && lng) {
      studio.updateBlockFieldMapping(props.block.id, { latColumn: lat, lngColumn: lng })
      return
    }
    const combined = primaryColumns.value.find((c) =>
      /^(geo_?point(_2d)?|geopoint|coordonnees(_gps)?|coordinates|lat_?lo?ng?|wgs84|point_?geo|geoloc(alisation)?)$/i.test(c),
    )
    if (combined) {
      studio.updateBlockFieldMapping(props.block.id, { mapPointColumn: combined })
      coordModeOverride.value = 'single'
    }
  },
  { immediate: true },
)
</script>

<template>
  <div>
    <!-- ── Tab: Données ── -->
    <template v-if="activeTab === 'data'">
      <div class="flex flex-col gap-[11px] px-4 pb-1 pt-3">
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold text-[var(--studio-muted)]">Titre du bloc</label>
          <input
            type="text" class="cfg-input" placeholder="Ex : Localisation des stations"
            :value="cfg.title ?? ''"
            @input="updateConfig('title', ($event.target as HTMLInputElement).value || undefined)"
          />
        </div>

        <FieldPicker
          label="Source"
          :value="datasetName"
          :action="block.datasetId ? 'Changer' : 'Choisir'"
          @open="sourceDrill.open({ block, singleSource: true })"
        />

        <template v-if="hasSource">
          <div class="flex flex-col gap-2">
            <label class="text-xs font-semibold text-[var(--studio-muted)]">Coordonnées</label>
            <FieldSegmented
              :options="COORD_MODES"
              :model-value="coordMode"
              @update:model-value="setCoordMode"
            />

            <template v-if="coordMode === 'pair'">
              <AxisFieldRow
                label="Latitude"
                :value="refLabel(fm.latColumn)"
                @open="pickColumn('Colonne latitude', fm.latColumn ?? null, (r) => updateMapping('latColumn', r || undefined))"
              />
              <AxisFieldRow
                label="Longitude"
                :value="refLabel(fm.lngColumn)"
                @open="pickColumn('Colonne longitude', fm.lngColumn ?? null, (r) => updateMapping('lngColumn', r || undefined))"
              />
            </template>

            <template v-else>
              <AxisFieldRow
                label="Colonne"
                :value="refLabel(fm.mapPointColumn)"
                placeholder="lat + lon"
                @open="pickColumn('Colonne des coordonnées', fm.mapPointColumn ?? null, (r) => updateMapping('mapPointColumn', r || undefined))"
              />
              <FieldSegmented
                label="Ordre des valeurs"
                :options="COORD_ORDERS"
                :model-value="fm.mapPointOrder ?? 'latlng'"
                @update:model-value="updateMapping('mapPointOrder', $event === 'latlng' ? undefined : $event)"
              />
              <p class="text-[11px] leading-relaxed text-[var(--studio-faint)]">
                Formats reconnus : <code class="font-mono">48.85, 2.35</code>, WKT
                <code class="font-mono">POINT(2.35 48.85)</code>, tableau GeoJSON
                <code class="font-mono">[2.35, 48.85]</code>. L'ordre ci-dessus ne
                s'applique qu'aux formats « deux nombres séparés ».
              </p>
            </template>
          </div>

          <AxisFieldRow
            label="Titre"
            :value="refLabel(fm.mapTitleColumn)"
            placeholder="Titre de la fiche"
            clearable
            @open="pickColumn('Colonne titre du point', fm.mapTitleColumn ?? null, (r) => updateMapping('mapTitleColumn', r || undefined), true)"
            @clear="updateMapping('mapTitleColumn', undefined)"
          />

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-[var(--studio-muted)]">Fiche au survol</label>
            <TableColumnsField :block="block" section="columns" columns-heading="Lignes de la fiche (libellé : valeur)" />
          </div>

          <FieldNote>
            Un point par ligne du dataset. La fiche apparaît au survol d'un point.
          </FieldNote>
        </template>
        <FieldNote v-else>Choisissez une source de données.</FieldNote>
      </div>
    </template>

    <!-- ── Tab: Filtres ── -->
    <template v-if="activeTab === 'filters'">
      <div class="flex flex-col gap-[11px] px-4 pb-1 pt-3">
        <FieldNote v-if="!hasSource">Connectez d'abord une source dans l'onglet Données.</FieldNote>
        <template v-else>
          <BlockFiltersField :block="block" mode="primary" />
          <FieldNote>Les filtres réduisent les points affichés sur la carte.</FieldNote>

          <div class="flex items-center justify-between gap-2 pt-1">
            <label class="text-xs font-semibold text-[var(--studio-muted)]">Nombre max de points</label>
            <input
              type="number" min="1" max="100000" placeholder="Illimité"
              class="cfg-input w-[100px] [appearance:textfield]"
              :value="cfg.rowLimit ?? ''"
              @input="updateConfig('rowLimit', ($event.target as HTMLInputElement).value ? Number(($event.target as HTMLInputElement).value) : null)"
            />
          </div>
        </template>
      </div>
    </template>

    <!-- ── Tab: Style ── -->
    <template v-if="activeTab === 'style'">
      <div class="flex flex-col gap-4 px-4 pb-1 pt-3">
        <div class="flex flex-col gap-2">
          <label class="text-xs font-semibold text-[var(--studio-muted)]">Fond de carte</label>
          <div class="grid grid-cols-3 gap-1.5">
            <button
              v-for="b in BASEMAPS" :key="b.id"
              type="button"
              class="rounded-[10px] border-[1.5px] px-2 py-2 text-[11.5px] font-bold transition-colors"
              :class="(cfg.mapBasemap ?? 'clair') === b.id
                ? 'border-[var(--color-primary)] bg-[var(--studio-accent-wash)] text-[var(--studio-tag-ink)]'
                : 'border-[var(--studio-line-strong)] text-[var(--studio-muted)] hover:border-[var(--color-primary)]'"
              :title="b.hint"
              @click="updateConfig('mapBasemap', b.id === 'clair' ? undefined : b.id)"
            >{{ b.label }}</button>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-xs font-semibold text-[var(--studio-muted)]">Couleur des marqueurs</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="color in CHART_COLORS" :key="color"
              class="h-7 w-7 rounded-full border-[3px] transition-all hover:scale-110"
              :style="{ backgroundColor: color }"
              :class="(cfg.mapMarkerColor ?? '#8b5cf6') === color ? 'border-white outline outline-2 outline-slate-700 scale-110' : 'border-white shadow-sm'"
              @click="updateConfig('mapMarkerColor', color)"
            />
          </div>
          <p v-if="fm.mapColorColumn" class="text-[11px] text-[var(--studio-faint)]">
            Ignoré : la couleur est pilotée par la colonne ci-dessous.
          </p>
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-xs font-semibold text-[var(--studio-muted)]">Pilotage par colonne</label>
          <AxisFieldRow
            label="Couleur"
            :value="refLabel(fm.mapColorColumn)"
            placeholder="Couleur fixe"
            clearable
            :class="!hasSource ? 'pointer-events-none opacity-40' : ''"
            @open="pickColumn('Colonne de couleur', fm.mapColorColumn ?? null, (r) => updateMapping('mapColorColumn', r || undefined), true)"
            @clear="updateMapping('mapColorColumn', undefined)"
          />
          <AxisFieldRow
            label="Taille"
            :value="refLabel(fm.mapSizeColumn)"
            placeholder="Taille fixe"
            clearable
            :class="!hasSource ? 'pointer-events-none opacity-40' : ''"
            @open="pickColumn('Colonne de taille (numérique)', fm.mapSizeColumn ?? null, (r) => updateMapping('mapSizeColumn', r || undefined), true)"
            @clear="updateMapping('mapSizeColumn', undefined)"
          />
        </div>

        <div v-if="hasSource" class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold text-[var(--studio-muted)]">Couleur conditionnelle</label>
          <TableColumnsField :block="block" section="rules" />
          <p class="text-[11px] leading-relaxed text-[var(--studio-faint)]">
            Colore un marqueur selon la valeur d'une colonne (positif / négatif, seuil,
            max / min de la colonne). Prioritaire sur la couleur ci-dessus.
          </p>
        </div>

        <div class="toggle-row" @click="updateConfig('mapAutoFit', cfg.mapAutoFit === false ? undefined : false)">
          <div>
            <span class="text-sm text-[var(--studio-ink)]">Cadrer automatiquement sur les points</span>
            <p class="mt-0.5 text-[11px] text-[var(--studio-faint)]">Ajuste le zoom pour englober tous les points.</p>
          </div>
          <div class="toggle shrink-0" :class="cfg.mapAutoFit !== false ? 'toggle-on' : 'toggle-off'">
            <div class="toggle-knob" :class="cfg.mapAutoFit !== false ? 'translate-x-3.5' : 'translate-x-0.5'" />
          </div>
        </div>

        <div class="flex items-center justify-between gap-2">
          <label class="text-xs font-semibold text-[var(--studio-muted)]">Hauteur (px)</label>
          <input
            type="number" min="200" max="800" placeholder="360"
            class="cfg-input w-[100px] [appearance:textfield]"
            :value="cfg.mapHeight ?? ''"
            @input="updateConfig('mapHeight', ($event.target as HTMLInputElement).value ? Number(($event.target as HTMLInputElement).value) : undefined)"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
@reference "tailwindcss";
.cfg-input {
  box-sizing: border-box;
  width: 100%;
  padding: 11px 13px;
  border-radius: 10px;
  border: 1.5px solid var(--studio-line-strong);
  font-size: 13px;
  color: var(--studio-ink);
  background: #fff;
}
.cfg-input:focus { outline: none; border-color: var(--color-primary); }
.toggle-row {
  @apply flex items-center justify-between px-3.5 py-3 cursor-pointer transition-colors;
  border-radius: 12px;
  border: 1px solid var(--studio-line);
}
.toggle      { @apply w-8 h-5 rounded-full relative shrink-0 transition-colors; }
.toggle-on   { background: var(--color-primary); }
.toggle-off  { background: color-mix(in srgb, var(--studio-ink) 16%, transparent); }
.toggle-knob { @apply absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform; }
</style>
