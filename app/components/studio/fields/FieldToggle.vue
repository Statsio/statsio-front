<script setup lang="ts">
withDefaults(defineProps<{ label: string; sub?: string }>(), { sub: '' })

const model = defineModel<boolean>({ default: false })
</script>

<template>
  <div
    class="flex items-center justify-between gap-3.5 rounded-xl border border-[var(--studio-line)] px-3.5 py-3"
  >
    <div class="min-w-0">
      <div class="text-[13px] font-semibold text-[var(--studio-ink)]">{{ label }}</div>
      <div v-if="sub" class="mt-0.5 text-[11.5px] leading-[1.45] text-[var(--studio-faint)]">{{ sub }}</div>
    </div>
    <button
      type="button"
      role="switch"
      :aria-checked="model"
      class="relative h-6 w-[42px] shrink-0 rounded-full transition-colors"
      :class="model ? 'bg-[var(--color-primary)]' : 'bg-[color:color-mix(in_srgb,var(--studio-ink)_16%,transparent)]'"
      @click="model = !model"
    >
      <span
        class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.25)] transition-[left]"
        :class="model ? 'left-5' : 'left-0.5'"
      />
    </button>
  </div>
</template>
