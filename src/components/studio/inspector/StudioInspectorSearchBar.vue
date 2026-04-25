<script setup lang="ts">
import { computed } from 'vue'
import type { StudioBlock, StudioBlockPayload, StudioSearchBarConfig, StudioBlockAction } from '@/types/studio-document'
import type { StudioDataSource } from '@/types/studio-data-source'
import { sourceToTabular } from '@/types/studio-data-source'
import type { StatsDataQueryRequestV2 } from '@/types/statsdata-query-v2'
import { normalizedFieldOptionsForSource } from '@/components/studio/inspector/statsdata-query-editor'
import StudioFormulaEditor from '@/components/studio/inspector/parts/StudioFormulaEditor.vue'
import { highlightFormulaHtml } from '@/lib/statsdata-formula'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppButton from '@/components/ui/AppButton.vue'

const props = defineProps<{
  block: Extract<StudioBlock, { type: 'search_bar' }>
  idPrefix: string
  dataSources: StudioDataSource[]
  pages: Array<{ id: string; name: string }>
  statsDataQueryMode?: boolean
}>()

const emit = defineEmits<{
  'push-payload': [StudioBlockPayload]
}>()

const sourceOptions = computed(() => [
  { value: '', label: '— Aucune source —' },
  ...props.dataSources.map((s) => ({ value: s.id, label: s.name })),
])

const selectedSource = computed(() => props.dataSources.find((s) => s.id === props.block.config.sourceId))

const availableColumns = computed(() => {
  if (!selectedSource.value) return []

  // En mode StatsData avec query configurée
  if (props.statsDataQueryMode && props.block.config.query) {
    const q = props.block.config.query as any
    if (q?.specVersion === 2) {
      const sel = Array.isArray(q.select) ? q.select : []
      return sel.map((c: any) => String(c?.label ?? '').trim()).filter(Boolean)
    }
    const cols = q?.columns?.length ? q.columns : []
    return cols.map((c: any) => String(c?.label ?? '').trim()).filter(Boolean)
  }

  // Pour les sources API, utiliser normalizedFieldOptionsForSource
  if (selectedSource.value.kind === 'api') {
    return normalizedFieldOptionsForSource(selectedSource.value)
  }

  // Par défaut, utiliser les colonnes de la source
  const tabular = sourceToTabular(selectedSource.value)
  return tabular.headers
})

const searchableFields = computed(() => {
  if (!selectedSource.value) return []

  // En mode StatsData avec query configurée, permettre de chercher dans tous les champs sources
  if (props.statsDataQueryMode && props.block.config.query) {
    const q = props.block.config.query as StatsDataQueryRequestV2
    const out: string[] = []
    for (const srcEntry of q.sources ?? []) {
      const alias = String(srcEntry?.alias ?? '').trim()
      const sourceId = String(srcEntry?.sourceId ?? '').trim()
      if (!alias || !sourceId) continue
      const src = props.dataSources.find((s) => s.id === sourceId)
      if (!src) continue
      const fields = normalizedFieldOptionsForSource(src)
      for (const f of fields) out.push(`${alias}.${f}`)
    }
    return out
  }

  // Pour les sources API, utiliser normalizedFieldOptionsForSource
  if (selectedSource.value.kind === 'api') {
    return normalizedFieldOptionsForSource(selectedSource.value)
  }

  // Par défaut, utiliser les colonnes de la source
  const tabular = sourceToTabular(selectedSource.value)
  return tabular.headers
})

const pageOptions = computed(() => [
  { value: '', label: '— Aucune page —' },
  ...props.pages.map((p) => ({ value: p.id, label: p.name })),
])

const actionTypeOptions = [
  { value: '', label: '— Aucune action —' },
  { value: 'navigate_to_page', label: 'Naviguer vers une page' },
  { value: 'set_filters', label: 'Appliquer des filtres' },
]

const currentActionType = computed(() => props.block.config.onResultClick?.type ?? '')

const patchConfig = (partial: Partial<StudioSearchBarConfig>) => {
  const config: StudioSearchBarConfig = { ...props.block.config, ...partial }
  emit('push-payload', { type: 'search_bar', config })
}

const updateSourceId = (sourceId: string) => {
  patchConfig({
    sourceId,
    searchColumns: [],
    displayFormulas: [],
    query: undefined
  })
}

const updatePlaceholder = (placeholder: string) => {
  patchConfig({ placeholder })
}

const toggleSearchColumn = (column: string) => {
  const cols = [...props.block.config.searchColumns]
  const idx = cols.indexOf(column)
  if (idx >= 0) {
    cols.splice(idx, 1)
  } else {
    cols.push(column)
  }
  patchConfig({ searchColumns: cols })
}

const addDisplayFormula = () => {
  const formulas = [...(props.block.config.displayFormulas || [])]
  // Ajouter un exemple avec la première colonne disponible si elle existe
  const exampleCol = availableColumns.value[0] || 'colonne'
  formulas.push({
    label: '',
    formula: exampleCol
  })
  patchConfig({ displayFormulas: formulas })
}

const updateFormulaLabel = (index: number, label: string) => {
  const formulas = [...(props.block.config.displayFormulas || [])]
  if (formulas[index]) {
    formulas[index] = { ...formulas[index]!, label }
    patchConfig({ displayFormulas: formulas })
  }
}

const updateFormulaExpression = (index: number, formula: string) => {
  const formulas = [...(props.block.config.displayFormulas || [])]
  if (formulas[index]) {
    formulas[index] = { ...formulas[index]!, formula }
    patchConfig({ displayFormulas: formulas })
  }
}

const removeFormula = (index: number) => {
  const formulas = [...(props.block.config.displayFormulas || [])]
  formulas.splice(index, 1)
  patchConfig({ displayFormulas: formulas })
}

const formulaFieldButtons = computed(() => {
  const seen = new Set<string>()
  const out: { label: string; insert: string; hint?: string }[] = []
  for (const field of availableColumns.value) {
    const label = String(field ?? '').trim()
    if (!label || seen.has(label)) continue
    seen.add(label)
    out.push({ label, insert: label })
  }
  return out
})

const updateActionType = (type: string) => {
  if (!type) {
    patchConfig({ onResultClick: undefined })
    return
  }

  if (type === 'navigate_to_page') {
    patchConfig({
      onResultClick: {
        type: 'navigate_to_page',
        targetPageId: '',
        passColumns: []
      }
    })
  } else if (type === 'set_filters') {
    patchConfig({
      onResultClick: {
        type: 'set_filters',
        filters: {}
      }
    })
  }
}

const updateTargetPageId = (pageId: string) => {
  const action = props.block.config.onResultClick
  if (action?.type === 'navigate_to_page') {
    patchConfig({
      onResultClick: {
        ...action,
        targetPageId: pageId
      }
    })
  }
}

const togglePassColumn = (column: string) => {
  const action = props.block.config.onResultClick
  if (action?.type === 'navigate_to_page') {
    const cols = [...(action.passColumns ?? [])]
    const idx = cols.indexOf(column)
    if (idx >= 0) {
      cols.splice(idx, 1)
    } else {
      cols.push(column)
    }
    patchConfig({
      onResultClick: {
        ...action,
        passColumns: cols
      }
    })
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Source de données -->
    <section class="space-y-3">
      <div class="flex flex-col gap-1">
        <label class="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Source de données
        </label>
        <div class="h-px bg-slate-100 mb-2" />
        <label class="text-xs font-semibold text-slate-600" :for="`${idPrefix}-source`">
          Source
        </label>
        <AppSelect
          :id="`${idPrefix}-source`"
          :model-value="block.config.sourceId"
          :options="sourceOptions"
          size="md"
          button-class="rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:ring-2 focus:ring-primary/20"
          @change="(v) => updateSourceId(String(v))"
        />
      </div>

      <div v-if="selectedSource">
        <label class="text-xs font-semibold text-slate-600 mb-2 block" :for="`${idPrefix}-placeholder`">
          Placeholder
        </label>
        <input
          :id="`${idPrefix}-placeholder`"
          :value="block.config.placeholder"
          type="text"
          class="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm outline-none transition focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/20"
          placeholder="Rechercher..."
          @input="updatePlaceholder(($event.target as HTMLInputElement).value)"
        />
      </div>
    </section>

    <!-- Colonnes de recherche -->
    <section v-if="selectedSource" class="space-y-3">
      <div class="flex flex-col gap-1">
        <label class="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Colonnes de recherche
        </label>
        <div class="h-px bg-slate-100 mb-2" />
        <p class="text-xs text-slate-500 mb-2">
          Sélectionnez les colonnes dans lesquelles effectuer la recherche
        </p>
        <div v-if="searchableFields.length > 0" class="space-y-2">
          <label
            v-for="col in searchableFields"
            :key="col"
            class="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-slate-50 cursor-pointer"
          >
            <input
              type="checkbox"
              :checked="block.config.searchColumns.includes(col)"
              class="rounded border-slate-300 text-primary focus:ring-2 focus:ring-primary/20"
              @change="toggleSearchColumn(col)"
            />
            <span class="text-sm text-slate-700">{{ col }}</span>
          </label>
        </div>
        <p v-else class="text-xs text-slate-500 italic">
          Aucune colonne disponible pour cette source
        </p>
      </div>
    </section>

    <!-- Affichage des résultats -->
    <section v-if="selectedSource" class="space-y-3">
      <div class="flex flex-col gap-1">
        <label class="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Affichage des résultats
        </label>
        <div class="h-px bg-slate-100 mb-2" />
        <p class="text-xs text-slate-500 mb-2">
          Personnalisez comment afficher chaque résultat de recherche
        </p>

        <div v-if="block.config.displayFormulas && block.config.displayFormulas.length > 0" class="space-y-3">
          <div
            v-for="(formula, index) in block.config.displayFormulas"
            :key="index"
            class="rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-2"
          >
            <div class="flex items-center justify-between">
              <label class="text-xs font-semibold text-slate-600">Libellé</label>
              <button
                type="button"
                class="text-xs text-rose-600 hover:text-rose-700"
                @click="removeFormula(index)"
              >
                Supprimer
              </button>
            </div>
            <input
              :value="formula.label"
              type="text"
              class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
              placeholder="Ex: Ville"
              @input="updateFormulaLabel(index, ($event.target as HTMLInputElement).value)"
            />

            <label class="text-xs font-semibold text-slate-600 block">Valeur à afficher</label>
            <StudioFormulaEditor
              :model-value="formula.formula"
              :field-buttons="formulaFieldButtons"
              placeholder="Ex: nom_ville + ' (' + code_postal + ')'"
              :highlighted-html="highlightFormulaHtml(formula.formula) || '<span class=&quot;text-slate-400&quot;>nom + &quot; (&quot; + code + &quot;)&quot;</span>'"
              :placeholder-html="'<span class=&quot;text-slate-400&quot;>nom + &quot; (&quot; + code + &quot;)&quot;</span>'"
              :rows="2"
              @update:model-value="updateFormulaExpression(index, $event)"
            />
            <p class="text-xs text-slate-500">
              Utilisez les noms de colonnes et + pour concaténer. Ex: ville + ' (' + cp + ')'
            </p>
          </div>
        </div>

        <AppButton
          variant="secondary"
          size="sm"
          type="button"
          class="w-full rounded-xl"
          @click="addDisplayFormula"
        >
          + Ajouter un champ d'affichage
        </AppButton>

        <p v-if="availableColumns.length === 0" class="text-xs text-slate-500 italic mt-2">
          Aucune colonne disponible pour cette source
        </p>
      </div>
    </section>

    <!-- Actions au clic -->
    <section class="space-y-3">
      <div class="flex flex-col gap-1">
        <label class="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Action au clic sur un résultat
        </label>
        <div class="h-px bg-slate-100 mb-2" />
        <label class="text-xs font-semibold text-slate-600" :for="`${idPrefix}-action-type`">
          Type d'action
        </label>
        <AppSelect
          :id="`${idPrefix}-action-type`"
          :model-value="currentActionType"
          :options="actionTypeOptions"
          size="md"
          button-class="rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:ring-2 focus:ring-primary/20"
          @change="(v) => updateActionType(String(v))"
        />
      </div>

      <!-- Configuration navigation vers page -->
      <div v-if="currentActionType === 'navigate_to_page'" class="space-y-3 pl-4 border-l-2 border-primary/20">
        <div>
          <label class="text-xs font-semibold text-slate-600 mb-2 block" :for="`${idPrefix}-target-page`">
            Page cible
          </label>
          <AppSelect
            :id="`${idPrefix}-target-page`"
            :model-value="(block.config.onResultClick as any)?.targetPageId ?? ''"
            :options="pageOptions"
            size="md"
            button-class="rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:ring-2 focus:ring-primary/20"
            @change="(v) => updateTargetPageId(String(v))"
          />
        </div>

        <div v-if="availableColumns.length > 0">
          <label class="text-xs font-semibold text-slate-600 mb-2 block">
            Colonnes à passer en filtres
          </label>
          <p class="text-xs text-slate-500 mb-2">
            Les valeurs de ces colonnes seront passées comme filtres à la page cible
          </p>
          <div class="space-y-2">
            <label
              v-for="col in availableColumns"
              :key="col"
              class="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-slate-50 cursor-pointer"
            >
              <input
                type="checkbox"
                :checked="((block.config.onResultClick as any)?.passColumns ?? []).includes(col)"
                class="rounded border-slate-300 text-primary focus:ring-2 focus:ring-primary/20"
                @change="togglePassColumn(col)"
              />
              <span class="text-sm text-slate-700">{{ col }}</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Configuration filtres -->
      <div v-if="currentActionType === 'set_filters'" class="space-y-3 pl-4 border-l-2 border-primary/20">
        <p class="text-xs text-slate-500">
          Les filtres seront appliqués aux blocs de la page courante en fonction des valeurs du résultat cliqué.
        </p>
      </div>
    </section>
  </div>
</template>
