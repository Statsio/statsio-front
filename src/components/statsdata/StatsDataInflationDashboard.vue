<script setup lang="ts">
import { MagnifyingGlassIcon } from '@heroicons/vue/24/outline'
import { computed, ref, watch } from 'vue'
import { inflationCities, inflationNationalAvg, type InflationCityRecord } from '@/data/statsdata-inflation-cities'

type SortKey = 'city' | 'postalCode' | 'ipcPct' | 'foodPct' | 'energyPct' | 'housingPct'

const query = ref('')
const selectedId = ref(inflationCities[0]!.id)
const sortKey = ref<SortKey>('ipcPct')
const sortDesc = ref(true)

const normalizedQuery = computed(() => query.value.trim().toLowerCase())

const filtered = computed(() => {
  const q = normalizedQuery.value.replace(/\s/g, '')
  const qText = normalizedQuery.value
  return inflationCities.filter((c) => {
    if (!qText) return true
    return (
      c.city.toLowerCase().includes(qText) ||
      c.postalCode.includes(q) ||
      c.region.toLowerCase().includes(qText)
    )
  })
})

const sortedRows = computed(() => {
  const list = [...filtered.value]
  const k = sortKey.value
  const mul = sortDesc.value ? -1 : 1
  list.sort((a, b) => {
    if (k === 'city' || k === 'postalCode') {
      return a[k].localeCompare(b[k], 'fr') * (sortDesc.value ? -1 : 1)
    }
    return (a[k] - b[k]) * mul
  })
  return list
})

watch(
  sortedRows,
  (rows) => {
    if (!rows.some((c) => c.id === selectedId.value)) {
      selectedId.value = rows[0]?.id ?? inflationCities[0]!.id
    }
  },
  { immediate: true },
)

const selected = computed(
  () => inflationCities.find((c) => c.id === selectedId.value) ?? inflationCities[0]!,
)

function seededTrend(seed: string, anchor: number): number[] {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return Array.from({ length: 12 }, (_, i) => {
    h = (h * 1103515245 + 12345 + i * 17) >>> 0
    const w = (h % 200) / 200 - 0.5
    return Math.max(0.9, Math.round((anchor + (i - 5.5) * 0.045 + w * 0.38) * 100) / 100)
  })
}

const nationalTrend = computed(() => seededTrend('fr-national', inflationNationalAvg.ipcPct))
const cityTrend = computed(() => seededTrend(selected.value.id, selected.value.ipcPct))

function sparkPath(values: number[], w: number, h: number, pad = 10): string {
  if (values.length < 2) return ''
  const min = Math.min(...values) * 0.9
  const max = Math.max(...values) * 1.1
  const span = max - min || 1
  return values
    .map((v, i) => {
      const x = pad + (i / (values.length - 1)) * (w - 2 * pad)
      const y = h - pad - ((v - min) / span) * (h - 2 * pad)
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')
}

const barMaxIpc = computed(() => Math.max(0.6, ...filtered.value.map((c) => c.ipcPct), 0.01))

const scatterBounds = computed(() => {
  const list = filtered.value
  if (!list.length) return { xMin: 2, xMax: 3.5, yMin: 2, yMax: 4.5 }
  const xs = list.map((c) => c.foodPct)
  const ys = list.map((c) => c.housingPct)
  const pad = 0.25
  return {
    xMin: Math.min(...xs) - pad,
    xMax: Math.max(...xs) + pad,
    yMin: Math.min(...ys) - pad,
    yMax: Math.max(...ys) + pad,
  }
})

function scatterPos(c: InflationCityRecord) {
  const b = scatterBounds.value
  const x = ((c.foodPct - b.xMin) / (b.xMax - b.xMin || 1)) * 100
  const y = 100 - ((c.housingPct - b.yMin) / (b.yMax - b.yMin || 1)) * 100
  return { x, y }
}

const kpiAvg = computed(() => {
  const list = filtered.value
  if (!list.length) return 0
  return list.reduce((s, c) => s + c.ipcPct, 0) / list.length
})

const kpiSpread = computed(() => {
  const list = filtered.value
  if (!list.length) return { min: 0, max: 0 }
  const vals = list.map((c) => c.ipcPct)
  return { min: Math.min(...vals), max: Math.max(...vals) }
})

function toggleSort(key: SortKey) {
  if (sortKey.value === key) sortDesc.value = !sortDesc.value
  else {
    sortKey.value = key
    sortDesc.value = key === 'city' || key === 'postalCode' ? false : true
  }
}

const monthsShort = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']

const breakdownSegments = computed(() => {
  const c = selected.value
  const raw = [
    { key: 'food', label: 'Alimentation', value: c.foodPct, class: 'bg-emerald-500' },
    { key: 'energy', label: 'Énergie', value: c.energyPct, class: 'bg-amber-500' },
    { key: 'housing', label: 'Logement', value: c.housingPct, class: 'bg-violet-500' },
    { key: 'services', label: 'Services', value: c.servicesPct, class: 'bg-sky-500' },
  ] as const
  const sum = raw.reduce((s, x) => s + x.value, 0) || 1
  return raw.map((x) => ({ ...x, pct: (x.value / sum) * 100 }))
})

const compareRows = computed(() => [
  { label: 'IPC (total)', city: selected.value.ipcPct, nat: inflationNationalAvg.ipcPct },
  { label: 'Alimentation', city: selected.value.foodPct, nat: inflationNationalAvg.foodPct },
  { label: 'Énergie', city: selected.value.energyPct, nat: inflationNationalAvg.energyPct },
  { label: 'Logement', city: selected.value.housingPct, nat: inflationNationalAvg.housingPct },
  { label: 'Services', city: selected.value.servicesPct, nat: inflationNationalAvg.servicesPct },
])

const compareMax = computed(() =>
  Math.max(0.5, ...compareRows.value.flatMap((r) => [r.city, r.nat])),
)

const topByIpc = computed(() => {
  return [...filtered.value].sort((a, b) => b.ipcPct - a.ipcPct).slice(0, 8)
})

const rankInFullList = computed(() => {
  const ordered = [...inflationCities].sort((a, b) => b.ipcPct - a.ipcPct)
  const idx = ordered.findIndex((c) => c.id === selected.value.id)
  return idx >= 0 ? idx + 1 : '—'
})

function selectCity(id: string) {
  selectedId.value = id
}
</script>

<template>
  <div class="flex flex-col gap-10">
    <!-- Recherche -->
    <div
      class="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_-56px_rgba(15,23,42,0.2)] sm:p-6"
    >
      <label class="flex flex-col gap-2">
        <span class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Filtrer les territoires
        </span>
        <div class="relative">
          <MagnifyingGlassIcon
            class="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            v-model="query"
            type="search"
            autocomplete="off"
            placeholder="Ville, code postal ou région…"
            class="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-base text-slate-900 outline-none ring-accent/30 transition placeholder:text-slate-400 focus:border-accent focus:bg-white focus:ring-4"
          />
        </div>
      </label>
      <p v-if="filtered.length" class="mt-3 text-sm text-slate-500">
        {{ filtered.length }} ville{{ filtered.length > 1 ? 's' : '' }} affichée{{
          filtered.length > 1 ? 's' : ''
        }}
        sur {{ inflationCities.length }}. Sélection actuelle :
        <span class="font-semibold text-slate-800">{{ selected.city }}</span>
        (IPC {{ selected.ipcPct.toFixed(1) }} % — rang national {{ rankInFullList }}/{{ inflationCities.length }}).
      </p>
      <p v-else class="mt-3 text-sm text-amber-900">
        Aucun territoire ne correspond à « {{ query }} ». Essayez un autre nom, un code postal (ex. 69000) ou une
        région.
      </p>
    </div>

    <!-- KPIs -->
    <div v-if="filtered.length" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div class="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">IPC moyen (filtre)</p>
        <p class="mt-2 text-3xl font-semibold tabular-nums text-slate-950">{{ kpiAvg.toFixed(2) }} %</p>
        <p class="mt-1 text-xs text-slate-500">Moyenne France indicative : {{ inflationNationalAvg.ipcPct }} %</p>
      </div>
      <div class="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Écart IPC (filtre)</p>
        <p class="mt-2 text-3xl font-semibold tabular-nums text-slate-950">
          {{ kpiSpread.min.toFixed(1) }} – {{ kpiSpread.max.toFixed(1) }} %
        </p>
        <p class="mt-1 text-xs text-slate-500">Min. et max. sur l’ensemble affiché</p>
      </div>
      <div class="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Pression logement</p>
        <p class="mt-2 text-3xl font-semibold tabular-nums text-slate-950">
          {{ selected.housingPct.toFixed(1) }} %
        </p>
        <p class="mt-1 text-xs text-slate-500">Ville sélectionnée vs {{ inflationNationalAvg.housingPct }} % national</p>
      </div>
      <div class="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Population (agglo.)</p>
        <p class="mt-2 text-3xl font-semibold tabular-nums text-slate-950">{{ selected.populationK }} k</p>
        <p class="mt-1 text-xs text-slate-500">Ordre de grandeur démo</p>
      </div>
    </div>

    <div v-if="filtered.length" class="grid gap-8 xl:grid-cols-2">
      <!-- Barres IPC -->
      <div class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-slate-950">IPC par ville (haut du classement filtré)</h2>
        <p class="mt-1 text-sm text-slate-500">Variation annuelle en %, barres proportionnelles au filtre actif.</p>
        <div class="mt-6 flex max-h-[320px] flex-col gap-3 overflow-y-auto pr-1">
          <button
            v-for="c in topByIpc"
            :key="c.id"
            type="button"
            class="group flex w-full flex-col gap-1.5 rounded-xl border border-transparent text-left transition hover:border-accent/25 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            :class="c.id === selectedId ? 'border-accent/40 bg-slate-50' : ''"
            @click="selectCity(c.id)"
          >
            <div class="flex items-baseline justify-between gap-2 text-sm">
              <span class="font-medium text-slate-800 group-hover:text-accent">{{ c.city }}</span>
              <span class="shrink-0 tabular-nums text-slate-600">{{ c.ipcPct.toFixed(1) }} %</span>
            </div>
            <div class="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                class="h-full rounded-full bg-accent transition-all group-hover:bg-primary"
                :style="{ width: `${(c.ipcPct / barMaxIpc) * 100}%` }"
              />
            </div>
          </button>
        </div>
      </div>

      <!-- Courbes 12 mois -->
      <div class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-slate-950">Dynamique mensuelle (indice démo)</h2>
        <p class="mt-1 text-sm text-slate-500">
          {{ selected.city }} comparé à une trajectoire « moyenne France » synthétique.
        </p>
        <div class="mt-4">
          <svg
            class="h-48 w-full text-accent"
            viewBox="0 0 360 140"
            role="img"
            :aria-label="`Courbe IPC ${selected.city} sur 12 mois`"
          >
            <title>Courbe IPC sur 12 mois</title>
            <line x1="10" y1="120" x2="350" y2="120" stroke="rgb(226 232 240)" stroke-width="1" />
            <path
              :d="sparkPath(nationalTrend, 360, 120)"
              fill="none"
              stroke="rgb(148 163 184)"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              :d="sparkPath(cityTrend, 360, 120)"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <div class="mt-2 flex justify-between px-2 font-mono text-[10px] uppercase tracking-wider text-slate-400">
            <span v-for="m in monthsShort" :key="m">{{ m }}</span>
          </div>
          <div class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
            <span class="inline-flex items-center gap-2">
              <span class="size-2 rounded-full bg-accent" /> {{ selected.city }}
            </span>
            <span class="inline-flex items-center gap-2">
              <span class="size-2 rounded-full bg-slate-300" /> Moyenne France (synth.)
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="filtered.length" class="grid gap-8 xl:grid-cols-2">
      <!-- Comparaison ville / national -->
      <div class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-slate-950">Ville sélectionnée vs moyenne nationale</h2>
        <p class="mt-1 text-sm text-slate-500">Postes d’inflation (%, annuel).</p>
        <ul class="mt-6 flex flex-col gap-4">
          <li v-for="row in compareRows" :key="row.label" class="flex flex-col gap-1">
            <div class="flex justify-between text-sm">
              <span class="font-medium text-slate-700">{{ row.label }}</span>
              <span class="tabular-nums text-slate-500">
                <span class="text-accent">{{ row.city.toFixed(1) }}</span>
                vs {{ row.nat.toFixed(1) }}
              </span>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div class="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  class="h-full rounded-full bg-accent"
                  :style="{ width: `${Math.min(100, (row.city / compareMax) * 100)}%` }"
                />
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  class="h-full rounded-full bg-slate-300"
                  :style="{ width: `${Math.min(100, (row.nat / compareMax) * 100)}%` }"
                />
              </div>
            </div>
          </li>
        </ul>
      </div>

      <!-- Répartition relative -->
      <div class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-slate-950">Poids relatif des postes ({{ selected.city }})</h2>
        <p class="mt-1 text-sm text-slate-500">Répartition normalisée des contributions à la pression prix.</p>
        <div class="mt-6 flex h-4 overflow-hidden rounded-full bg-slate-100">
          <div
            v-for="seg in breakdownSegments"
            :key="seg.key"
            :class="seg.class"
            :style="{ width: `${seg.pct}%` }"
            :title="`${seg.label}: ${seg.value.toFixed(1)} %`"
          />
        </div>
        <ul class="mt-4 flex flex-wrap gap-3 text-xs">
          <li v-for="seg in breakdownSegments" :key="seg.key + '-lg'" class="inline-flex items-center gap-1.5">
            <span :class="['size-2 shrink-0 rounded-sm', seg.class]" />
            <span class="text-slate-600">{{ seg.label }} ({{ seg.value.toFixed(1) }} %)</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- Nuage alimentation / logement -->
    <div v-if="filtered.length" class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
      <h2 class="text-lg font-semibold text-slate-950">Alimentation vs logement</h2>
      <p class="mt-1 text-sm text-slate-500">
        Chaque point est une ville du filtre. Axe X : inflation alimentaire, axe Y : inflation logement.
      </p>
      <div class="relative mt-6 aspect-[16/9] w-full max-h-[360px] rounded-2xl bg-slate-50">
        <svg class="absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <line x1="8" y1="92" x2="92" y2="92" stroke="rgb(203 213 225)" stroke-width="0.3" />
          <line x1="8" y1="92" x2="8" y2="8" stroke="rgb(203 213 225)" stroke-width="0.3" />
        </svg>
        <div class="absolute inset-0 p-[8%]">
          <button
            v-for="c in filtered"
            :key="'sc-' + c.id"
            type="button"
            class="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow transition hover:scale-125 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            :class="c.id === selectedId ? 'z-10 bg-primary ring-2 ring-accent' : 'z-0 bg-accent/80'"
            :style="{
              left: `${scatterPos(c).x}%`,
              top: `${scatterPos(c).y}%`,
            }"
            :title="`${c.city} — alim. ${c.foodPct} %, logement ${c.housingPct} %`"
            :aria-label="`Sélectionner ${c.city}`"
            @click="selectCity(c.id)"
          />
        </div>
        <div class="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-slate-400">
          Inflation alimentaire (%)
        </div>
        <div
          class="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] text-slate-400"
        >
          Inflation logement (%)
        </div>
      </div>
    </div>

    <!-- Mini sparklines grille -->
    <div v-if="filtered.length" class="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
      <h2 class="text-lg font-semibold text-slate-950">Mini-tendances IPC (aperçu territoires filtrés)</h2>
      <p class="mt-1 text-sm text-slate-500">Série démo sur 12 mois par ville affichée.</p>
      <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <button
          v-for="c in sortedRows.slice(0, 9)"
          :key="'sp-' + c.id"
          type="button"
          class="flex flex-col gap-2 rounded-2xl border p-4 text-left transition"
          :class="
            c.id === selectedId
              ? 'border-accent/50 bg-slate-50 ring-1 ring-accent/30'
              : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
          "
          @click="selectCity(c.id)"
        >
          <div class="flex items-baseline justify-between gap-2">
            <span class="font-semibold text-slate-800">{{ c.city }}</span>
            <span class="text-sm tabular-nums text-slate-500">{{ c.ipcPct.toFixed(1) }} %</span>
          </div>
          <svg class="h-10 w-full text-primary" viewBox="0 0 120 36" aria-hidden="true">
            <path
              :d="sparkPath(seededTrend(c.id, c.ipcPct), 120, 32, 2)"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Tableau -->
    <div v-if="filtered.length" class="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
      <div class="border-b border-slate-200 px-6 py-5">
        <h2 class="text-lg font-semibold text-slate-950">Tableau détaillé</h2>
        <p class="mt-1 text-sm text-slate-500">Cliquez sur une ligne pour analyser la ville. Colonnes triables.</p>
      </div>
      <div class="overflow-x-auto">
        <table
          class="w-full min-w-[640px] border-collapse text-left text-sm"
          aria-label="Inflation par ville, valeurs annuelles en pourcent"
        >
          <thead class="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th scope="col" class="px-4 py-3">
                <button type="button" class="hover:text-accent" @click="toggleSort('city')">
                  Ville {{ sortKey === 'city' ? (sortDesc ? '↓' : '↑') : '' }}
                </button>
              </th>
              <th scope="col" class="px-4 py-3">
                <button type="button" class="hover:text-accent" @click="toggleSort('postalCode')">
                  CP {{ sortKey === 'postalCode' ? (sortDesc ? '↓' : '↑') : '' }}
                </button>
              </th>
              <th scope="col" class="px-4 py-3">Région</th>
              <th scope="col" class="px-4 py-3 text-right">
                <button type="button" class="hover:text-accent" @click="toggleSort('ipcPct')">
                  IPC {{ sortKey === 'ipcPct' ? (sortDesc ? '↓' : '↑') : '' }}
                </button>
              </th>
              <th scope="col" class="px-4 py-3 text-right">
                <button type="button" class="hover:text-accent" @click="toggleSort('foodPct')">
                  Alim. {{ sortKey === 'foodPct' ? (sortDesc ? '↓' : '↑') : '' }}
                </button>
              </th>
              <th scope="col" class="px-4 py-3 text-right">
                <button type="button" class="hover:text-accent" @click="toggleSort('energyPct')">
                  Énergie {{ sortKey === 'energyPct' ? (sortDesc ? '↓' : '↑') : '' }}
                </button>
              </th>
              <th scope="col" class="px-4 py-3 text-right">
                <button type="button" class="hover:text-accent" @click="toggleSort('housingPct')">
                  Logement {{ sortKey === 'housingPct' ? (sortDesc ? '↓' : '↑') : '' }}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="c in sortedRows"
              :key="c.id"
              class="cursor-pointer border-t border-slate-100 transition"
              :class="c.id === selectedId ? 'bg-accent/5 hover:bg-accent/10' : 'hover:bg-slate-50'"
              @click="selectCity(c.id)"
            >
              <th scope="row" class="px-4 py-3 font-medium text-slate-900">{{ c.city }}</th>
              <td class="px-4 py-3 font-mono text-xs text-slate-600">{{ c.postalCode }}</td>
              <td class="max-w-[200px] truncate px-4 py-3 text-slate-600">{{ c.region }}</td>
              <td class="px-4 py-3 text-right tabular-nums font-semibold text-accent">{{ c.ipcPct.toFixed(1) }} %</td>
              <td class="px-4 py-3 text-right tabular-nums text-slate-700">{{ c.foodPct.toFixed(1) }} %</td>
              <td class="px-4 py-3 text-right tabular-nums text-slate-700">{{ c.energyPct.toFixed(1) }} %</td>
              <td class="px-4 py-3 text-right tabular-nums text-slate-700">{{ c.housingPct.toFixed(1) }} %</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
