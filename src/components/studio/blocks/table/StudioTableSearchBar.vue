<script setup lang="ts">
const props = defineProps<{
  fieldId: string
  modelValue: string
  barOnly?: boolean
  showTitle?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [string]
}>()
</script>

<template>
  <div :class="barOnly ? 'bg-transparent px-0 py-0' : 'border-b border-slate-100 bg-slate-50/80 px-3 py-2'">
    <div v-if="showTitle && !barOnly" class="mb-2 flex flex-wrap items-center justify-between gap-2">
      <span class="text-[11px] font-semibold text-slate-600">Recherche</span>
    </div>
    <label class="sr-only" :for="`${fieldId}-tbl-search`">Rechercher dans le tableau</label>
    <input
      :id="`${fieldId}-tbl-search`"
      :value="modelValue"
      type="search"
      autocomplete="off"
      placeholder="Rechercher dans le tableau…"
      class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary/40 focus:ring-2 focus:ring-primary/15 motion-reduce:transition-none"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </div>
</template>

