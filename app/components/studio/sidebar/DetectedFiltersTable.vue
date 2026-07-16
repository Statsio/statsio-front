<script setup lang="ts">
import type { QueryMapping } from '@/api/data-sources'

defineProps<{ queryMapping: QueryMapping | null }>()
</script>

<template>
  <div v-if="queryMapping" class="rounded-xl border border-slate-200 p-3">
    <p class="text-xs font-semibold text-slate-600 mb-2">Filtres détectés automatiquement</p>
    <div v-if="queryMapping.searchParam" class="mb-3 p-2 bg-slate-50 rounded-lg text-xs">
      <span class="font-semibold text-slate-700">Paramètre de recherche : </span>
      <span class="font-mono text-slate-600">{{ queryMapping.searchParam }}</span>
    </div>
    <table v-if="Object.keys(queryMapping.filters).length" class="w-full text-xs">
      <thead>
        <tr class="text-left text-slate-400">
          <th class="font-medium pb-1">Colonne</th>
          <th class="font-medium pb-1">Paramètre upstream</th>
          <th class="font-medium pb-1">Opérateurs</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(f, col) in queryMapping.filters" :key="col" class="border-t border-slate-100">
          <td class="py-1 font-mono text-slate-700">{{ col }}</td>
          <td class="py-1 font-mono text-slate-500">
            {{ f.param ?? `${f.range?.gteParam} / ${f.range?.lteParam}` }}
          </td>
          <td class="py-1 text-slate-500">{{ f.operators.join(', ') }}</td>
        </tr>
      </tbody>
    </table>
    <p v-else class="text-xs text-slate-400">
      Aucun filtre n'a pu être détecté automatiquement — complétez-les depuis "Configuration avancée".
    </p>
    <p v-if="queryMapping.probeTruncated" class="text-[11px] text-amber-600 mt-2">
      Détection partielle — le budget de temps a été atteint avant d'avoir sondé toutes les colonnes.
      Relancez la détection ou complétez manuellement si besoin.
    </p>
  </div>
</template>
