<script setup lang="ts">
import { ref, inject, computed } from 'vue'
import { formulaToolGroups } from '@/components/studio/inspector/parts/formula-tool-groups'
import { studioPageFiltersKey } from '@/lib/studio-inject-keys'

type FormulaInsertButton = {
  label: string
  insert: string
  hint?: string
}

const props = withDefaults(defineProps<{
  modelValue: string
  fieldButtons?: FormulaInsertButton[]
  referenceButtons?: FormulaInsertButton[]
  placeholder?: string
  placeholderHtml?: string
  highlightedHtml?: string
  rows?: number
  error?: string | null
}>(), {
  fieldButtons: () => [],
  referenceButtons: () => [],
  placeholder: '',
  placeholderHtml: '',
  highlightedHtml: '',
  rows: 4,
  error: null,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  blur: []
}>()

const activeTab = ref<'math' | 'text' | 'fields' | 'page-filters'>('fields')

const pageFilters = inject(studioPageFiltersKey, null)

const pageFilterButtons = computed<FormulaInsertButton[]>(() => {
  if (!pageFilters) return []
  return Object.keys(pageFilters.value).map(key => ({
    label: key,
    insert: `@pageFilter.${key}`,
    hint: `Filtre de page: ${key}`,
  }))
})

const insertText = (snippet: string) => {
  const current = String(props.modelValue ?? '')
  emit('update:modelValue', current && !current.endsWith(' ') ? `${current} ${snippet}` : `${current}${snippet}`)
}
</script>

<template>
  <div class="space-y-2 rounded-lg bg-slate-50 px-2 py-2">
    <div class="rounded-xl border border-slate-200 bg-white p-2">
      <div class="grid grid-cols-4 gap-1 rounded-lg bg-slate-100 p-1">
        <button
          type="button"
          class="rounded-md px-2 py-1.5 text-[11px] font-semibold transition"
          :class="activeTab === 'math' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'"
          @click="activeTab = 'math'"
        >
          Math
        </button>
        <button
          type="button"
          class="rounded-md px-2 py-1.5 text-[11px] font-semibold transition"
          :class="activeTab === 'text' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'"
          @click="activeTab = 'text'"
        >
          Texte
        </button>
        <button
          type="button"
          class="rounded-md px-2 py-1.5 text-[11px] font-semibold transition"
          :class="activeTab === 'fields' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'"
          @click="activeTab = 'fields'"
        >
          Champs
        </button>
        <button
          type="button"
          class="rounded-md px-2 py-1.5 text-[11px] font-semibold transition"
          :class="activeTab === 'page-filters' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'"
          @click="activeTab = 'page-filters'"
        >
          Filtres
        </button>
      </div>

      <div class="mt-2 flex flex-wrap gap-1">
        <template v-if="activeTab === 'math'">
          <button
            v-for="item in formulaToolGroups.find((grp) => grp.id === 'math')?.items ?? []"
            :key="`math-${item.label}`"
            type="button"
            class="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            @click="insertText(item.insert)"
          >
            {{ item.label }}
          </button>
        </template>
        <template v-else-if="activeTab === 'text'">
          <button
            v-for="item in formulaToolGroups.find((grp) => grp.id === 'text')?.items ?? []"
            :key="`text-${item.label}`"
            type="button"
            class="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-orange-600 hover:bg-orange-50"
            @click="insertText(item.insert)"
          >
            {{ item.label }}
          </button>
        </template>
        <template v-else-if="activeTab === 'page-filters'">
          <div v-if="pageFilterButtons.length === 0" class="w-full py-2 text-center text-xs text-slate-500">
            Aucun filtre de page actif
          </div>
          <button
            v-for="filter in pageFilterButtons"
            :key="`filter-${filter.label}`"
            type="button"
            class="rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
            :title="filter.hint"
            @click="insertText(filter.insert)"
          >
            {{ filter.label }}
          </button>
        </template>
        <template v-else>
          <button
            v-for="field in fieldButtons"
            :key="`field-${field.label}`"
            type="button"
            class="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
            :title="field.hint ? field.hint : undefined"
            @click="insertText(field.insert)"
          >
            {{ field.label }}
          </button>
        </template>
      </div>
    </div>

    <div v-if="referenceButtons.length" class="flex flex-1 flex-wrap gap-1">
      <button
        v-for="button in referenceButtons"
        :key="`ref-${button.label}`"
        type="button"
        class="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
        :title="button.hint ? button.hint : undefined"
        @click="insertText(button.insert)"
      >
        {{ button.label }}
      </button>
    </div>

    <div>
      <label class="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-slate-500">Expression</label>
      <div v-if="highlightedHtml" class="relative">
        <div
          aria-hidden="true"
          class="pointer-events-none w-full min-h-24 whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-white px-2 py-1.5 font-mono text-[11px]"
          v-html="highlightedHtml || placeholderHtml"
        />
        <textarea
          :value="modelValue"
          :rows="rows"
          class="absolute inset-0 w-full resize-none whitespace-pre-wrap break-words rounded-lg border border-transparent bg-transparent px-2 py-1.5 font-mono text-[11px] text-transparent caret-slate-900 outline-none focus:border-primary/40"
          @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
          @blur="emit('blur')"
        />
      </div>
      <textarea
        v-else
        :value="modelValue"
        :rows="rows"
        class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/20 font-mono"
        :placeholder="placeholder"
        @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
        @blur="emit('blur')"
      />
    </div>

    <p v-if="error" class="text-[11px] text-rose-700">{{ error }}</p>
  </div>
</template>
