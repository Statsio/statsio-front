<script setup lang="ts">
defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [string]
}>()

function clear() {
  emit('update:modelValue', '')
}
</script>

<template>
  <div
    class="flex min-w-[280px] flex-1 items-center gap-3 rounded-[14px] border-[1.5px] bg-[#f4f3f8] px-[18px] py-[13px]"
    :class="modelValue ? 'border-[#c4b5fd]' : 'border-slate-200/80'"
  >
    <svg class="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
    <input
      :value="modelValue"
      type="search"
      :placeholder="placeholder"
      class="min-w-0 flex-1 bg-transparent text-[14.5px] font-semibold text-slate-950 placeholder:font-medium placeholder:text-slate-400 focus:outline-none"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <button
      v-if="modelValue"
      type="button"
      class="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-slate-200/80 text-[12px] text-slate-600 hover:bg-slate-300"
      aria-label="Effacer la recherche"
      @click="clear"
    >
      ✕
    </button>
  </div>
</template>
