<script setup lang="ts">
import { computed } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useStudioMetaStore } from '@/stores/studio-meta'
import type { SurveyResultsVisibility } from '@/api/studio'
import type { SurveyKind } from '@/types/content-creation'

/**
 * Onglet « Réglages » du rail (sondages) : format, vérification d'identité,
 * une réponse par compte, visibilité des résultats, ouverture / clôture.
 * Enregistré tout de suite (PATCH du document) — hors autosave du canevas.
 */
const studio = useStudioStore()
const meta = useStudioMetaStore()

const KINDS: { value: SurveyKind; label: string }[] = [
  { value: 'single_question', label: 'Question rapide' },
  { value: 'long', label: 'Questionnaire' },
  { value: 'petition', label: 'Pétition' },
]
const RESULTS: { value: SurveyResultsVisibility; label: string }[] = [
  { value: 'after_submit', label: 'Après l’envoi' },
  { value: 'at_close', label: 'À la clôture' },
  { value: 'never', label: 'Jamais' },
]

const doc = computed(() => meta.doc)
const kind = computed<SurveyKind>(() => doc.value?.survey_kind ?? studio.content?.survey_kind ?? 'single_question')
const idv = computed(() => doc.value?.requires_identity_verification ?? false)
const once = computed(() => doc.value?.one_response_per_account ?? true)
const results = computed<SurveyResultsVisibility>(() => doc.value?.results_visibility ?? 'after_submit')

/** ISO → `YYYY-MM-DD` (heure locale) pour un `<input type="date">`. */
function toDateInput(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
const openDate = computed(() => toDateInput(doc.value?.opens_at))
const closeDate = computed(() => toDateInput(doc.value?.response_deadline))
const datesInvalid = computed(() => !!openDate.value && !!closeDate.value && closeDate.value < openDate.value)

function setKind(value: SurveyKind) {
  if (studio.content) studio.content.survey_kind = value
  void meta.patch({ survey_kind: value })
}
function setOpen(e: Event) {
  const v = (e.target as HTMLInputElement).value
  void meta.patch({ opens_at: v ? new Date(`${v}T00:00:00`).toISOString() : null })
}
function setClose(e: Event) {
  const v = (e.target as HTMLInputElement).value
  void meta.patch({ response_deadline: v ? new Date(`${v}T23:59:59`).toISOString() : null })
}
</script>

<template>
  <div class="flex h-full flex-col gap-[18px] overflow-y-auto px-4 pb-10">
    <p v-if="!doc" class="st-hint">Enregistrez d’abord le sondage pour régler sa diffusion.</p>

    <template v-else>
      <div class="flex flex-col gap-1.5">
        <span class="st-lbl">Format</span>
        <div class="st-seg" role="group" aria-label="Format">
          <button
            v-for="k in KINDS"
            :key="k.value"
            type="button"
            :aria-pressed="kind === k.value"
            @click="setKind(k.value)"
          >{{ k.label }}</button>
        </div>
      </div>

      <div class="st-swr">
        <span>Vérification d’identité<small>Le répondant vérifie son identité avant de répondre.</small></span>
        <button
          class="st-sw"
          type="button"
          role="switch"
          :aria-checked="idv"
          aria-label="Vérification d'identité"
          @click="meta.patch({ requires_identity_verification: !idv })"
        />
      </div>

      <div class="st-swr">
        <span>Une réponse par compte<small>Empêche les votes multiples : une réponse envoyée n’est plus modifiable.</small></span>
        <button
          class="st-sw"
          type="button"
          role="switch"
          :aria-checked="once"
          aria-label="Une réponse par compte"
          @click="meta.patch({ one_response_per_account: !once })"
        />
      </div>

      <div class="flex flex-col gap-1.5">
        <span class="st-lbl">Résultats visibles</span>
        <div class="st-seg" role="group" aria-label="Résultats visibles">
          <button
            v-for="r in RESULTS"
            :key="r.value"
            type="button"
            :aria-pressed="results === r.value"
            @click="meta.patch({ results_visibility: r.value })"
          >{{ r.label }}</button>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2.5">
        <div class="flex min-w-0 flex-col gap-1.5">
          <label class="st-lbl" for="sv-open">Ouverture</label>
          <input id="sv-open" class="studio-input" type="date" :value="openDate" @change="setOpen" />
        </div>
        <div class="flex min-w-0 flex-col gap-1.5">
          <label class="st-lbl" for="sv-close">Clôture</label>
          <input id="sv-close" class="studio-input" type="date" :value="closeDate" @change="setClose" />
        </div>
      </div>
      <p v-if="datesInvalid" class="st-notice">La clôture doit suivre l’ouverture.</p>
      <p v-else class="st-hint">Sans date, le sondage est ouvert dès sa publication et ne ferme pas.</p>

      <p v-if="meta.error" class="st-notice" role="alert">{{ meta.error }}</p>
      <p v-else-if="meta.saving" class="st-meta" aria-live="polite">Enregistrement…</p>
    </template>
  </div>
</template>
