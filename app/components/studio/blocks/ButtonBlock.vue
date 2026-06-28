<script setup lang="ts">
import { computed } from 'vue'
import type { StudioBlock } from '@/types/studio'

const props = defineProps<{ block: StudioBlock; readonly?: boolean }>()

const label   = computed(() => props.block.config.buttonLabel ?? '')
const url     = computed(() => props.block.config.buttonUrl ?? '')
const variant = computed(() => props.block.config.buttonVariant ?? 'primary')
const align   = computed(() => props.block.config.buttonAlign ?? 'center')
const size    = computed(() => props.block.config.buttonSize ?? 'md')

const isEmpty = computed(() => !label.value)

const alignClass = computed(() => ({
  left:   'text-left',
  center: 'text-center',
  right:  'text-right',
}[align.value]))

const variantClass = computed(() => ({
  primary:   'bg-[var(--color-primary)] text-white hover:opacity-90',
  secondary: 'bg-slate-900 text-white hover:bg-slate-700',
  outline:   'border-2 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5',
}[variant.value]))

const sizeClass = computed(() => ({
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
}[size.value]))
</script>

<template>
  <!-- Empty state -->
  <div
    v-if="isEmpty"
    class="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-10 text-slate-400"
  >
    <svg class="w-7 h-7 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1 1 20.25 10.5M8.288 14.212A5.25 5.25 0 1 1 17.25 10.5" />
    </svg>
    <span class="text-xs font-medium">Configurer le bouton →</span>
  </div>

  <!-- Button -->
  <div v-else :class="alignClass">
    <component
      :is="url && readonly ? 'a' : 'span'"
      :href="url && readonly ? url : undefined"
      :target="url && readonly ? '_blank' : undefined"
      :rel="url && readonly ? 'noopener noreferrer' : undefined"
      class="inline-block rounded-full font-semibold transition-all duration-200 cursor-pointer"
      :class="[variantClass, sizeClass]"
    >
      {{ label }}
    </component>
    <p v-if="!readonly" class="mt-1 text-[10px] text-slate-400">Non interactif en mode édition</p>
  </div>
</template>
