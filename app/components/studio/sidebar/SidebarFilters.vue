<script setup lang="ts">
import { computed, ref } from 'vue'
import { useStudioStore } from '@/stores/studio'

const studio = useStudioStore()

const query = ref('')

interface FilterRow {
  name: string
  label: string
  defaultValue: string
  value: string
  active: boolean
  declared: boolean
}

const rows = computed<FilterRow[]>(() => {
  const seen = new Set<string>()
  const out: FilterRow[] = []

  for (const def of studio.currentPageParamDefs) {
    if (!def.name || seen.has(def.name)) continue
    seen.add(def.name)
    const value = studio.pageParams[def.name] ?? ''
    const defaultValue = def.defaultValue ?? ''
    out.push({
      name: def.name,
      label: def.label || def.name,
      defaultValue,
      value,
      active: value !== '' && value !== defaultValue,
      declared: true,
    })
  }

  // Paramètres présents dans l'état courant mais non déclarés sur la page
  // (posés par un bloc « Recherche » au clic sur un résultat, par ex.).
  for (const [name, value] of Object.entries(studio.pageParams)) {
    if (seen.has(name)) continue
    seen.add(name)
    out.push({ name, label: name, defaultValue: '', value, active: value !== '', declared: false })
  }

  return out
})

const activeCount = computed(() => rows.value.filter((r) => r.active).length)

const filteredRows = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return rows.value
  return rows.value.filter(
    (r) =>
      r.label.toLowerCase().includes(q) ||
      r.name.toLowerCase().includes(q) ||
      r.value.toLowerCase().includes(q),
  )
})

function token(name: string) {
  return '{' + '{' + name + '}' + '}'
}

function removeParam(name: string) {
  const next = { ...studio.pageParams }
  delete next[name]
  studio.setPageParams(next)
}

function setValue(name: string, value: string) {
  if (value === '') removeParam(name)
  else studio.setPageParam(name, value)
}

function resetRow(row: FilterRow) {
  if (row.defaultValue) studio.setPageParam(row.name, row.defaultValue)
  else removeParam(row.name)
}
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="shrink-0 px-[22px] pb-3">
      <p class="text-[12px] leading-[1.5] text-[var(--studio-muted)]">
        Valeurs qui filtrent la page courante. Elles s'appliquent en direct, sans modifier le contenu.
      </p>

      <div class="relative mt-2.5">
        <svg
          class="pointer-events-none absolute left-2.5 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-[var(--studio-faint)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="1.8"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          v-model="query"
          type="search"
          placeholder="Rechercher un filtre…"
          class="w-full rounded-lg border border-[var(--studio-line-strong)] bg-white py-1.5 pl-8 pr-2.5 text-[12.5px] text-[var(--studio-ink)] placeholder:text-[var(--studio-faint)] focus:border-[var(--color-primary)] focus:outline-none"
        />
      </div>
    </div>

    <div
      v-if="rows.length > 0"
      class="flex shrink-0 items-center justify-between gap-2 px-[22px] pb-2"
    >
      <span class="text-[10px] font-semibold uppercase tracking-wider text-[var(--studio-faint)]">
        <template v-if="activeCount > 0">{{ activeCount }} filtre{{ activeCount > 1 ? 's' : '' }} actif{{ activeCount > 1 ? 's' : '' }}</template>
        <template v-else>Aucun filtre actif</template>
      </span>
      <button
        v-if="activeCount > 0 && !studio.isPreview"
        type="button"
        class="text-[11px] font-semibold text-[var(--color-primary)] hover:underline"
        @click="studio.clearPageParams()"
      >
        Tout réinitialiser
      </button>
    </div>

    <div class="min-h-0 flex-1 overflow-auto px-[22px] pb-6">
      <ul v-if="filteredRows.length > 0" class="flex flex-col gap-2">
        <li
          v-for="row in filteredRows"
          :key="row.name"
          class="rounded-xl border px-3 py-2.5 transition-colors"
          :class="row.active
            ? 'border-amber-300 bg-amber-50'
            : 'border-[var(--studio-line)] bg-white'"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="flex min-w-0 items-center gap-1.5">
              <span
                v-if="row.active"
                class="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500"
                aria-hidden="true"
              />
              <span class="truncate text-[12.5px] font-bold text-[var(--studio-ink)]">{{ row.label }}</span>
            </span>
            <span class="shrink-0 rounded-md bg-[var(--studio-note)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--studio-muted)]">
              {{ token(row.name) }}
            </span>
          </div>

          <div class="mt-1.5 flex items-center gap-1.5">
            <input
              :value="row.value"
              type="text"
              :placeholder="row.defaultValue || 'Toutes les valeurs'"
              :disabled="studio.isPreview"
              class="min-w-0 flex-1 rounded-lg border border-[var(--studio-line-strong)] bg-white px-2.5 py-1.5 text-[12px] text-[var(--studio-ink)] placeholder:text-[var(--studio-faint)] focus:border-[var(--color-primary)] focus:outline-none disabled:opacity-60"
              @input="setValue(row.name, ($event.target as HTMLInputElement).value)"
            />
            <button
              v-if="row.active && !studio.isPreview"
              type="button"
              title="Réinitialiser ce filtre"
              class="shrink-0 rounded-lg border border-[var(--studio-line)] p-1.5 text-[var(--studio-faint)] transition-colors hover:border-[var(--studio-line-strong)] hover:text-[var(--studio-ink)]"
              @click="resetRow(row)"
            >
              <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p v-if="row.defaultValue" class="mt-1 text-[10.5px] text-[var(--studio-faint)]">
            Défaut : <span class="font-mono">{{ row.defaultValue }}</span>
          </p>
        </li>
      </ul>

      <p
        v-else-if="rows.length > 0"
        class="px-1 py-8 text-center text-[12px] text-[var(--studio-faint)]"
      >
        Aucun filtre ne correspond à «&nbsp;{{ query }}&nbsp;».
      </p>

      <div v-else class="flex flex-col items-center gap-1.5 px-2 py-10 text-center">
        <svg class="h-7 w-7 text-[var(--studio-line-strong)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 22.5v-8.47a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
        </svg>
        <p class="text-[12.5px] font-semibold text-[var(--studio-ink)]">Aucun filtre sur cette page</p>
        <p class="text-[11.5px] leading-[1.5] text-[var(--studio-faint)]">
          Ajoutez un bloc «&nbsp;Paramètre&nbsp;» ou «&nbsp;Recherche&nbsp;» depuis l'onglet Script pour piloter la page.
        </p>
      </div>
    </div>
  </div>
</template>
