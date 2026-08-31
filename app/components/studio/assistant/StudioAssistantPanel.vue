<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted } from 'vue'
import { useStudioStore } from '@/stores/studio'
import { useStudioAgentStore } from '@/stores/studio-agent'
import MentionPicker from '@/components/studio/assistant/MentionPicker.vue'
import { fetchStatsDataEmbeddableBlocks, type ContentMention } from '@/api/studio'

const studio = useStudioStore()
const agent = useStudioAgentStore()

const draft = ref('')
const scrollEl = ref<HTMLElement | null>(null)
const menuOpen = ref(false)

// ─── Mentions `@` ────────────────────────────────────────────────────────────
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const pickerRef = ref<InstanceType<typeof MentionPicker> | null>(null)
/** Jeton `@…` en cours de saisie (null = pas de sélecteur ouvert). */
const mention = ref<{ start: number; query: string } | null>(null)
/** Contenus retenus, à joindre en contexte à l'assistant. */
const mentions = ref<ContentMention[]>([])

function syncMention() {
  const el = textareaRef.value
  if (!el) {
    mention.value = null
    return
  }
  const caret = el.selectionStart ?? draft.value.length
  const m = /(?:^|\s)@([^\s@]*)$/.exec(draft.value.slice(0, caret))
  const q = m?.[1]
  mention.value = q === undefined ? null : { start: caret - q.length - 1, query: q }
}

function applyMention(item: ContentMention) {
  const el = textareaRef.value
  const caret = el?.selectionStart ?? draft.value.length
  const start = mention.value?.start ?? caret
  const label = `@${item.title} `
  const before = draft.value.slice(0, start)
  draft.value = before + label + draft.value.slice(caret)
  mention.value = null
  if (!mentions.value.some((x) => x.type === item.type && x.slug === item.slug)) mentions.value.push(item)
  nextTick(() => {
    const pos = (before + label).length
    el?.setSelectionRange(pos, pos)
    el?.focus()
  })
}

function removeMention(item: ContentMention) {
  mentions.value = mentions.value.filter((x) => !(x.type === item.type && x.slug === item.slug))
}

async function buildMentionContext(list: ContentMention[]): Promise<string> {
  const lines = ['---', 'Contenus référencés par l’utilisateur (@) :']
  for (const m of list) {
    lines.push(`- [${m.type}] « ${m.title} » — slug: ${m.slug}`)
    if (m.type === 'statsdata') {
      try {
        const { blocks } = await fetchStatsDataEmbeddableBlocks(m.slug)
        for (const b of blocks) lines.push(`    • ${b.type} "${b.title}" → sourceBlockId: ${b.id}`)
      } catch {
        /* best effort */
      }
    }
  }
  return lines.join('\n')
}

const contentId = computed(() => studio.content?.id ?? null)
const contentType = computed(() => studio.content?.type ?? 'statsdata')
const isReady = computed(() => agent.conversationId !== null)
const isBusy = computed(() => agent.status === 'thinking' || agent.status === 'applying')
const canSend = computed(() => isReady.value && !isBusy.value)

const currentTitle = computed(() => agent.currentConversation?.title || 'Nouvelle conversation')

const SUGGESTIONS: Record<string, string[]> = {
  statsdata: [
    'Ajoute un graphique en barres de la population par région à partir de mes sources',
    'Crée une page modèle par région avec sa barre de recherche',
    'Ajoute un KPI du total et un tableau détaillé en dessous',
    'Trouve une source publique sur le chômage et fais-en un graphique',
  ],
  article: [
    'Rédige l’article complet : chapô, 3-4 parties analysées, encadré « à retenir » et conclusion',
    'Ajoute une partie « Ce que disent les régions » avec un titre, deux paragraphes et un graphique',
    'Insère un encadré « à retenir » avec 3 points clés',
    'Ajoute une citation d’expert et sa source',
  ],
  survey: [
    'Ajoute une question à choix unique sur la satisfaction',
    'Ajoute une échelle de 1 à 10 avec des libellés',
    'Ajoute une question à réponses multiples',
  ],
}

const suggestions = computed(() => SUGGESTIONS[contentType.value] ?? SUGGESTIONS.statsdata ?? [])

const statusLabel = computed(() => {
  switch (agent.status) {
    case 'thinking':
      return 'L’assistant réfléchit…'
    case 'applying':
      return 'Application des changements…'
    case 'error':
      return agent.error ?? 'Une erreur est survenue.'
    default:
      return ''
  }
})

function formatDate(iso?: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

async function boot() {
  if (contentId.value && contentId.value !== 'demo') {
    await agent.openForContent(contentId.value)
  }
}

onMounted(boot)
watch(contentId, boot)

watch(
  () => agent.messages.length,
  () => nextTick(() => scrollEl.value?.scrollTo({ top: scrollEl.value.scrollHeight })),
)

async function send(text: string) {
  const trimmed = text.trim()
  if (!trimmed || !canSend.value) return

  // Mentions encore présentes dans le brouillon envoyé.
  const active = mentions.value.filter((m) => text.includes(`@${m.title}`))
  draft.value = ''
  mention.value = null
  mentions.value = []

  const apiText = active.length ? `${trimmed}\n\n${await buildMentionContext(active)}` : undefined
  await agent.send(trimmed, apiText)
}

function onKeydown(e: KeyboardEvent) {
  if (mention.value) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      pickerRef.value?.moveDown()
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      pickerRef.value?.moveUp()
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      mention.value = null
      return
    }
    if ((e.key === 'Enter' || e.key === 'Tab') && pickerRef.value?.hasResults()) {
      e.preventDefault()
      pickerRef.value.selectActive()
      return
    }
  }
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    send(draft.value)
  }
}

async function pickConversation(id: number) {
  menuOpen.value = false
  await agent.switchConversation(id)
}

async function startNew() {
  menuOpen.value = false
  await agent.newConversation()
}

async function removeConversation(id: number) {
  await agent.deleteConversation(id)
}
</script>

<template>
  <div class="flex h-full flex-col bg-white">
    <header class="relative flex items-center gap-2 border-b border-[var(--studio-line)] px-3 py-2.5">
      <span
        class="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[var(--studio-tag)] text-[var(--studio-tag-ink)]"
        aria-hidden="true"
      >
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.456-2.456L14.25 6l1.035-.259a3.375 3.375 0 0 0 2.456-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z"
          />
        </svg>
      </span>

      <button
        type="button"
        class="flex min-w-0 flex-1 items-center gap-1 rounded-lg px-2 py-1 text-left hover:bg-slate-50"
        @click="menuOpen = !menuOpen"
      >
        <span class="truncate text-sm font-semibold text-slate-800">{{ currentTitle }}</span>
        <svg class="h-3.5 w-3.5 shrink-0 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.06l3.71-3.83a.75.75 0 1 1 1.08 1.04l-4.25 4.4a.75.75 0 0 1-1.08 0l-4.25-4.4a.75.75 0 0 1 .02-1.06Z" clip-rule="evenodd" />
        </svg>
      </button>

      <button
        type="button"
        class="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        title="Nouvelle conversation"
        @click="startNew"
      >
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
      <button
        type="button"
        class="shrink-0 rounded-lg p-1.5 text-[15px] leading-none text-[var(--studio-faint)] hover:bg-slate-100 hover:text-[var(--studio-ink)]"
        aria-label="Fermer le panneau"
        @click="studio.closePanel()"
      >
        ✕
      </button>

      <!-- Liste des conversations -->
      <div v-if="menuOpen" class="fixed inset-0 z-40" @click="menuOpen = false" />
      <div
        v-if="menuOpen"
        class="absolute left-2 right-2 top-[calc(100%-2px)] z-50 max-h-[320px] overflow-y-auto rounded-xl border border-[var(--studio-line-strong)] bg-white py-1 shadow-lg"
      >
        <button
          type="button"
          class="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-medium text-[var(--color-primary)] hover:bg-slate-50"
          @click="startNew"
        >
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nouvelle conversation
        </button>

        <p v-if="agent.conversations.length === 0" class="px-3 py-2 text-xs text-slate-400">
          Aucune conversation.
        </p>

        <div
          v-for="c in agent.conversations"
          :key="c.id"
          class="group flex items-center gap-2 px-2 py-1.5"
          :class="c.id === agent.conversationId ? 'bg-[var(--studio-accent-wash)]' : 'hover:bg-slate-50'"
        >
          <button
            type="button"
            class="min-w-0 flex-1 text-left"
            @click="pickConversation(c.id)"
          >
            <span class="block truncate text-[13px] text-slate-700">
              {{ c.title || 'Sans titre' }}
            </span>
            <span class="text-[11px] text-slate-400">
              {{ formatDate(c.updatedAt) }} · {{ c.messageCount }} message{{ c.messageCount > 1 ? 's' : '' }}
            </span>
          </button>
          <button
            type="button"
            class="shrink-0 rounded-md p-1 text-slate-300 opacity-0 transition hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100"
            title="Supprimer cette conversation"
            @click.stop="removeConversation(c.id)"
          >
            <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <div ref="scrollEl" class="flex-1 space-y-3 overflow-y-auto px-4 py-4">
      <template v-if="agent.messages.length === 0">
        <p class="text-sm text-slate-400">
          Décris ce que tu veux ajouter ou modifier — ou choisis une suggestion :
        </p>
        <div class="flex flex-col gap-2">
          <button
            v-for="s in suggestions"
            :key="s"
            type="button"
            :disabled="!canSend"
            class="rounded-xl border border-[var(--studio-line-strong)] px-3 py-2 text-left text-[13px] leading-snug text-slate-600 transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--studio-accent-wash)] hover:text-slate-800 disabled:opacity-50"
            @click="send(s)"
          >
            {{ s }}
          </button>
        </div>
      </template>

      <div
        v-for="m in agent.messages"
        :key="m.id"
        class="flex flex-col gap-1"
        :class="m.role === 'user' ? 'items-end' : 'items-start'"
      >
        <div
          class="max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm"
          :class="m.role === 'user' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-800'"
        >
          <span v-if="m.pending" class="text-slate-400">…</span>
          <span v-else>{{ m.text }}</span>
        </div>

        <button
          v-if="m.undoSteps && !m.reverted && !m.pending"
          type="button"
          class="text-xs font-medium text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline"
          @click="agent.undoRun(m.runId!)"
        >
          Annuler ces changements
        </button>
        <span v-else-if="m.reverted" class="text-xs text-slate-300">Changements annulés</span>
      </div>
    </div>

    <p
      v-if="statusLabel"
      class="px-4 pb-1 text-xs"
      :class="agent.status === 'error' ? 'text-rose-500' : 'text-slate-400'"
    >
      {{ statusLabel }}
    </p>

    <footer class="border-t border-[var(--studio-line)] p-3">
      <div v-if="mentions.length" class="mb-2 flex flex-wrap gap-1.5">
        <span
          v-for="m in mentions"
          :key="`${m.type}:${m.slug}`"
          class="inline-flex items-center gap-1 rounded-full bg-[var(--studio-tag)] px-2 py-1 text-[11px] font-semibold text-[var(--studio-tag-ink)]"
        >
          <span class="max-w-[160px] truncate">@{{ m.title }}</span>
          <button type="button" class="leading-none opacity-60 hover:opacity-100" aria-label="Retirer" @click="removeMention(m)">✕</button>
        </span>
      </div>

      <div class="relative">
        <MentionPicker
          v-if="mention"
          ref="pickerRef"
          :query="mention.query"
          @select="applyMention"
          @close="mention = null"
        />
        <textarea
          ref="textareaRef"
          v-model="draft"
          rows="2"
          :disabled="!canSend"
          placeholder="Écris à l’assistant… (@ pour référencer un contenu)"
          class="studio-input block w-full resize-none text-sm disabled:opacity-50"
          @keydown="onKeydown"
          @input="syncMention"
          @click="syncMention"
          @keyup="syncMention"
        />
      </div>
      <div class="mt-2 flex items-center justify-between">
        <span class="text-[11px] text-slate-300">Entrée pour envoyer · @ pour référencer</span>
        <button
          type="button"
          class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          :disabled="!draft.trim() || !canSend"
          @click="send(draft)"
        >
          Envoyer
        </button>
      </div>
    </footer>
  </div>
</template>
