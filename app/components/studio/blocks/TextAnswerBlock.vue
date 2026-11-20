<script setup lang="ts">
import { computed, ref } from 'vue'
import type { StudioBlock } from '@/types/studio'
import { useFormBlockResponse } from '@/composables/useFormBlockResponse'

/**
 * Question « Réponse libre » : texte court ou long. Les réponses ne sont jamais
 * publiées individuellement — seul leur nombre l'est.
 */
const props = defineProps<{ block: StudioBlock; readonly?: boolean }>()

const long = computed(() => props.block.config.formLongAnswer !== false)
const MAX = 2000

const text = ref('')
const form = props.readonly ? useFormBlockResponse(() => props.block.id) : null

function showForm() {
  if (!form) return true
  return !form.answered.value || form.editing.value
}

function submit() {
  if (!form || !text.value.trim()) return
  form.submit(text.value.trim())
}

function edit() {
  if (!form) return
  text.value = typeof form.myAnswer.value === 'string' ? form.myAnswer.value : ''
  form.startEditing()
}
</script>

<template>
  <div class="flex flex-col gap-3.5">
    <p v-if="block.config.title || !readonly" class="text-[15px] font-bold">
      {{ block.config.title || 'Question sans titre' }}
      <span v-if="block.config.formRequired" class="text-rose-500">*</span>
    </p>

    <!-- Studio : aperçu statique -->
    <div v-if="!readonly" class="flex flex-col gap-2">
      <div
        class="rounded-[4px] border-2 border-[var(--ds-ol)] px-3.5 py-3 text-[14.5px] text-[var(--ds-faint)]"
        :class="long ? 'min-h-[96px]' : 'h-[46px]'"
      >
        Votre réponse…
      </div>
      <p class="text-[10px] text-[var(--studio-faint)]">Aperçu — interactif sur la page publiée</p>
    </div>

    <div v-else-if="form?.loading.value" class="py-2 text-xs text-[var(--studio-faint)]">Chargement…</div>

    <!-- Public : saisie -->
    <div v-else-if="showForm()" class="flex flex-col gap-3">
      <textarea
        v-if="long"
        v-model="text"
        rows="4"
        :maxlength="MAX"
        class="rounded-[4px] border-2 border-[var(--ds-ol)] bg-[var(--ds-surface)] px-3.5 py-3 text-[14.5px] focus:outline-none"
        placeholder="Votre réponse…"
        :aria-label="block.config.title || 'Votre réponse'"
      />
      <input
        v-else
        v-model="text"
        type="text"
        :maxlength="MAX"
        class="h-[46px] rounded-[4px] border-2 border-[var(--ds-ol)] bg-[var(--ds-surface)] px-3.5 text-[14.5px] focus:outline-none"
        placeholder="Votre réponse…"
        :aria-label="block.config.title || 'Votre réponse'"
      />
      <div class="flex flex-wrap items-center gap-3">
        <button
          class="rounded-full bg-[var(--color-primary)] px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          :disabled="!text.trim() || form?.submitting.value"
          @click="submit"
        >
          {{ form?.submitting.value ? 'Envoi…' : 'Envoyer ma réponse' }}
        </button>
        <span class="font-mono text-[11px] text-[var(--ds-faint)]">{{ text.length }} / {{ MAX }}</span>
      </div>
      <p v-if="form?.submitError.value" class="text-[12.5px] text-rose-600" role="alert">{{ form.submitError.value }}</p>
    </div>

    <!-- Public : après envoi (aucune réponse individuelle n'est publiée) -->
    <div v-else class="flex flex-col gap-1.5 rounded-[4px] border-2 border-[var(--ds-divide)] px-4 py-3">
      <p class="text-[14px] font-bold">✓ Réponse enregistrée</p>
      <p class="text-[12.5px] text-[var(--ds-muted)]">
        {{ form?.aggregate.value.totalResponses ?? 0 }} réponse{{ (form?.aggregate.value.totalResponses ?? 0) > 1 ? 's' : '' }} reçue{{ (form?.aggregate.value.totalResponses ?? 0) > 1 ? 's' : '' }}.
        Les réponses libres ne sont pas publiées individuellement.
      </p>
      <button v-if="form?.canChange.value" type="button" class="self-start text-[12.5px] font-semibold text-[var(--color-primary)] hover:underline" @click="edit">Modifier ma réponse</button>
    </div>
  </div>
</template>
