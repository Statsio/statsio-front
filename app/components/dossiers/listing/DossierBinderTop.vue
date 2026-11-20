<script setup lang="ts">
import { computed } from 'vue'
import DsTypeGlyph from '@/components/ds/DsTypeGlyph.vue'
import { CONTENT_UNIT, compositionParts, plural } from '@/lib/dossiers-listing'
import type { DossierCatalogItem } from '@/types/dossier'

/**
 * Haut du « classeur » : onglet à gauche (« Dossier · 12 contenus ») et
 * intercalaires colorés par type de contenu qui dépassent à droite (ils se
 * soulèvent au survol de la carte parente `.dos`). Purement visuel : la
 * composition est aussi donnée en texte dans le corps de la carte.
 */
const props = withDefaults(defineProps<{ item: DossierCatalogItem; lead?: string }>(), {
  lead: 'Dossier',
})
const parts = computed(() => compositionParts(props.item.counts))
</script>

<template>
  <div class="dtop">
    <span class="dtop__tab">
      <svg width="16" height="14" viewBox="0 0 16 14" aria-hidden="true">
        <path
          d="M1 2.2C1 1.5 1.5 1 2.2 1H6l1.6 1.8h6.2c.7 0 1.2.5 1.2 1.2v7.8c0 .7-.5 1.2-1.2 1.2H2.2c-.7 0-1.2-.5-1.2-1.2Z"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linejoin="round"
        />
        <path d="M1 5.2h14" stroke="currentColor" stroke-width="1.8" />
      </svg>
      {{ lead }} · <b>{{ plural(item.content_count, CONTENT_UNIT) }}</b>
    </span>
    <div v-if="parts.length" class="dtop__sheets" aria-hidden="true">
      <span
        v-for="p in parts"
        :key="p.value"
        class="dtop__sheet"
        :style="{ background: p.color, color: p.ink }"
      >
        <DsTypeGlyph :kind="p.glyph" :size="11" mono />{{ p.count }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.dtop {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 10px;
  height: 38px;
}
.dtop__tab {
  position: relative;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  margin-bottom: -2px;
  padding: 0 16px 0 12px;
  border: 2px solid var(--ds-ol);
  border-bottom: 0;
  border-radius: 9px 9px 0 0;
  background: var(--ds-surface);
  color: var(--ds-link);
  font: 500 11px/1 var(--ds-num);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  white-space: nowrap;
}
.dtop__tab b {
  color: var(--ds-text);
  font-weight: 500;
}
.dtop__sheets {
  position: relative;
  z-index: 0;
  display: flex;
  align-self: flex-end;
  gap: 4px;
  margin: 0 16px -10px 0;
}
.dtop__sheet {
  --y: 0px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 4px;
  width: 50px;
  height: 44px;
  padding-top: 6px;
  border: 2px solid var(--ds-ol);
  border-radius: 5px 5px 0 0;
  font: 500 11px/1 var(--ds-num);
  transform: translateY(var(--y));
  transition: transform 0.35s var(--ds-e-glisse);
}
.dtop__sheet:nth-child(2) {
  --y: 5px;
  transition-delay: 0.04s;
}
.dtop__sheet:nth-child(3) {
  --y: 10px;
  transition-delay: 0.08s;
}
:global(.dos:hover) .dtop__sheet,
:global(.dos:focus-within) .dtop__sheet {
  transform: translateY(calc(var(--y) - 7px));
}
</style>
