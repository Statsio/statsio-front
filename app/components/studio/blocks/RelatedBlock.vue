<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useBlockData, rowKey } from '@/composables/useBlockData'
import { useStudioStore } from '@/stores/studio'
import { formatDisplayValue } from '@/utils/statsDataFormat'
import { buildFanOutSegment, findFanOutTarget } from '@/lib/statsdata-fanout'
import { slugify } from '@/lib/slug'
import type { StudioBlock } from '@/types/studio'

/**
 * Puces vers des enregistrements liés (communes voisines…). Applique les filtres
 * du bloc, limite à `recordLimit`. Chaque puce lie vers la page par valeur
 * (`/statsdata/{slug}/{valeur}`) quand le document a un paramètre fan-out.
 */
const props = defineProps<{ block: StudioBlock; readonly?: boolean; scope?: Record<string, string> }>()
const studio = useStudioStore()
const route = useRoute()

const limit = computed(() => Math.max(1, props.block.config.rowLimit ?? 8))

const { data, isLoading, error } = useBlockData(
  () => props.block, props.readonly, () => props.scope,
  () => ({ limit: limit.value }),
)

const cols = computed(() => props.block.fieldMapping.columns ?? [])
const labelCol = computed(() => cols.value[0] ?? '')
const valueCol = computed(() => cols.value[1] ?? '')

const fanOut = computed(() => findFanOutTarget(studio.pages))
const docSlug = computed(() => String(route.params.slug ?? studio.content?.slug ?? ''))

const items = computed(() => {
  const labelKey = rowKey(data.value, labelCol.value)
  const valueKey = valueCol.value ? rowKey(data.value, valueCol.value) : ''
  return (data.value?.rows ?? []).slice(0, limit.value).map((r) => {
    const label = formatDisplayValue(r[labelKey], '')
    let href: string | undefined
    if (fanOut.value && docSlug.value) {
      const seg = buildFanOutSegment(fanOut.value.param, r) || slugify(String(r[labelKey] ?? ''))
      if (seg) href = `/statsdata/${docSlug.value}/${seg}`
    }
    return { label, value: valueKey ? formatDisplayValue(r[valueKey], '') : '', href }
  }).filter((it) => it.label)
})
</script>

<template>
  <div>
    <div v-if="isLoading" class="py-6 text-center text-sm text-[var(--studio-faint)]">Chargement…</div>
    <div v-else-if="error" class="py-6 text-center text-sm text-red-500">{{ error }}</div>
    <div v-else-if="!block.datasetId || !labelCol" class="py-6 text-center text-xs text-[var(--studio-faint)]">Configurer les données →</div>
    <div v-else-if="!items.length" class="py-6 text-center text-sm text-[var(--studio-faint)]">Aucun élément lié</div>

    <div v-else class="flex flex-wrap gap-2">
      <component
        :is="item.href ? 'a' : 'span'"
        v-for="(item, i) in items"
        :key="i"
        :href="item.href"
        class="flex items-center gap-2 rounded-full border-[1.5px] border-[var(--studio-line)] px-3.5 py-2 text-[12.5px] font-semibold text-[var(--studio-ink)]"
        :class="item.href ? 'transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--studio-accent-wash)]' : ''"
      >
        <span>{{ item.label }}</span>
        <span v-if="item.value" class="mono text-[11px] font-medium text-[color:color-mix(in_srgb,var(--studio-ink)_50%,transparent)]">{{ item.value }}</span>
      </component>
    </div>
  </div>
</template>
