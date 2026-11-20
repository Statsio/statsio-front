<script setup lang="ts">
import { computed } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { stripInlineHtml } from '@/lib/inline-rich-text'
import { slugify } from '@/lib/slug'
import { useStudioToast } from '@/composables/useStudioToast'
import type { Section, SectionTheme } from '@/types/studio'
import StudioIcon from '@/components/studio/ui/StudioIcon.vue'

const studio = useStudioStore()
const { show } = useStudioToast()
const section = computed<Section | null>(() => studio.selectedSection)
const isSurvey = computed(() => studio.content?.type === 'survey')
const noun = computed(() => (isSurvey.value ? 'Étape' : 'Section'))

function set<K extends keyof Section>(key: K, value: Section[K] | undefined) {
  if (!section.value) return
  studio.updateSection(section.value.id, { [key]: value })
}
// L'en-tête est du texte enrichi (édité en place sur le canevas). Ici on n'édite
// que le texte : saisir dans ces champs remet la valeur à plat.
function plain(key: 'kicker' | 'title' | 'description') {
  return stripInlineHtml(section.value?.[key])
}
function setText(key: 'kicker' | 'title' | 'description', e: Event) {
  set(key, (e.target as HTMLInputElement).value || undefined)
}

const THEMES: { v: SectionTheme; l: string }[] = [
  { v: 'default', l: 'Normal' },
  { v: 'accent', l: 'Teinté' },
  { v: 'dark', l: 'Sombre' },
]

const heading = computed(() => plain('title') || plain('kicker') || noun.value)
const anchor = computed(() => slugify(plain('title') || plain('kicker') || 'section'))
const blockCount = computed(() => (section.value ? (studio.blocksByZone[`${section.value.id}-0`] ?? []).length : 0))
const rootCount = computed(() => studio.currentPageCanvasItems.filter((i) => i.section).length)

function remove() {
  const s = section.value
  if (!s) return
  if (rootCount.value < 2 && !s.zoneId) {
    show('Une page garde au moins une section')
    return
  }
  studio.removeSection(s.id)
  show(`${noun.value} supprimée`, 'Annuler', () => studio.undo())
}
</script>

<template>
  <div v-if="section" class="flex h-full flex-col overflow-hidden">
    <div class="flex shrink-0 flex-col gap-3.5 px-4 pt-4">
      <div class="st-ins-h">
        <span class="st-tg"><StudioIcon name="layout" :size="20" /></span>
        <div class="min-w-0 flex-1">
          <span class="st-lbl">{{ noun }}</span>
          <h2 class="st-h2 truncate">{{ heading }}</h2>
        </div>
        <button class="st-ibtn" type="button" aria-label="Fermer (Échap)" @click="studio.selectSection(null)">
          <StudioIcon name="x" :size="16" />
        </button>
      </div>
    </div>

    <div class="flex flex-1 flex-col gap-[18px] overflow-y-auto px-4 pb-6 pt-4">
      <div class="st-fset">
        <div v-if="!isSurvey" class="flex flex-col gap-1.5">
          <label class="st-lbl" for="s-kicker">Sur-titre</label>
          <input id="s-kicker" :value="plain('kicker')" type="text" class="studio-input" placeholder="ex. Par région" @input="setText('kicker', $event)" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="st-lbl" for="s-title">Titre</label>
          <input id="s-title" :value="plain('title')" type="text" class="studio-input" :placeholder="`Titre de ${isSurvey ? 'l’étape' : 'la section'}`" @input="setText('title', $event)" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="st-lbl" for="s-desc">Description</label>
          <textarea id="s-desc" :value="plain('description')" rows="2" class="studio-input resize-y" placeholder="Phrase de contexte (facultative)" @input="setText('description', $event)" />
        </div>
        <p class="st-hint">Mise en forme (gras, surlignage, variable…) : sélectionnez le texte directement sur le canevas.</p>
      </div>

      <div v-if="!isSurvey" class="st-fset">
        <div class="flex flex-col gap-1.5">
          <span class="st-lbl">Fond</span>
          <div class="st-seg" role="group" aria-label="Fond">
            <button
              v-for="t in THEMES"
              :key="t.v"
              type="button"
              :aria-pressed="(section.theme ?? 'default') === t.v"
              @click="set('theme', t.v === 'default' ? undefined : t.v)"
            >{{ t.l }}</button>
          </div>
        </div>
        <p class="st-hint">
          Un titre fait apparaître la section dans le sommaire, avec l’ancre <b class="font-mono">#{{ anchor }}</b>.
        </p>
        <p v-if="studio.content?.type === 'statsdata'" class="st-hint">Les titres acceptent les variables : tapez <b>{{ '{' + '{' }}carburant{{ '}' + '}' }}</b>.</p>
      </div>

      <div class="st-ins-foot mt-auto">
        <span class="st-meta">{{ blockCount }} bloc{{ blockCount > 1 ? 's' : '' }}</span>
        <button type="button" class="st-danger" :disabled="section.locked" @click="remove">
          <StudioIcon name="trash" :size="14" />Supprimer
        </button>
      </div>
    </div>
  </div>
</template>
