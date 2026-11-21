<script setup lang="ts">
import { computed } from 'vue'
import type { ContentType } from '@/types/content-creation'
import { contentPropertiesPath } from '@/lib/content-display'
import DsButton from '@/components/ds/DsButton.vue'

/**
 * Bandeau « propriétaire » affiché en tête des pages détail (StatsData / article /
 * sondage) quand `can_edit` est vrai : rappelle que le contenu est éditable et
 * offre deux raccourcis — « Éditer » vers le dashboard Propriétés du contenu et
 * « Studio » vers l'éditeur de blocs.
 *
 * Habillage charte « Tranches » (Bold Outline), aligné sur les sous-barres détail.
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
  <div class="cobar ds-scope">
    <div class="cobar__in ds-max">
      <span class="cobar__badge">Vous gérez ce contenu</span>
      <span v-if="isDraft" class="cobar__draft">Brouillon — non publié</span>

      <span class="cobar__spacer" />

      <div class="cobar__acts">
        <DsButton v-if="propertiesPath" variant="secondary" size="sm" :to="propertiesPath">
          Éditer
        </DsButton>
        <DsButton variant="primary" size="sm" :to="studioPath">Studio</DsButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cobar {
  border-bottom: 2px solid var(--ds-ol);
  background: var(--ds-tint);
}
.cobar__in {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  min-height: 52px;
  padding-block: 8px;
}
.cobar__badge {
  display: inline-flex;
  flex: none;
  align-items: center;
  padding: 5px 8px;
  border: 2px solid var(--ds-ol);
  border-radius: 3px;
  background: var(--ds-surface);
  color: var(--ds-ol);
  font: 500 10.5px/1 var(--ds-num);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.cobar__draft {
  display: inline-flex;
  flex: none;
  align-items: center;
  padding: 4px 8px;
  border: 2px solid var(--ds-warn-line);
  border-radius: 3px;
  background: var(--ds-warn-bg);
  color: var(--ds-warn-ink);
  font: 500 10.5px/1 var(--ds-num);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.cobar__spacer {
  flex: 1 1 12px;
}
.cobar__acts {
  display: flex;
  flex: none;
  align-items: center;
  gap: 8px;
}
@media print {
  .cobar {
    display: none;
  }
}
</style>
