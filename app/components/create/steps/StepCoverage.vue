<script setup lang="ts">
import type { CoverageType } from '@/types/content-creation'
import { CONTINENTS, ALL_CONTINENT_VALUES, WORLD_COUNTRIES, MAJOR_FRENCH_CITIES } from '@/types/content-creation'
import AppSelect from '@/components/ui/AppSelect.vue'

defineProps<{
  coverageType: CoverageType
  coverageValues: string[]
}>()

const emit = defineEmits<{
  'update:coverageType': [CoverageType]
  'update:coverageValues': [string[]]
}>()

const coverageOptions = [
  { type: 'monde' as CoverageType, label: 'Mondial',   description: 'Par continents', icon: '🌍' },
  { type: 'pays'  as CoverageType, label: 'National',  description: 'Par pays',       icon: '🗺️' },
  { type: 'ville' as CoverageType, label: 'Local',     description: 'Par villes',     icon: '🏙️' },
]

const continentOptions = CONTINENTS.map((c) => ({ value: c.value, label: c.label }))
const countryOptions   = WORLD_COUNTRIES.map((c) => ({ value: c.value, label: c.label }))
const cityOptions      = MAJOR_FRENCH_CITIES.map((c) => ({ value: c.value, label: c.label }))

function selectType(type: CoverageType) {
  emit('update:coverageType', type)
  if (type === 'monde')  emit('update:coverageValues', [...ALL_CONTINENT_VALUES])
  else if (type === 'pays') emit('update:coverageValues', ['fr'])
  else emit('update:coverageValues', [])
}

function onValuesChange(v: string | number | boolean | null | (string | number | boolean | null)[]) {
  emit('update:coverageValues', (Array.isArray(v) ? v : [v]).filter(Boolean).map(String))
}
</script>

<template>
  <div class="space-y-5 py-2">
    <p class="text-sm text-slate-500">
      Définissez la portée géographique de votre contenu.
    </p>

    <!-- Coverage type selector -->
    <div class="grid grid-cols-3 gap-3">
      <button
        v-for="opt in coverageOptions"
        :key="opt.type"
        type="button"
        class="flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition hover:-translate-y-0.5"
        :class="coverageType === opt.type
          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-[0_8px_20px_color-mix(in_srgb,var(--color-primary)_15%,transparent)]'
          : 'border-slate-200 bg-white hover:border-[var(--color-primary)]/30'"
        @click="selectType(opt.type)"
      >
        <span class="text-2xl">{{ opt.icon }}</span>
        <span class="text-sm font-semibold" :class="coverageType === opt.type ? 'text-[var(--color-primary)]' : 'text-slate-700'">{{ opt.label }}</span>
        <span class="text-[11px] text-slate-500">{{ opt.description }}</span>
      </button>
    </div>

    <!-- Continent selector -->
    <div v-if="coverageType === 'monde'" class="space-y-2">
      <label class="block text-sm font-semibold text-slate-700">Continents</label>
      <AppSelect
        :model-value="coverageValues"
        :options="continentOptions"
        multiple
        searchable
        search-placeholder="Rechercher un continent…"
        placeholder="Sélectionner des continents…"
        @update:model-value="onValuesChange"
      />
      <button
        type="button"
        class="text-xs font-medium text-[var(--color-primary)] hover:underline"
        @click="emit('update:coverageValues', [...ALL_CONTINENT_VALUES])"
      >
        Tout sélectionner
      </button>
    </div>

    <!-- Country selector -->
    <div v-else-if="coverageType === 'pays'" class="space-y-2">
      <label class="block text-sm font-semibold text-slate-700">Pays</label>
      <AppSelect
        :model-value="coverageValues"
        :options="countryOptions"
        multiple
        searchable
        search-placeholder="Rechercher un pays…"
        placeholder="Sélectionner des pays…"
        @update:model-value="onValuesChange"
      />
    </div>

    <!-- City selector -->
    <div v-else-if="coverageType === 'ville'" class="space-y-2">
      <label class="block text-sm font-semibold text-slate-700">Villes (France)</label>
      <AppSelect
        :model-value="coverageValues"
        :options="cityOptions"
        multiple
        searchable
        search-placeholder="Rechercher une ville…"
        placeholder="Sélectionner des villes…"
        @update:model-value="onValuesChange"
      />
    </div>
  </div>
</template>
