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
      <p class="text-[10px] font-bold uppercase tracking-wider text-[var(--studio-faint)] mb-2">
        Colonnes
        <span class="font-normal normal-case">({{ columns.length }})</span>
      </p>
      <div class="rounded-xl border border-[var(--studio-line-strong)] overflow-hidden">
        <table class="w-full text-xs">
          <thead class="bg-[var(--studio-note)]">
            <tr>
              <th class="px-3 py-2 text-left font-semibold text-[var(--studio-muted)]">Nom</th>
              <th class="px-3 py-2 text-left font-semibold text-[var(--studio-muted)]">Type</th>
              <th class="px-3 py-2 text-left font-semibold text-[var(--studio-muted)]">Rôle</th>
              <th class="px-3 py-2 text-left font-semibold text-[var(--studio-muted)]">Nullable</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="col in columns" :key="col.name" class="border-t border-[var(--studio-line)]">
              <td class="px-3 py-1.5 font-mono text-[var(--studio-ink)]">{{ col.name }}</td>
              <td class="px-3 py-1.5">
                <span
                  class="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded"
                  :class="typeColors[col.type] ?? 'bg-slate-100 text-[var(--studio-faint)]'"
                >{{ col.type }}</span>
              </td>
              <td class="px-3 py-1.5 text-[var(--studio-muted)]">
                <span v-if="col.semanticRole && semanticRoleBadges[col.semanticRole]" class="whitespace-nowrap">
                  {{ semanticRoleBadges[col.semanticRole]!.icon }} {{ semanticRoleBadges[col.semanticRole]!.label }}
                </span>
                <span v-else class="text-[var(--studio-faint)]">—</span>
              </td>
              <td class="px-3 py-1.5 text-[var(--studio-faint)]">{{ col.nullable ? 'Oui' : 'Non' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div>
      <p class="text-[10px] font-bold uppercase tracking-wider text-[var(--studio-faint)] mb-2">
        Aperçu des données
        <span v-if="rowCountHint != null" class="font-normal normal-case">
          ({{ rows.length }} sur ~{{ formatRows(rowCountHint) }} lignes estimées)
        </span>
      </p>
      <div v-if="rows.length" class="overflow-auto rounded-xl border border-[var(--studio-line-strong)]" :style="{ maxHeight }">
        <table class="w-full text-xs border-collapse">
          <thead class="sticky top-0 bg-[var(--studio-note)]">
            <tr>
              <th
                v-for="col in columns"
                :key="col.name"
                class="px-3 py-2 text-left font-semibold text-[var(--studio-muted)] border-b border-[var(--studio-line-strong)] whitespace-nowrap"
              >{{ col.name }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, ri) in rows"
              :key="ri"
              class="border-b border-[var(--studio-line)] last:border-0 hover:bg-[var(--studio-note)]"
            >
              <td
                v-for="col in columns"
                :key="col.name"
                class="px-3 py-1.5 text-[var(--studio-ink)] font-mono whitespace-nowrap"
                :title="row[col.name] != null ? String(row[col.name]) : ''"
              >{{ row[col.name] != null ? row[col.name] : '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="text-xs text-[var(--studio-faint)] italic">Aucune donnée disponible.</p>
    </div>
  </div>
</template>
