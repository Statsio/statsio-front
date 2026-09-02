<script setup lang="ts">
import { computed } from 'vue'
import { useStudioStore } from '@/stores/studio'
import StudioModal from './StudioModal.vue'

const props = defineProps<{
  show: boolean
  /** Nom du paramètre actuellement sélectionné. */
  modelValue?: string | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'close'): void
}>()

const studio = useStudioStore()

interface ParamRow {
  name: string
  label?: string
  column?: string
  value: string
}
interface ParamGroup {
  key: string
  title: string
  hint: string
  rows: ParamRow[]
}

const groups = computed<ParamGroup[]>(() => {
  const defs = studio.currentPageParamDefs
  const declaredNames = new Set(defs.map((p) => p.name))

  const declared: ParamRow[] = defs
    .filter((p) => p.name)
    .map((p) => ({
      name: p.name,
      label: p.label,
      column: p.column,
      value: studio.pageParams[p.name] ?? '',
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  const adhoc: ParamRow[] = Object.keys(studio.pageParams)
    .filter((name) => name && !declaredNames.has(name))
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({ name, value: studio.pageParams[name] ?? '' }))

  // Le paramètre déjà sélectionné mais inconnu ailleurs reste proposable.
  if (props.modelValue && !declaredNames.has(props.modelValue) && !adhoc.some((r) => r.name === props.modelValue)) {
    adhoc.push({ name: props.modelValue, value: studio.pageParams[props.modelValue] ?? '' })
  }

  const out: ParamGroup[] = []
  if (declared.length) {
    out.push({
      key: 'declared',
      title: 'Paramètres de la page',
      hint: 'déclarés par un bloc Paramètre — pilotent tous les blocs',
      rows: declared,
    })
  }
  if (adhoc.length) {
    out.push({
      key: 'adhoc',
      title: 'Autres valeurs actives',
      hint: 'issues d’une barre de recherche ou de l’URL',
      rows: adhoc,
    })
  }
  return out
})

const isEmpty = computed(() => groups.value.every((g) => !g.rows.length))

function pick(name: string) {
  emit('update:modelValue', name)
  emit('close')
}
</script>

<template>
  <StudioModal
    v-if="show"
    title="Choisir un paramètre"
    subtitle="La condition compare la valeur active de ce paramètre sur la page."
    :width="520"
    @close="emit('close')"
  >
    <p
      v-if="isEmpty"
      class="rounded-xl bg-[var(--studio-note)] px-3.5 py-3 text-[12.5px] leading-[1.55] text-[var(--studio-muted)]"
    >
      Ajoutez d'abord un bloc <b>Paramètre</b> sur la page (ou une barre de recherche), puis
      revenez définir la condition.
    </p>

    <div v-else class="flex flex-col gap-5">
      <div v-for="group in groups" :key="group.key" class="flex flex-col gap-2">
        <div class="flex items-baseline gap-2">
          <span class="text-[10px] font-extrabold uppercase tracking-[0.08em] text-[var(--studio-faint)]">{{ group.title }}</span>
          <span class="text-[10.5px] text-[var(--studio-faint)]">· {{ group.hint }}</span>
        </div>
        <div class="flex flex-col gap-1.5">
          <button
            v-for="row in group.rows"
            :key="row.name"
            type="button"
            class="flex items-center justify-between gap-3 rounded-[11px] border-[1.5px] px-[13px] py-2.5 text-left transition-colors"
            :class="row.name === modelValue
              ? 'border-[var(--color-primary)] bg-[var(--studio-accent-wash)]'
              : 'border-[var(--studio-line)] bg-white hover:border-[var(--color-primary)] hover:bg-[var(--studio-accent-wash)]'"
            @click="pick(row.name)"
          >
            <span class="flex min-w-0 flex-col gap-1">
              <span class="flex items-baseline gap-2">
                <span class="font-mono text-[12px] font-semibold text-[var(--studio-tag-ink)]">{{ '{' + '{' + row.name + '}' + '}' }}</span>
                <span v-if="row.label" class="truncate text-[12px] text-[var(--studio-muted)]">{{ row.label }}</span>
              </span>
              <span v-if="row.column" class="text-[11px] text-[var(--studio-faint)]">valeurs de {{ row.column }}</span>
            </span>
            <span
              class="shrink-0 whitespace-nowrap rounded-[5px] px-[7px] py-[3px] font-mono text-[10px] font-semibold"
              :class="row.value ? 'bg-amber-50 text-amber-700' : 'bg-[var(--studio-wash)] text-[var(--studio-faint)]'"
            >{{ row.value ? '= ' + row.value : '∅' }}</span>
          </button>
        </div>
      </div>
    </div>
  </StudioModal>
</template>
