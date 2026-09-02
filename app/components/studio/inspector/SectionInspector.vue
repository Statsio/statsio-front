<script setup lang="ts">
import { computed } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { stripInlineHtml } from '@/lib/inline-rich-text'
import type { Section, SectionTheme } from '@/types/studio'

const studio = useStudioStore()
const section = computed<Section | null>(() => studio.selectedSection)

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
  { v: 'default', l: 'Neutre' },
  { v: 'accent', l: 'Accent' },
  { v: 'dark', l: 'Sombre' },
]
</script>

<template>
  <div v-if="section" class="flex h-full flex-col overflow-hidden font-sans">
    <div class="flex shrink-0 items-center gap-3 px-5 pb-3.5 pt-[18px]">
      <span class="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] bg-[var(--studio-tag)]">
        <svg class="h-4 w-4 text-[var(--studio-tag-ink)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 4.5v15m6-15v15M4.125 19.5h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125Z" />
        </svg>
      </span>
      <div class="min-w-0 flex-1">
        <p class="truncate text-[16px] font-extrabold text-[var(--studio-ink)]">Section</p>
        <p class="text-[12.5px] text-[var(--studio-muted)]">En-tête &amp; thème</p>
      </div>
      <button
        class="shrink-0 text-[16px] leading-none text-[var(--studio-faint)] hover:text-[var(--studio-ink)]"
        aria-label="Fermer"
        @click="studio.selectSection(null)"
      >✕</button>
    </div>

    <div class="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-6 pt-2">
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-[var(--studio-muted)]">Sur-titre (kicker)</label>
        <input :value="plain('kicker')" type="text" class="cfg-input" placeholder="ex. Graphique · Barres" @input="setText('kicker', $event)" />
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-[var(--studio-muted)]">Titre</label>
        <input :value="plain('title')" type="text" class="cfg-input" placeholder="Titre de la section" @input="setText('title', $event)" />
        <p class="text-[11px] leading-relaxed text-[var(--studio-faint)]">
          Un titre → la section apparaît dans le sommaire de la page publiée et devient accessible via une ancre <code class="font-mono">#…</code> générée automatiquement depuis le titre.
        </p>
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-[var(--studio-muted)]">Description</label>
        <textarea :value="plain('description')" rows="2" class="cfg-input resize-none" placeholder="Phrase de contexte (optionnelle)" @input="setText('description', $event)" />
      </div>
      <p class="-mt-2 text-[11px] leading-relaxed text-[var(--studio-faint)]">
        Mise en forme (gras, surlignage, variable…) : sélectionnez le texte directement sur le canevas.
      </p>

      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-[var(--studio-muted)]">Thème de fond</label>
        <div class="grid grid-cols-3 gap-1.5">
          <button
            v-for="t in THEMES"
            :key="t.v"
            class="rounded-xl border py-2.5 text-[11px] font-semibold transition-colors"
            :class="(section.theme ?? 'default') === t.v ? 'cfg-active' : 'cfg-inactive'"
            @click="set('theme', t.v === 'default' ? undefined : t.v)"
          >{{ t.l }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference "tailwindcss";
.cfg-input {
  @apply w-full;
  box-sizing: border-box;
  padding: 11px 13px;
  border-radius: 10px;
  border: 1.5px solid var(--studio-line-strong);
  font-size: 13px;
  color: var(--studio-ink);
  background: #fff;
}
.cfg-input:focus { outline: none; border-color: var(--color-primary); }
.cfg-active { border-color: var(--studio-ink); background: var(--studio-ink); color: #fff; }
.cfg-inactive { border-color: var(--studio-line-strong); color: color-mix(in srgb, var(--studio-ink) 70%, transparent); }
.cfg-inactive:hover { border-color: var(--color-primary); }
</style>
