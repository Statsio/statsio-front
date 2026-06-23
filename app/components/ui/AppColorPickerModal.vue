<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'

const modelValue = defineModel<boolean>({ default: false })

const props = withDefaults(
  defineProps<{
    title?: string
    value?: string | null
    allowClear?: boolean
  }>(),
  {
    title: 'Choisir une couleur',
    value: null,
    allowClear: false,
  },
)

const emit = defineEmits<{
  apply: [hex: string | null]
  close: []
}>()

const presets = [
  '#111827',
  '#334155',
  '#475569',
  '#64748b',
  '#94a3b8',
  '#e2e8f0',
  '#ffffff',
  '#000000',
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
] as const

const inputRef = ref<HTMLInputElement | null>(null)
const draft = ref<string>('')

const normalizeHex = (raw: string): string | null => {
  const v = raw.trim()
  if (!v) return null
  const m = v.match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
  if (!m) return null
  const hex = m[1]!.toLowerCase()
  if (hex.length === 3) {
    const [r, g, b] = hex.split('')
    return `#${r}${r}${g}${g}${b}${b}`
  }
  return `#${hex}`
}

const initial = computed(() => normalizeHex(props.value ?? '') ?? props.value ?? null)

watch(
  () => modelValue.value,
  async (open) => {
    if (!open) return
    draft.value = (initial.value ?? '').toString()
    await nextTick()
    inputRef.value?.focus()
    inputRef.value?.select()
  },
)

const preview = computed(() => normalizeHex(draft.value) ?? initial.value ?? '#ffffff')
const isValid = computed(() => Boolean(normalizeHex(draft.value) ?? (draft.value.trim() === '' && props.allowClear)))

const close = () => {
  modelValue.value = false
  emit('close')
}

const apply = () => {
  const norm = normalizeHex(draft.value)
  if (norm) {
    emit('apply', norm)
    close()
    return
  }
  if (props.allowClear && draft.value.trim() === '') {
    emit('apply', null)
    close()
  }
}

const pick = (hex: string) => {
  draft.value = hex
}
</script>

<template>
  <Teleport to="body">
    <Transition name="app-modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[220] flex items-end justify-center p-4 sm:items-center"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        @keydown.esc.prevent.stop="close"
      >
        <button
          type="button"
          class="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
          aria-label="Fermer"
          @click="close"
        />

        <section
          class="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.55)]"
        >
          <div class="flex items-center justify-between gap-3 px-1 pb-3">
            <h3 class="text-sm font-semibold text-slate-900">{{ title }}</h3>
            <button
              type="button"
              class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              aria-label="Fermer"
              @click="close"
            >
              <svg viewBox="0 0 24 24" class="h-4.5 w-4.5" fill="currentColor" aria-hidden="true">
                <path
                  d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12 5.7 16.89a1 1 0 1 0 1.41 1.41L12 13.41l4.89 4.89a1 1 0 0 0 1.41-1.41L13.41 12l4.89-4.89a1 1 0 0 0 0-1.4Z"
                />
              </svg>
            </button>
          </div>

          <div class="grid grid-cols-7 gap-2 px-1 pb-4" aria-label="Palette de couleurs">
            <button
              v-for="c in presets"
              :key="c"
              type="button"
              class="h-9 w-9 rounded-2xl border border-slate-200 shadow-sm transition hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              :style="{ backgroundColor: c }"
              :aria-label="`Choisir ${c}`"
              @click="pick(c)"
            />
          </div>

          <div class="flex items-center gap-3 px-1">
            <div
              class="h-10 w-10 rounded-2xl border border-slate-200 shadow-sm"
              :style="{ backgroundColor: preview }"
              aria-label="Aperçu couleur"
            />
            <div class="min-w-0 flex-1">
              <label class="mb-1 block text-xs font-semibold text-slate-600" for="color-hex">Hex</label>
              <input
                id="color-hex"
                ref="inputRef"
                v-model="draft"
                type="text"
                inputmode="text"
                spellcheck="false"
                class="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                placeholder="#111827"
                @keydown.enter.prevent="apply"
              />
              <p v-if="!isValid" class="mt-1 text-xs text-rose-700">Couleur invalide. Exemple: #111827</p>
            </div>
          </div>

          <div class="mt-4 flex flex-wrap items-center justify-end gap-2 px-1">
            <AppButton variant="secondary" size="md" type="button" @click="close">Annuler</AppButton>
            <AppButton variant="primary" size="md" type="button" :disabled="!isValid" @click="apply">
              Appliquer
            </AppButton>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.app-modal-enter-active,
.app-modal-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}
.app-modal-enter-from,
.app-modal-leave-to {
  opacity: 0;
  transform: translateY(0.5rem) scale(0.99);
}
</style>

