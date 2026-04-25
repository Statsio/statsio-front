<script setup lang="ts">
import type { StudioBlock, StudioBlockType, StudioDocumentSettings } from '@/types/studio-document'
import type { StudioDataSource, StudioDataSourceApi } from '@/types/studio-data-source'
import type { StatsDataNormalizationMapping } from '@/types/statsdata-query'
import type { SourcesFeedback } from '@/composables/useStudioDocument'
import type { StudioLeftTabId } from '@/components/studio/studio-left-dock.types'
import AppSelect from '@/components/ui/AppSelect.vue'
import {
  studioPaletteCharts,
  studioPaletteLayouts,
  studioPaletteMedia,
  studioPaletteTables,
  studioPaletteText,
  studioPaletteActions,
  studioPaletteLinks,
} from '@/data/studio-palette'
import StudioBlockPalette from '@/components/studio/StudioBlockPalette.vue'
import StudioBlockInspectorFields from '@/components/studio/StudioBlockInspectorFields.vue'
import StudioDataSourcesSection from '@/components/studio/StudioDataSourcesSection.vue'

const open = defineModel<boolean>('open', { default: false })
const tab = defineModel<StudioLeftTabId | null>('tab', { default: null })

const props = withDefaults(
  defineProps<{
    blocks: StudioBlock[]
    selectedId: string | null
    selectedBlock: StudioBlock | null
    dataSources: StudioDataSource[]
    settings: StudioDocumentSettings
    statsDataDocumentId: string | null
    remoteStudioSources: boolean
    /** Tableaux / graphiques : requêtes `POST .../query` + spec inline dans les blocs. */
    statsDataQueryMode: boolean
    sourcesFeedback: SourcesFeedback | null
    sourcesBusy?: boolean
    pages?: Array<{ id: string; name: string }>
    persistSourceNormalization?: (
      sourceId: string,
      mapping: StatsDataNormalizationMapping | null,
    ) => Promise<void>
  }>(),
  { sourcesBusy: false, statsDataQueryMode: false, pages: () => [] },
)

const emit = defineEmits<{
  'update:blocks': [StudioBlock[]]
  'update:settings': [StudioDocumentSettings]
  'select-block': [id: string]
  'add-block': [StudioBlockType]
  'update-block': [StudioBlock]
  'remove-block': [id: string]
  'duplicate-block': [id: string]
  'update-data-source': [StudioDataSource]
  'add-data-source': [StudioDataSource]
  'remove-data-source': [id: string]
  'sync-data-source': [StudioDataSource]
  'probe-api-source': [StudioDataSourceApi]
  'upload-data-source-file': [File]
  'dismiss-sources-feedback': []
  'refresh-normalized-source': [sourceId: string]
}>()

const patchSettings = (patch: Partial<StudioDocumentSettings>) => {
  emit('update:settings', { ...props.settings, ...patch })
}

const visibilitySelectOptions = [
  { value: 'private', label: 'Privé' },
  { value: 'team', label: 'Équipe' },
  { value: 'public', label: 'Public' },
]

const railItems: { id: StudioLeftTabId; label: string; short: string }[] = [
  { id: 'blocks', label: 'Blocs', short: '▦' },
  { id: 'data', label: 'Sources', short: '◧' },
  { id: 'import', label: 'Import', short: '↑' },
  { id: 'settings', label: 'Paramètres', short: '⚙' },
]

function railClick(id: StudioLeftTabId) {
  if (tab.value === id && open.value) {
    open.value = false
  } else {
    tab.value = id
    open.value = true
  }
}

function closeDrawer() {
  open.value = false
}

const panelTitles: Partial<Record<StudioLeftTabId, string>> = {
  blocks: 'Blocs',
  data: 'Sources de données',
  import: 'Importations',
  inspector: 'Propriétés du bloc',
  settings: 'Paramètres',
}
</script>

<template>
  <div
    class="fixed left-0 top-[4.5rem] z-30 flex h-[calc(100vh-4.5rem)] shrink-0 border-r border-slate-200 bg-slate-900 text-white"
    aria-label="Sidebar Studio"
  >
    <nav class="flex w-[4.5rem] shrink-0 flex-col items-stretch gap-0.5 py-2" aria-label="Outils du studio">
      <button
        v-for="item in railItems"
        :key="item.id"
        type="button"
        class="flex flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-[10px] font-medium leading-tight transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 motion-reduce:transition-none"
        :class="
          open && tab === item.id
            ? 'bg-white/15 text-white'
            : 'text-slate-300 hover:bg-white/10 hover:text-white'
        "
        @click="railClick(item.id)"
      >
        <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-sm font-semibold">{{ item.short }}</span>
        <span class="max-w-[3.5rem] text-center">{{ item.label }}</span>
      </button>
    </nav>

    <div
      class="h-full min-h-0 overflow-hidden border-l border-white/10 bg-white text-slate-900 transition-[width] duration-200 ease-out motion-reduce:transition-none"
      :class="open && tab ? 'w-[min(26rem,calc(100vw-4.5rem))]' : 'w-0 border-l-0'"
    >
      <div
        v-if="open && tab"
        class="flex h-full w-[min(26rem,calc(100vw-4.5rem))] flex-col"
      >
        <div class="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2.5">
          <h2 class="text-sm font-semibold text-slate-900">{{ panelTitles[tab] ?? '' }}</h2>
          <button
            type="button"
            class="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label="Replier le panneau"
            @click="closeDrawer"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 6l-6 6 6 6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto px-3 py-4">
            <template v-if="tab === 'blocks'">
              <section class="mb-6">
                <h3 class="mb-2 text-xs font-semibold text-slate-600">Texte</h3>
                <p class="mb-3 text-xs text-slate-500">Glissez ou ajoutez un bloc texte sur la page.</p>
                <StudioBlockPalette :items="studioPaletteText" @add="emit('add-block', $event)" />
              </section>

              <section class="mb-6">
                <h3 class="mb-2 text-xs font-semibold text-slate-600">Layouts</h3>
                <p class="mb-3 text-xs text-slate-500">Conteneurs en colonnes pour placer plusieurs blocs côte à côte.</p>
                <StudioBlockPalette :items="studioPaletteLayouts" @add="emit('add-block', $event)" />
              </section>

              <section class="mb-6">
                <h3 class="mb-2 text-xs font-semibold text-slate-600">Tableaux</h3>
                <p class="mb-3 text-xs text-slate-500">Tableaux liés à une source de données.</p>
                <StudioBlockPalette :items="studioPaletteTables" @add="emit('add-block', $event)" />
              </section>

              <section class="mb-6">
                <h3 class="mb-2 text-xs font-semibold text-slate-600">Graphiques</h3>
                <p class="mb-3 text-xs text-slate-500">Graphiques alimentés par vos sources.</p>
                <StudioBlockPalette :items="studioPaletteCharts" @add="emit('add-block', $event)" />
              </section>

              <section class="mb-6">
                <h3 class="mb-2 text-xs font-semibold text-slate-600">Actions</h3>
                <p class="mb-3 text-xs text-slate-500">Blocs interactifs avec actions configurables.</p>
                <StudioBlockPalette :items="studioPaletteActions" @add="emit('add-block', $event)" />
              </section>

              <section class="mb-6">
                <h3 class="mb-2 text-xs font-semibold text-slate-600">Liens</h3>
                <p class="mb-3 text-xs text-slate-500">Liens et boutons vers des URLs ou pages internes.</p>
                <StudioBlockPalette :items="studioPaletteLinks" @add="emit('add-block', $event)" />
              </section>
            </template>

            <template v-else-if="tab === 'data'">
              <StudioDataSourcesSection
                :data-sources="dataSources"
                :document-id="statsDataDocumentId"
                :remote-enabled="remoteStudioSources"
                :sources-busy="sourcesBusy"
                :feedback="sourcesFeedback"
                :persist-source-normalization="persistSourceNormalization"
                @update-source="emit('update-data-source', $event)"
                @add-source="emit('add-data-source', $event)"
                @remove-source="emit('remove-data-source', $event)"
                @sync-source="emit('sync-data-source', $event)"
                @probe-api="emit('probe-api-source', $event)"
                @upload-file="emit('upload-data-source-file', $event)"
                @dismiss-feedback="emit('dismiss-sources-feedback')"
                @refresh-normalized="emit('refresh-normalized-source', $event)"
              />
            </template>

            <template v-else-if="tab === 'import'">
              <p class="mb-3 text-xs text-slate-500">
                Import de fichiers : privilégiez CSV pour l’instant.
              </p>
              <div class="mb-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
                Déposez un fichier (bientôt)
              </div>
              <p class="mb-2 text-xs font-semibold text-slate-600">Bloc image</p>
              <StudioBlockPalette :items="studioPaletteMedia" @add="emit('add-block', $event)" />
            </template>

            <template v-else-if="tab === 'inspector'">
              <StudioBlockInspectorFields
                v-if="selectedBlock"
                :key="selectedBlock.id"
                id-prefix="dock-inspector"
                embedded
                :stats-data-query-mode="statsDataQueryMode"
                :selected-block="selectedBlock"
                :data-sources="dataSources"
                :pages="pages"
                @update-block="emit('update-block', $event)"
                @remove-block="emit('remove-block', $event)"
                @duplicate-block="emit('duplicate-block', $event)"
              />
              <p v-else class="text-sm leading-relaxed text-slate-500">
                Sélectionnez un bloc sur la page ou dans le plan pour afficher ses propriétés ici.
              </p>
            </template>

            <template v-else-if="tab === 'settings'">
              <section aria-labelledby="dock-settings-h">
                <h3 id="dock-settings-h" class="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Document
                </h3>
                <div class="flex flex-col gap-3">
                  <div>
                    <label class="mb-1 block text-xs font-semibold text-slate-600" for="dock-subtitle">Sous-titre</label>
                    <input
                      id="dock-subtitle"
                      :value="settings.subtitle"
                      type="text"
                      class="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/20 motion-reduce:transition-none"
                      placeholder="Accroche courte"
                      autocomplete="off"
                      @input="patchSettings({ subtitle: ($event.target as HTMLInputElement).value })"
                    />
                  </div>
                  <div>
                    <label class="mb-1 block text-xs font-semibold text-slate-600" for="dock-vis">Visibilité</label>
                    <AppSelect
                      id="dock-vis"
                      :model-value="settings.visibility"
                      :options="visibilitySelectOptions"
                      aria-label="Visibilité"
                      button-class="rounded-2xl bg-slate-50/80 px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20"
                      @change="(v) => patchSettings({ visibility: String(v) as StudioDocumentSettings['visibility'] })"
                    />
                  </div>
                </div>
              </section>
            </template>
        </div>
      </div>
    </div>
  </div>
</template>
