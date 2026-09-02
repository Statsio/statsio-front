<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { refDebounced } from '@vueuse/core'
import StatsDataSettingsCard from './StatsDataSettingsCard.vue'
import CardPreviewMini from '@/components/content/CardPreviewMini.vue'
import {
  fetchStatsDataCardPreview,
  fetchStatsDataEmbeddableBlocks,
  type EmbeddableBlockSummary,
} from '@/api/studio'
import type { CardPreview } from '@/types/catalog'

/**
 * Réglage « Visuel de la carte » : choix du bloc graphique qui alimente le
 * mini-graphe de la carte de catalogue du Statsdata, avec aperçu live.
 * `modelValue` = `card_block_id` (null = automatique / premier graphique).
 */
const props = defineProps<{ modelValue: string | null; slug: string; categories?: string[] }>()
const emit = defineEmits<{ 'update:modelValue': [string | null] }>()

const CHART_TYPES = ['bar', 'line', 'pie']

const blocks = ref<EmbeddableBlockSummary[]>([])
const loadingBlocks = ref(true)
const preview = ref<CardPreview | null>(null)
const loadingPreview = ref(false)

const selected = computed({
  get: () => props.modelValue,
  set: (v: string | null) => emit('update:modelValue', v),
})

const chartBlocks = computed(() => blocks.value.filter((b) => CHART_TYPES.includes(b.type)))

const selectedForPreview = refDebounced(
  computed(() => selected.value),
  300,
)

watch(
  () => props.slug,
  async (slug) => {
    if (!slug) return
    loadingBlocks.value = true
    try {
      const res = await fetchStatsDataEmbeddableBlocks(slug)
      blocks.value = res.blocks ?? []
    } catch {
      blocks.value = []
    } finally {
      loadingBlocks.value = false
    }
  },
  { immediate: true },
)

watch(
  [() => props.slug, selectedForPreview],
  async ([slug, blockId]) => {
    if (!slug) return
    loadingPreview.value = true
    try {
      preview.value = await fetchStatsDataCardPreview(slug, blockId ?? undefined)
    } catch {
      preview.value = { empty: true }
    } finally {
      loadingPreview.value = false
    }
  },
  { immediate: true },
)

const hasRealPreview = computed(
  () => preview.value && !preview.value.empty && (preview.value.series?.length ?? 0) > 0,
)
</script>

<template>
  <StatsDataSettingsCard
    title="Visuel de la carte"
    description="Le mini-graphe affiché sur la carte du Statsdata dans les catalogues."
  >
    <div class="flex flex-col gap-5 lg:flex-row">
      <div class="min-w-0 flex-1">
        <p v-if="loadingBlocks" class="text-[13px] text-[#18181f]/45">Chargement des graphiques…</p>

        <p v-else-if="chartBlocks.length === 0" class="text-[13px] text-[#18181f]/55">
          Ajoutez un graphique (barres, courbe ou camembert) dans le Studio pour personnaliser le
          visuel de la carte.
        </p>

        <div v-else class="flex flex-col gap-1.5">
          <label
            class="flex cursor-pointer items-center gap-2.5 rounded-[10px] border px-3.5 py-2.5 text-[13px] transition-colors"
            :class="
              selected == null
                ? 'border-primary bg-primary/5'
                : 'border-[#18181f]/[0.12] hover:bg-slate-50'
            "
          >
            <input
              type="radio"
              :value="null"
              :checked="selected == null"
              class="accent-primary"
              @change="selected = null"
            />
            <span class="font-semibold text-[#18181f]">Automatique</span>
            <span class="text-[#18181f]/45">— premier graphique de la page</span>
          </label>

          <label
            v-for="b in chartBlocks"
            :key="b.id"
            class="flex cursor-pointer items-center gap-2.5 rounded-[10px] border px-3.5 py-2.5 text-[13px] transition-colors"
            :class="
              selected === b.id
                ? 'border-primary bg-primary/5'
                : 'border-[#18181f]/[0.12] hover:bg-slate-50'
            "
          >
            <input
              type="radio"
              :value="b.id"
              :checked="selected === b.id"
              class="accent-primary"
              @change="selected = b.id"
            />
            <span class="min-w-0 flex-1 truncate font-semibold text-[#18181f]">{{ b.title }}</span>
            <span v-if="b.datasetName" class="shrink-0 truncate text-[11px] text-[#18181f]/45">{{
              b.datasetName
            }}</span>
          </label>
        </div>
      </div>

      <div class="w-full shrink-0 lg:w-[300px]">
        <CardPreviewMini
          v-if="hasRealPreview && preview"
          :preview="preview"
          :categories="categories"
        />
        <div
          v-else
          class="flex h-[150px] items-center justify-center rounded-[14px] bg-[#faf9fd] text-center text-[12px] text-[#18181f]/45"
        >
          {{ loadingPreview ? 'Aperçu…' : 'Aucun aperçu disponible' }}
        </div>
      </div>
    </div>
  </StatsDataSettingsCard>
</template>
