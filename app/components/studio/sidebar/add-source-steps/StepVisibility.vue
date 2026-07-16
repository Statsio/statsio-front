<script setup lang="ts">
import StepCategories from '@/components/create/steps/StepCategories.vue'

defineProps<{
  visibility: 'private' | 'public'
  categories: string[]
}>()

const emit = defineEmits<{
  'update:visibility': ['private' | 'public']
  'update:categories': [string[]]
}>()
</script>

<template>
  <div class="space-y-5 py-2">
    <div class="grid grid-cols-2 gap-3">
      <button
        type="button"
        class="flex items-center gap-3 rounded-2xl border p-4 text-left transition hover:-translate-y-0.5"
        :class="visibility === 'private'
          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
          : 'border-slate-200 bg-white hover:border-[var(--color-primary)]/30'"
        @click="emit('update:visibility', 'private')"
      >
        <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100">
          <svg class="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </span>
        <span>
          <span class="block text-sm font-semibold" :class="visibility === 'private' ? 'text-[var(--color-primary)]' : 'text-slate-800'">Privée</span>
          <span class="block text-xs text-slate-500">Visible uniquement par vous</span>
        </span>
      </button>

      <button
        type="button"
        class="flex items-center gap-3 rounded-2xl border p-4 text-left transition hover:-translate-y-0.5"
        :class="visibility === 'public'
          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
          : 'border-slate-200 bg-white hover:border-[var(--color-primary)]/30'"
        @click="emit('update:visibility', 'public')"
      >
        <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100">
          <svg class="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
        <span>
          <span class="block text-sm font-semibold" :class="visibility === 'public' ? 'text-[var(--color-primary)]' : 'text-slate-800'">Publique</span>
          <span class="block text-xs text-slate-500">Accessible à tous, réutilisable par d'autres</span>
        </span>
      </button>
    </div>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
    >
      <div v-if="visibility === 'public'" class="rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <p class="mb-2 text-sm font-semibold text-slate-700">Catégories</p>
        <StepCategories
          :model-value="categories"
          @update:model-value="emit('update:categories', $event)"
        />
      </div>
    </Transition>
  </div>
</template>
