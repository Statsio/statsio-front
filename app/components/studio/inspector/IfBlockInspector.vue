<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { FILTER_OPERATORS } from '@/types/studio'
import type { FilterOperator, IfBranch, IfCondition, StudioBlock } from '@/types/studio'
import { fetchDistinctValues } from '@/api/studio'
import { readIfBranches, isElseBranch, evaluateCondition, matchingBranchIndex, type IfMatch } from '@/lib/studio-if'
import FieldNote from '@/components/studio/fields/FieldNote.vue'
import FieldPicker from '@/components/studio/fields/FieldPicker.vue'
import VariableButton from '@/components/studio/fields/VariableButton.vue'

const props = defineProps<{ block: StudioBlock }>()
const studio = useStudioStore()

const EMPTY: IfCondition = { param: '', operator: '=', value: '' }

/** Branches éditées — la branche 0 a toujours au moins une ligne de clause. */
const branches = computed<IfBranch[]>(() => {
  const list = readIfBranches(props.block.config).map((b) => ({ ...b, conditions: [...b.conditions] }))
  return list.map((b, i) =>
    !isElseBranch(list, i) && !b.conditions.length ? { ...b, conditions: [{ ...EMPTY }] } : b,
  )
})
const hasElse = computed(() => branches.value.some((b) => b.else))
const allParams = computed(() => branches.value.flatMap((b) => b.conditions.map((c) => c.param)).filter(Boolean))

/** Paramètres proposés : ceux déclarés sur la page + les clés déjà présentes dans pageParams. */
const paramNames = computed(() => {
  const names = new Set<string>(studio.currentPageParamDefs.map((p) => p.name))
  Object.keys(studio.pageParams).forEach((k) => names.add(k))
  allParams.value.forEach((p) => names.add(p))
  return [...names].filter(Boolean)
})

function writeBranches(next: IfBranch[]) {
  studio.updateBlockConfig(props.block.id, {
    ifBranches: next,
    // l'ancien schéma est migré : on le neutralise pour éviter toute ambiguïté.
    ifConditions: undefined,
    ifMatch: undefined,
    ifParam: undefined,
    ifOperator: undefined,
    ifValue: undefined,
  })
}
function patchCond(bi: number, ci: number, p: Partial<IfCondition>) {
  writeBranches(
    branches.value.map((b, k) =>
      k === bi ? { ...b, conditions: b.conditions.map((c, j) => (j === ci ? { ...c, ...p } : c)) } : b,
    ),
  )
}
function addCond(bi: number) {
  writeBranches(branches.value.map((b, k) => (k === bi ? { ...b, conditions: [...b.conditions, { ...EMPTY }] } : b)))
}
function removeCond(bi: number, ci: number) {
  writeBranches(
    branches.value.map((b, k) => (k === bi ? { ...b, conditions: b.conditions.filter((_, j) => j !== ci) } : b)),
  )
}
function setBranchMatch(bi: number, m: IfMatch) {
  writeBranches(branches.value.map((b, k) => (k === bi ? { ...b, match: m } : b)))
}
function insertVar(bi: number, ci: number, token: string) {
  const cur = branches.value[bi]?.conditions[ci]?.value ?? ''
  patchCond(bi, ci, { value: cur.trim() ? `${cur} ${token}` : token })
}

// ─── Sélecteur de paramètre (menu inline, une clause à la fois) ──────────────
const openParamMenu = ref<string | null>(null)
const clauseKey = (bi: number, ci: number) => `${bi}-${ci}`

interface ParamOption { name: string; label?: string; column?: string }
const paramOptionGroups = computed<{ key: string; title: string; hint: string; rows: ParamOption[] }[]>(() => {
  const defs = studio.currentPageParamDefs.filter((p) => p.name && !p.hidden)
  const declaredNames = new Set(defs.map((p) => p.name))
  const declared: ParamOption[] = defs
    .map((p) => ({ name: p.name, label: p.label, column: p.column }))
    .sort((a, b) => a.name.localeCompare(b.name))
  const adhoc: ParamOption[] = Object.keys(studio.pageParams)
    .filter((name) => name && !declaredNames.has(name))
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({ name }))
  const out: { key: string; title: string; hint: string; rows: ParamOption[] }[] = []
  if (declared.length) out.push({ key: 'declared', title: 'Paramètres de la page', hint: 'pilotent tous les blocs', rows: declared })
  if (adhoc.length) out.push({ key: 'adhoc', title: 'Autres valeurs actives', hint: 'issues d’une recherche ou de l’URL', rows: adhoc })
  return out
})
const hasParamOptions = computed(() => paramOptionGroups.value.some((g) => g.rows.length))

function toggleParamMenu(bi: number, ci: number) {
  const k = clauseKey(bi, ci)
  openParamMenu.value = openParamMenu.value === k ? null : k
}
function chooseParam(bi: number, ci: number, name: string) {
  patchCond(bi, ci, { param: name })
  openParamMenu.value = null
}

// ─── Valeurs distinctes proposées, par paramètre (chargées à la demande) ─────
const suggestions = ref<Record<string, string[]>>({})
watch(
  () => allParams.value.join('|'),
  async () => {
    for (const name of allParams.value) {
      if (name in suggestions.value) continue
      const def = studio.currentPageParamDefs.find((p) => p.name === name)
      if (!def?.datasetId || !def.column) continue
      suggestions.value = { ...suggestions.value, [name]: [] }
      try {
        const vals = await fetchDistinctValues(def.datasetId, def.column, '')
        suggestions.value = { ...suggestions.value, [name]: vals.slice(0, 12) }
      } catch {
        /* pas de suggestions pour ce paramètre */
      }
    }
  },
  { immediate: true },
)

// ─── Aperçu ─────────────────────────────────────────────────────────────────
function currentValueOf(name: string): string {
  return name ? studio.pageParams[name] ?? '' : ''
}
function opShort(op: FilterOperator): string {
  return FILTER_OPERATORS.find((o) => o.value === op)?.short ?? op
}
function condPasses(c: IfCondition): boolean {
  return Boolean(c.param) && evaluateCondition(c, studio.pageParams)
}
const activeIndex = computed(() => matchingBranchIndex(branches.value, studio.pageParams))
function branchTitle(i: number): string {
  if (isElseBranch(branches.value, i)) return 'Sinon'
  return i === 0 ? 'Si' : 'Sinon si'
}

const MATCH_OPTIONS: { v: IfMatch; l: string }[] = [
  { v: 'all', l: 'Toutes (ET)' },
  { v: 'any', l: 'Au moins une (OU)' },
]
</script>

<template>
  <div class="flex flex-col gap-[13px] px-4 pb-2 pt-3">
    <FieldNote v-if="!paramNames.length">
      Ajoutez d'abord un bloc <b>Paramètre</b> sur la page (ou une barre de recherche), puis revenez
      définir la condition.
    </FieldNote>

    <!-- Branches -->
    <div
      v-for="(branch, bi) in branches"
      :key="bi"
      class="flex flex-col gap-3 rounded-xl border p-3.5"
      :class="bi === activeIndex ? 'border-[var(--color-primary)] bg-[var(--studio-accent-wash)]' : 'border-[var(--studio-line)] bg-white'"
    >
      <div class="flex items-center justify-between gap-3">
        <span class="text-[11px] font-extrabold uppercase tracking-[0.06em] text-[var(--studio-faint)]">
          {{ branchTitle(bi) }}
          <span v-if="bi === activeIndex" class="ml-1 text-emerald-600">· s'applique</span>
        </span>
        <button
          v-if="bi > 0"
          type="button"
          class="text-[11px] font-bold text-[var(--studio-faint)] transition-colors hover:text-[var(--color-error)]"
          @click="studio.removeIfBranch(block.id, bi)"
        >Supprimer</button>
      </div>

      <p v-if="isElseBranch(branches, bi)" class="text-[12px] leading-relaxed text-[var(--studio-muted)]">
        S'affiche quand aucune branche au-dessus ne correspond. Déposez son contenu dans la zone
        <b>Sinon</b> du canevas.
      </p>

      <template v-else>
        <!-- Combinateur ET / OU de la branche -->
        <div v-if="branch.conditions.length > 1" class="flex items-center justify-between gap-2">
          <span class="text-xs font-semibold text-[var(--studio-muted)]">Combinaison</span>
          <div class="flex gap-1 rounded-full bg-[var(--studio-wash)] p-[3px]">
            <button
              v-for="o in MATCH_OPTIONS"
              :key="o.v"
              type="button"
              class="rounded-full px-3 py-1 text-[11px] font-bold transition-colors"
              :class="branch.match === o.v ? 'bg-white text-[var(--studio-ink)] shadow-[0_1px_2px_rgba(20,20,30,0.12)]' : 'text-[var(--studio-muted)] hover:text-[var(--studio-ink)]'"
              @click="setBranchMatch(bi, o.v)"
            >{{ o.l }}</button>
          </div>
        </div>

        <!-- Clauses -->
        <div
          v-for="(cond, ci) in branch.conditions"
          :key="ci"
          class="flex flex-col gap-3 rounded-lg bg-[var(--studio-note)] p-3"
        >
          <div v-if="branch.conditions.length > 1" class="flex items-center justify-between gap-3">
            <span class="text-[10px] font-extrabold uppercase tracking-[0.06em] text-[var(--studio-faint)]">Clause {{ ci + 1 }}</span>
            <button
              type="button"
              class="text-[10.5px] font-bold text-[var(--studio-faint)] transition-colors hover:text-[var(--color-error)]"
              @click="removeCond(bi, ci)"
            >Retirer</button>
          </div>

          <div>
            <FieldPicker
              label="Paramètre"
              :value="cond.param || 'Choisir un paramètre…'"
              :action="cond.param ? 'Changer' : 'Choisir'"
              :chips="cond.param ? [{ text: currentValueOf(cond.param) ? String(currentValueOf(cond.param)) : '∅', muted: !currentValueOf(cond.param) }] : []"
              @open="toggleParamMenu(bi, ci)"
            />
            <div
              v-if="openParamMenu === clauseKey(bi, ci)"
              class="mt-1.5 flex flex-col gap-3 rounded-[11px] border-[1.5px] border-[var(--studio-line)] bg-white p-2.5"
            >
              <p v-if="!hasParamOptions" class="text-[11.5px] leading-[1.5] text-[var(--studio-muted)]">
                Ajoutez d'abord un bloc <b>Paramètre</b> ou une barre de recherche sur la page.
              </p>
              <div v-for="group in paramOptionGroups" :key="group.key" class="flex flex-col gap-1.5">
                <span class="text-[10px] font-extrabold uppercase tracking-[0.06em] text-[var(--studio-faint)]">
                  {{ group.title }} <span class="font-medium normal-case tracking-normal">· {{ group.hint }}</span>
                </span>
                <button
                  v-for="row in group.rows"
                  :key="row.name"
                  type="button"
                  class="flex items-center justify-between gap-3 rounded-[9px] border-[1.5px] px-2.5 py-2 text-left transition-colors"
                  :class="row.name === cond.param
                    ? 'border-[var(--color-primary)] bg-[var(--studio-accent-wash)]'
                    : 'border-[var(--studio-line)] hover:border-[var(--color-primary)]'"
                  @click="chooseParam(bi, ci, row.name)"
                >
                  <span class="flex min-w-0 flex-col">
                    <span class="font-mono text-[11.5px] font-semibold text-[var(--studio-tag-ink)]">{{ '{' + '{' + row.name + '}' + '}' }}</span>
                    <span v-if="row.label || row.column" class="truncate text-[10.5px] text-[var(--studio-faint)]">
                      {{ row.label || ('valeurs de ' + row.column) }}
                    </span>
                  </span>
                  <span
                    class="shrink-0 whitespace-nowrap rounded-[5px] px-[6px] py-[2px] font-mono text-[9.5px] font-semibold"
                    :class="currentValueOf(row.name) ? 'bg-amber-50 text-amber-700' : 'bg-[var(--studio-wash)] text-[var(--studio-faint)]'"
                  >{{ currentValueOf(row.name) ? '= ' + currentValueOf(row.name) : '∅' }}</span>
                </button>
              </div>
            </div>
          </div>

          <template v-if="cond.param">
            <div>
              <div class="mb-2 text-[11px] font-bold text-[var(--studio-faint)]">Opérateur</div>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="op in FILTER_OPERATORS"
                  :key="op.value"
                  type="button"
                  class="flex items-center gap-1.5 rounded-[9px] border-[1.5px] px-2.5 py-1.5 text-[11.5px] font-bold transition-colors"
                  :class="cond.operator === op.value
                    ? 'border-[var(--studio-ink)] bg-[var(--studio-ink)] text-white'
                    : 'border-[var(--studio-line-strong)] text-[var(--studio-muted)] hover:border-[var(--color-primary)]'"
                  @click="patchCond(bi, ci, { operator: op.value })"
                >
                  <span class="font-mono opacity-70">{{ op.short }}</span>
                  {{ op.label }}
                </button>
              </div>
            </div>

            <div>
              <div class="mb-2 text-[11px] font-bold text-[var(--studio-faint)]">Valeur</div>
              <div class="flex items-stretch gap-2">
                <input
                  :value="cond.value"
                  type="text"
                  class="studio-input studio-input--mono min-w-0 flex-1"
                  placeholder="valeur exacte, ou une variable"
                  @input="patchCond(bi, ci, { value: ($event.target as HTMLInputElement).value })"
                />
                <VariableButton context="valeur de condition" :block-id="block.id" @pick="insertVar(bi, ci, $event)" />
              </div>
              <div v-if="(suggestions[cond.param] ?? []).length" class="mt-2 flex flex-wrap gap-1.5">
                <button
                  v-for="v in suggestions[cond.param]"
                  :key="v"
                  type="button"
                  class="rounded-[5px] px-2 py-1 font-mono text-[10.5px] font-semibold transition-colors"
                  :class="cond.value === v
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'bg-white text-[var(--studio-muted)] hover:bg-[var(--studio-tag)] hover:text-[var(--studio-tag-ink)]'"
                  @click="patchCond(bi, ci, { value: v })"
                >{{ v }}</button>
              </div>
            </div>
          </template>
        </div>

        <button type="button" class="studio-add-btn" @click="addCond(bi)">+ Ajouter une clause</button>
      </template>
    </div>

    <!-- Ajout de branche -->
    <div class="flex flex-wrap gap-2">
      <button type="button" class="studio-add-btn flex-1" @click="studio.addIfBranch(block.id, 'elsif')">
        + Sinon si
      </button>
      <button
        v-if="!hasElse"
        type="button"
        class="studio-add-btn flex-1"
        @click="studio.addIfBranch(block.id, 'else')"
      >+ Sinon</button>
    </div>

    <!-- Aperçu -->
    <div
      v-if="allParams.length"
      class="rounded-xl px-3 py-2.5 text-[12px] font-semibold"
      :class="activeIndex >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-[var(--studio-note)] text-[var(--studio-muted)]'"
    >
      <template v-if="activeIndex >= 0">
        Actuellement : la branche <b>{{ branchTitle(activeIndex) }}</b> s'applique · son contenu
        s'affiche sur la page publiée.
      </template>
      <template v-else>
        Actuellement : aucune branche ne s'applique · le bloc n'affiche rien.
      </template>
      <ul class="mt-1.5 flex flex-col gap-0.5 font-normal">
        <template v-for="(branch, bi) in branches" :key="bi">
          <li
            v-for="(c, ci) in branch.conditions.filter((x) => x.param)"
            :key="bi + '-' + ci"
            class="font-mono text-[11px]"
          >
            [{{ branchTitle(bi) }}] {{ c.param }} «&nbsp;{{ currentValueOf(c.param) || '∅' }}&nbsp;»
            {{ opShort(c.operator) }} {{ c.value || '∅' }}
            <span :class="condPasses(c) ? 'text-emerald-600' : 'text-[var(--studio-faint)]'">
              {{ condPasses(c) ? '✓' : '✗' }}
            </span>
          </li>
        </template>
      </ul>
    </div>

    <FieldNote>En mode édition, les blocs de chaque branche restent visibles pour que vous puissiez les configurer.</FieldNote>
  </div>
</template>
