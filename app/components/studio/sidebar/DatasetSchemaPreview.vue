<script setup lang="ts">
import type { DetectedSchemaColumn, SemanticRole } from '@/api/data-sources'

interface SchemaColumnLike {
  name: string
  type: string
  nullable: boolean
  semanticRole?: SemanticRole
}

withDefaults(defineProps<{
  columns: SchemaColumnLike[] | DetectedSchemaColumn[]
  rows: Record<string, unknown>[]
  rowCountHint?: number | null
  maxHeight?: string
}>(), {
  rowCountHint: null,
  maxHeight: '50vh',
})

const typeColors: Record<string, string> = {
  string: 'bg-slate-100 text-slate-500',
  integer: 'bg-blue-50 text-blue-600',
  float: 'bg-cyan-50 text-cyan-600',
  boolean: 'bg-amber-50 text-amber-600',
  date: 'bg-green-50 text-green-700',
  datetime: 'bg-green-50 text-green-700',
}

const semanticRoleBadges: Record<SemanticRole, { icon: string; label: string } | null> = {
  temporal: { icon: '📅', label: 'Temporelle' },
  geographic: { icon: '📍', label: 'Géographique' },
  measure: { icon: '#', label: 'Mesure' },
  dimension: { icon: '🏷️', label: 'Dimension' },
  identifier: { icon: '🆔', label: 'Identifiant' },
  text: { icon: '📝', label: 'Texte libre' },
  unknown: null,
}

const formatRows = (n: number) => n.toLocaleString('fr-FR')
</script>

<template>
  <div class="flex flex-col gap-4">
    <div>
      <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
        Colonnes
        <span class="font-normal normal-case">({{ columns.length }})</span>
      </p>
      <div class="rounded-xl border border-slate-200 overflow-hidden">
        <table class="w-full text-xs">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-3 py-2 text-left font-semibold text-slate-500">Nom</th>
              <th class="px-3 py-2 text-left font-semibold text-slate-500">Type</th>
              <th class="px-3 py-2 text-left font-semibold text-slate-500">Rôle</th>
              <th class="px-3 py-2 text-left font-semibold text-slate-500">Nullable</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="col in columns" :key="col.name" class="border-t border-slate-100">
              <td class="px-3 py-1.5 font-mono text-slate-700">{{ col.name }}</td>
              <td class="px-3 py-1.5">
                <span
                  class="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded"
                  :class="typeColors[col.type] ?? 'bg-slate-100 text-slate-400'"
                >{{ col.type }}</span>
              </td>
              <td class="px-3 py-1.5 text-slate-500">
                <span v-if="col.semanticRole && semanticRoleBadges[col.semanticRole]" class="whitespace-nowrap">
                  {{ semanticRoleBadges[col.semanticRole]!.icon }} {{ semanticRoleBadges[col.semanticRole]!.label }}
                </span>
                <span v-else class="text-slate-300">—</span>
              </td>
              <td class="px-3 py-1.5 text-slate-400">{{ col.nullable ? 'Oui' : 'Non' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div>
      <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
        Aperçu des données
        <span v-if="rowCountHint != null" class="font-normal normal-case">
          ({{ rows.length }} sur ~{{ formatRows(rowCountHint) }} lignes estimées)
        </span>
      </p>
      <div v-if="rows.length" class="overflow-auto rounded-xl border border-slate-200" :style="{ maxHeight }">
        <table class="w-full text-xs border-collapse">
          <thead class="sticky top-0 bg-slate-50">
            <tr>
              <th
                v-for="col in columns"
                :key="col.name"
                class="px-3 py-2 text-left font-semibold text-slate-500 border-b border-slate-200 whitespace-nowrap"
              >{{ col.name }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, ri) in rows"
              :key="ri"
              class="border-b border-slate-100 last:border-0 hover:bg-slate-50"
            >
              <td
                v-for="col in columns"
                :key="col.name"
                class="px-3 py-1.5 text-slate-700 font-mono whitespace-nowrap"
                :title="row[col.name] != null ? String(row[col.name]) : ''"
              >{{ row[col.name] != null ? row[col.name] : '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="text-xs text-slate-400 italic">Aucune donnée disponible.</p>
    </div>
  </div>
</template>
