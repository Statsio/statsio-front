<script setup lang="ts">
import DsHighlight from '@/components/ds/DsHighlight.vue'
import DsTypeGlyph from '@/components/ds/DsTypeGlyph.vue'
import { useContentBasePath } from '@/composables/useContentBasePath'
import { formatRelativePublished } from '@/lib/catalog-format'
import { publicContentPath } from '@/lib/content-display'
import { dossierTypeMeta } from '@/lib/dossiers-listing'
import type { DossierRecentContent } from '@/types/dossier'

/** Sommaire « Derniers ajouts » d'un dossier : type, titre (lien) et date d'ajout. */
defineProps<{ items: DossierRecentContent[]; query?: string }>()
const basePath = useContentBasePath()
</script>

<template>
  <div v-if="items.length" class="drec">
    <span class="drec__h">Derniers ajouts</span>
    <ul>
      <li v-for="c in items" :key="c.id">
        <span class="drec__gl" :style="{ color: dossierTypeMeta(c.type).color }">
          <DsTypeGlyph :kind="dossierTypeMeta(c.type).glyph" :size="14" />
        </span>
        <NuxtLink :to="publicContentPath(c.type, c.slug, basePath)" :title="c.title">
          <span class="sr-only">{{ dossierTypeMeta(c.type).label }} : </span>
          <DsHighlight :text="c.title" :query="query" />
        </NuxtLink>
        <span class="drec__when">{{ formatRelativePublished(c.updated_at) }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.drec {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.drec__h {
  color: var(--ds-muted);
  font: 500 10.5px/1 var(--ds-num);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.drec ul {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  border-top: 2px solid var(--ds-divide);
  list-style: none;
}
.drec li {
  display: grid;
  grid-template-columns: 16px minmax(0, 1fr) auto;
  gap: 9px;
  align-items: center;
  padding: var(--drec-pad, 7px) 0;
  border-bottom: 2px dashed var(--ds-divide);
  font-size: var(--drec-fs, 14px);
}
.drec li:last-child {
  border-bottom: 0;
}
.drec__gl {
  display: flex;
}
.drec a {
  overflow: hidden;
  color: var(--ds-text);
  font-weight: 600;
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.drec a:hover {
  color: var(--ds-link);
}
.drec a:focus-visible {
  outline: 2px solid var(--ds-focus);
  outline-offset: 2px;
}
.drec__when {
  color: var(--ds-faint);
  font: 400 12px var(--ds-num);
  white-space: nowrap;
}
</style>
