<script setup lang="ts">
const props = defineProps<{
  fieldId: string
  enabledFilterLabels: string[]
  isFilterColumnEnabled: (label: string) => boolean
  filterDrafts: Record<string, string>
  badgeValuesByLabel: Record<string, string[]>
}>()

const emit = defineEmits<{
  'update:filterDrafts': [Record<string, string>]
}>()

const setFilterExact = (label: string, v: string) => {
  emit('update:filterDrafts', { ...props.filterDrafts, [label]: v })
}

const setFilterDraft = (label: string, v: string) => {
  emit('update:filterDrafts', { ...props.filterDrafts, [label]: v })
}
</script>

<template>
  <div class="border-b border-slate-100 bg-slate-50/80 px-3 py-2">
    <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
      <span class="text-[11px] font-semibold text-slate-600">Filtres</span>
      <span class="text-[11px] text-slate-400">Clique sur une valeur pour filtrer</span>
    </div>
    <div class="flex flex-col gap-2">
      <div v-for="lab in enabledFilterLabels" :key="`fb-${lab}`" class="flex flex-wrap items-center gap-2">
        <span class="shrink-0 text-xs font-semibold text-slate-700">{{ lab }}</span>
        <div class="flex flex-wrap items-center gap-1.5">
          <button
            v-for="v in badgeValuesByLabel[lab] ?? []"
            :key="`fb-${lab}-${v}`"
            type="button"
            class="rounded-full border px-2 py-0.5 text-[11px] font-medium"
            :class="
              String(filterDrafts[lab] ?? '').trim() === v
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            "
            @click="setFilterExact(lab, v)"
          >
            {{ v }}
          </button>
        </div>
        <input
          :id="`${fieldId}-tbl-filter-inline-${lab}`"
          :value="filterDrafts[lab]"
          type="search"
          autocomplete="off"
          :disabled="!isFilterColumnEnabled(lab)"
          :placeholder="isFilterColumnEnabled(lab) ? 'Filtrer…' : ''"
          class="ml-auto w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 outline-none placeholder:text-slate-400 disabled:bg-slate-100 disabled:text-slate-400 sm:ml-0 sm:w-56"
          @input="setFilterDraft(lab, ($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>
  </div>
</template>

