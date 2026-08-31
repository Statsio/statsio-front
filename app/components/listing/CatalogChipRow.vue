<script setup lang="ts">
import type { CatalogFacet } from '@/types/catalog'
import { catalogThemeStyle } from '@/lib/catalog-theme'

defineProps<{
  label: string
  modelValue: string
  options: CatalogFacet[]
  variant?: 'pill' | 'mono'
}>()

const emit = defineEmits<{
  'update:modelValue': [string]
}>()
</script>

<template>
  <div class="flex flex-wrap items-center gap-2.5">
    <span class="shrink-0 text-[9.5px] font-extrabold uppercase tracking-[0.09em] text-slate-400">{{ label }}</span>
    <div class="flex flex-wrap gap-1.5">
      <button
        v-for="option in options"
        :key="option.value || 'all'"
        type="button"
        :class="[
          'transition',
          variant === 'mono'
            ? 'rounded-lg border px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.03em]'
            : 'flex items-center gap-1.5 rounded-full border-[1.5px] px-3.5 py-[7px] text-[12.5px] font-bold',
          modelValue === option.value
            ? variant === 'mono'
              ? 'border-[#c4b5fd] bg-[#f2ecfd] text-primary'
              : 'border-slate-950 bg-slate-950 text-white'
            : variant === 'mono'
              ? 'border-slate-200 bg-white text-slate-500 hover:border-[#c4b5fd] hover:text-primary'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
        ]"
        :style="
          variant !== 'mono' && option.value && modelValue !== option.value
            ? { borderColor: 'rgba(20,20,30,0.12)' }
            : undefined
        "
        @click="emit('update:modelValue', option.value)"
      >
        <span
          v-if="variant !== 'mono' && option.value"
          class="h-1.5 w-1.5 shrink-0 rounded-full"
          :style="{ background: catalogThemeStyle(option.value).dot }"
          aria-hidden="true"
        />
        <span>{{ option.label }}</span>
        <span
          class="font-mono text-[10.5px] font-medium"
          :class="modelValue === option.value ? (variant === 'mono' ? 'text-primary/70' : 'text-white/55') : 'text-slate-400'"
        >
          {{ option.count }}
        </span>
      </button>
    </div>
  </div>
</template>
