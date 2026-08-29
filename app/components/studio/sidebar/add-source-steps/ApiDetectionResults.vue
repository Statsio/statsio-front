<script setup lang="ts">
import type { DetectStructureResult } from '@/api/data-sources'

defineProps<{ result: DetectStructureResult }>()
</script>

<template>
  <div class="flex flex-col gap-3">
    <SourceCompatibilityCard v-if="result.capabilities" :capabilities="result.capabilities" />
    <DetectedFiltersTable v-if="result.queryMapping" :query-mapping="result.queryMapping" />
    <DatasetSchemaPreview
      v-if="result.schema.length"
      :columns="result.schema"
      :rows="result.sampleRows"
      :row-count-hint="result.rowCountHint"
      max-height="12rem"
    />
  </div>
</template>
