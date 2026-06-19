<script setup lang="ts">
import { ref, computed } from 'vue'
import { useStudioStore } from '@/stores/studio'
import AppButton from '@/components/ui/AppButton.vue'

const emit = defineEmits<{ save: [] }>()
const studio = useStudioStore()

const isEditingTitle = ref(false)
const titleInput = ref<HTMLInputElement | null>(null)

function startEditTitle() {
  isEditingTitle.value = true
  setTimeout(() => titleInput.value?.select(), 0)
}

function commitTitle(e: Event) {
  const val = (e.target as HTMLInputElement).value.trim()
  if (val) studio.setTitle(val)
  isEditingTitle.value = false
}

function handleTitleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
  if (e.key === 'Escape') isEditingTitle.value = false
}

const saveLabel = computed(() => {
  switch (studio.saveStatus) {
    case 'saving': return 'Enregistrement…'
    case 'saved': return 'Enregistré'
    case 'error': return 'Erreur'
    default: return studio.isDirty ? 'Modifications non sauvegardées' : 'À jour'
  }
})

const saveDotClass = computed(() => {
  switch (studio.saveStatus) {
    case 'saving': return 'bg-amber-400 animate-pulse'
    case 'saved': return 'bg-emerald-400'
    case 'error': return 'bg-red-400'
    default: return studio.isDirty ? 'bg-amber-400' : 'bg-slate-300'
  }
})
</script>

<template>
  <header class="h-12 shrink-0 flex items-center px-4 gap-4 border-b border-slate-200 bg-white z-20">
    <!-- Left: nav toggle + logo -->
    <div class="flex items-center gap-3 shrink-0">
      <button
        class="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
        title="Basculer la sidebar"
        @click="studio.setLeftTab('blocks')"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
        </svg>
      </button>

      <a href="/" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <span class="w-6 h-6 rounded bg-[var(--color-primary)] flex items-center justify-center text-white text-[10px] font-black">S</span>
        <span class="text-sm font-bold text-slate-800 hidden sm:block">Studio</span>
      </a>
    </div>

    <!-- Center: editable title -->
    <div class="flex-1 flex justify-center">
      <div class="max-w-md w-full">
        <input
          v-if="isEditingTitle"
          ref="titleInput"
          type="text"
          class="w-full text-center text-sm font-semibold text-slate-800 bg-white border border-[var(--color-primary)] rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
          :value="studio.content?.title ?? ''"
          @blur="commitTitle"
          @keydown="handleTitleKeydown"
        />
        <button
          v-else
          class="w-full text-center text-sm font-semibold text-slate-800 hover:bg-slate-50 rounded-lg px-3 py-1 transition-colors truncate"
          @click="startEditTitle"
        >
          {{ studio.content?.title || 'Sans titre' }}
        </button>
      </div>
    </div>

    <!-- Right: save status + actions -->
    <div class="flex items-center gap-3 shrink-0">
      <!-- Save status indicator -->
      <div class="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
        <span class="w-1.5 h-1.5 rounded-full shrink-0" :class="saveDotClass" />
        {{ saveLabel }}
      </div>

      <!-- Manual save -->
      <button
        class="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
        title="Enregistrer (⌘S)"
        @click="emit('save')"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
      </button>

      <!-- Publish -->
      <AppButton size="sm" variant="primary">
        Publier
      </AppButton>
    </div>
  </header>
</template>
