<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getChannelCategories, type ChannelCategory, type ChannelCategoryItem } from '@/api/channels'

const props = defineProps<{
  modelValue: ChannelCategory[]
}>()

const emit = defineEmits<{
  'update:modelValue': [ChannelCategory[]]
}>()

const categories = ref<ChannelCategoryItem[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    categories.value = await getChannelCategories()
  } finally {
    loading.value = false
  }
})

function toggle(slug: string) {
  const current = [...props.modelValue]
  const idx = current.indexOf(slug as ChannelCategory)
  if (idx >= 0) {
    current.splice(idx, 1)
  } else {
    current.push(slug as ChannelCategory)
  }
  emit('update:modelValue', current)
}
</script>

<template>
  <div class="space-y-4">
    <div v-if="loading" class="flex items-center justify-center py-10">
      <svg class="h-6 w-6 animate-spin text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>

    <div v-else class="flex flex-wrap gap-2.5">
      <button
        v-for="cat in categories"
        :key="cat.slug"
        type="button"
        class="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5"
        :class="modelValue.includes(cat.slug as ChannelCategory)
          ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-[0_8px_20px_color-mix(in_srgb,var(--color-primary)_30%,transparent)]'
          : 'border-slate-200 bg-white text-slate-700 hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)]'"
        @click="toggle(cat.slug)"
      >
        <svg
          v-if="modelValue.includes(cat.slug as ChannelCategory)"
          class="h-3.5 w-3.5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="3"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        {{ cat.label }}
      </button>
    </div>

    <p v-if="modelValue.length > 0" class="text-xs font-medium text-[var(--color-primary)]">
      {{ modelValue.length }} catégorie{{ modelValue.length > 1 ? 's' : '' }} sélectionnée{{ modelValue.length > 1 ? 's' : '' }}
    </p>
  </div>
</template>
