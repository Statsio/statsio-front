<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { ContentType } from '@/types/content-creation'
import { contentPropertiesPath } from '@/lib/content-display'

/**
 * Bandeau « propriétaire » affiché en tête des pages détail (StatsData / article /
 * sondage) quand `can_edit` est vrai : rappelle que le contenu est éditable et
 * offre deux raccourcis — « Éditer » vers le dashboard Propriétés du contenu et
 * « Studio » vers l'éditeur de blocs.
 */
const props = defineProps<{
  type: ContentType
  slug: string
  /** `draft` / `published` — affiche un rappel « non publié » le cas échéant. */
  status?: string | null
}>()

const propertiesPath = computed(() => contentPropertiesPath(props.type, props.slug))
const studioPath = computed(() => `/studio/${props.type}/${props.slug}`)
const isDraft = computed(() => props.status != null && props.status !== 'published')
</script>

<template>
  <div class="border-b border-[var(--studio-line)] bg-[var(--studio-tag)] print:hidden">
    <div class="mx-auto flex max-w-[1180px] flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 sm:px-6">
      <span class="mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--studio-tag-ink)]">
        Vous gérez ce contenu
      </span>
      <span
        v-if="isDraft"
        class="mono rounded-[5px] bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-[var(--studio-muted)]"
      >
        Brouillon — non publié
      </span>

      <div class="min-w-0 flex-1" />

      <div class="flex shrink-0 items-center gap-2">
        <RouterLink
          v-if="propertiesPath"
          :to="propertiesPath"
          class="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-[var(--studio-line-strong)] bg-white px-3.5 py-1.5 text-[12.5px] font-bold text-[var(--studio-muted)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--studio-tag-ink)]"
        >
          <span aria-hidden="true">✎</span> Éditer
        </RouterLink>
        <RouterLink
          :to="studioPath"
          class="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-transparent bg-[linear-gradient(135deg,#8b5cf6,#3b82f6)] px-3.5 py-1.5 text-[12.5px] font-bold text-white transition hover:brightness-105"
        >
          Studio <span aria-hidden="true">→</span>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
