<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    currentPage: number
    lastPage: number
    disabled?: boolean
  }>(),
  {
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:currentPage': [number]
}>()

const ELLIPSIS = '…' as const

const pageItems = computed<(number | typeof ELLIPSIS)[]>(() => {
  const total = props.lastPage
  const current = props.currentPage

  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const items = new Set<number>([1, total, current, current - 1, current + 1])
  const sorted = [...items].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b)

  const result: (number | typeof ELLIPSIS)[] = []
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1]! > 1) result.push(ELLIPSIS)
    result.push(n)
  })
  return result
})

function goTo(page: number) {
  if (props.disabled || page === props.currentPage || page < 1 || page > props.lastPage) return
  emit('update:currentPage', page)
}
</script>

<template>
  <nav v-if="lastPage > 1" class="flex items-center justify-center gap-1.5" aria-label="Pagination">
    <button
      type="button"
      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-40"
      :disabled="disabled || currentPage <= 1"
      aria-label="Page précédente"
      @click="goTo(currentPage - 1)"
    >
      <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>

    <template v-for="(item, index) in pageItems" :key="`${item}-${index}`">
      <span v-if="item === ELLIPSIS" class="flex h-9 w-9 items-center justify-center text-sm text-slate-400">
        {{ ELLIPSIS }}
      </span>
      <button
        v-else
        type="button"
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition"
        :class="
          item === currentPage
            ? 'bg-slate-950 text-white'
            : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
        "
        :aria-current="item === currentPage ? 'page' : undefined"
        :disabled="disabled"
        @click="goTo(item)"
      >
        {{ item }}
      </button>
    </template>

    <button
      type="button"
      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-40"
      :disabled="disabled || currentPage >= lastPage"
      aria-label="Page suivante"
      @click="goTo(currentPage + 1)"
    >
      <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>
  </nav>
</template>
