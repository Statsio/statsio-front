<script setup lang="ts">
import AppSparkline from '@/components/ui/AppSparkline.vue'
import type { StatsDataDocument } from '@/api/studio'
import { seededSparklinePoints } from '@/utils/statsDataVisuals'
import { formatRowCount, relativeUpdate } from '@/utils/statsDataFormat'
import { statsDataDetailPath } from '@/lib/content-display'
import { useContentBasePath } from '@/composables/useContentBasePath'

defineProps<{
  items: StatsDataDocument[]
  emptyText: string
}>()

const basePath = useContentBasePath()

function rowCount(doc: StatsDataDocument) {
  return doc.datasets?.[0]?.row_count
}
</script>

<template>
  <div v-if="items.length" class="flex flex-col gap-3.5 py-8">
    <RouterLink
      v-for="doc in items"
      :key="doc.id"
      :to="statsDataDetailPath(doc, basePath)"
      class="card group flex items-center gap-6 px-6 py-5 transition hover:-translate-y-0.5 hover:shadow-md sm:gap-8 sm:px-7"
    >
      <div class="min-w-0 flex-1">
        <p
          class="truncate text-[16px] font-bold tracking-[-0.01em] text-slate-900 transition-colors group-hover:text-[var(--color-primary)]"
        >
          {{ doc.title }}
        </p>
        <p class="mono mt-1.5 text-[11px] text-slate-400">
          {{ formatRowCount(rowCount(doc)) ?? '—' }} · {{ relativeUpdate(doc.updated_at) ?? '—' }}
        </p>
      </div>

      <div class="hidden w-32 flex-none sm:block">
        <AppSparkline :points="seededSparklinePoints(doc.id)" color="var(--color-primary)" :height="34" />
      </div>

      <span
        v-if="doc.categories?.[0]"
        class="mono flex-none rounded-full bg-slate-100 px-3.5 py-2 text-[11px] font-semibold text-slate-500"
      >
        {{ doc.categories[0] }}
      </span>
    </RouterLink>
  </div>
  <p v-else class="py-8 text-sm text-[#18181f]/50">{{ emptyText }}</p>
</template>
