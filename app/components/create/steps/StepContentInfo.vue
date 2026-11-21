<script setup lang="ts">
import DsChip from '@/components/ds/DsChip.vue'
import DsInput from '@/components/ds/DsInput.vue'
import DsLabel from '@/components/ds/DsLabel.vue'
import { CONTENT_COVERAGE_OPTIONS, type ContentCategory, type ContentCoverage } from '@/types/content-creation'
import { SUB_BRAND_OPTIONS, type SubBrand } from '@/types/sub-brand'

defineProps<{
  placeholder: string
  categoriesCatalog: ContentCategory[]
  categoriesLoading: boolean
}>()

const title = defineModel<string>('title', { required: true })
const domain = defineModel<SubBrand>('domain', { required: true })
const categories = defineModel<string[]>('categories', { required: true })
const coverage = defineModel<ContentCoverage | null>('coverage', { required: true })

function toggleCategory(slug: string) {
  const next = new Set(categories.value)
  if (next.has(slug)) next.delete(slug)
  else next.add(slug)
  categories.value = [...next]
}

function selectCoverage(value: ContentCoverage) {
  coverage.value = coverage.value === value ? null : value
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <div>
      <DsLabel class="mb-2">Nom du contenu</DsLabel>
      <DsInput v-model="title" type="text" :placeholder="placeholder" />
    </div>

    <div>
      <DsLabel class="mb-2">Domaine</DsLabel>
      <div class="flex flex-wrap gap-1.5">
        <DsChip
          v-for="opt in SUB_BRAND_OPTIONS"
          :key="opt.value"
          :pressed="domain === opt.value"
          @click="domain = opt.value"
        >{{ opt.label }}</DsChip>
      </div>
    </div>

    <div>
      <DsLabel class="mb-2">Catégories</DsLabel>
      <p v-if="categoriesLoading" class="text-[13px] text-[var(--ds-muted)]">Chargement…</p>
      <p v-else-if="!categoriesCatalog.length" class="text-[13px] text-[var(--ds-muted)]">
        Aucune catégorie pour ce domaine pour le moment.
      </p>
      <div v-else class="flex flex-wrap gap-1.5">
        <DsChip
          v-for="cat in categoriesCatalog"
          :key="cat.slug"
          :pressed="categories.includes(cat.slug)"
          @click="toggleCategory(cat.slug)"
        >{{ cat.name }}</DsChip>
      </div>
    </div>

    <div>
      <DsLabel class="mb-2">Couverture géographique</DsLabel>
      <div class="flex flex-wrap gap-1.5">
        <DsChip
          v-for="opt in CONTENT_COVERAGE_OPTIONS"
          :key="opt.value"
          :pressed="coverage === opt.value"
          @click="selectCoverage(opt.value)"
        >{{ opt.label }}</DsChip>
      </div>
    </div>
  </div>
</template>
