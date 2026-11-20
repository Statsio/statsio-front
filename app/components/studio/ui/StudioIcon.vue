<script setup lang="ts">
import { computed } from 'vue'

/**
 * Pictogrammes du Studio (charte « Tranches ») : trait 1.9, extrémités arrondies,
 * `currentColor`. Couvre les types de blocs (`BlockType`) et les actions de l'éditeur.
 * Un nom inconnu retombe sur « paragraphe ».
 */
const props = withDefaults(defineProps<{ name: string; size?: number }>(), { size: 18 })

const IC: Record<string, string> = {
  heading: '<path d="M6 5v14M14 5v14M6 12h8M18 10.5l2-1.5v10"/>',
  paragraph: '<path d="M4 6h16M4 10h16M4 14h16M4 18h10"/>',
  quote: '<path d="M10 7H6.5A1.5 1.5 0 0 0 5 8.5V12h5zM10 12c0 3-1.4 4.6-4 5.4M19 7h-3.5A1.5 1.5 0 0 0 14 8.5V12h5zM19 12c0 3-1.4 4.6-4 5.4"/>',
  callout: '<rect x="3.5" y="4.5" width="17" height="15" rx="1.5"/><path d="M12 8.5v5M12 16.5v.01"/>',
  retenir: '<path d="M4 8V4a4 4 0 0 1 4 4zM4 14.5v-4a4 4 0 0 1 4 4zM4 21v-4a4 4 0 0 1 4 4z" fill="currentColor" stroke="none"/><path d="M11 6.5h9M11 13h9M11 19.5h6"/>',
  image: '<rect x="3.5" y="5" width="17" height="14" rx="1.5"/><path d="M3.5 16l5-5 4 4 2.5-2.5 5 5"/><path d="M14.5 8.5h2v2"/>',
  video: '<rect x="3.5" y="5" width="17" height="14" rx="1.5"/><path d="M10 9.5v5l4.5-2.5z" fill="currentColor"/>',
  button: '<rect x="3" y="7" width="18" height="10" rx="2"/><path d="M8 12h8"/>',
  'link-card': '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  layout: '<rect x="3.5" y="4.5" width="17" height="15" rx="1.5"/><path d="M12 4.5v15"/>',
  'sd-embed': '<rect x="2.5" y="3.5" width="19" height="17" rx="1.5"/><path d="M12 12V7a5 5 0 0 1 4.3 7.5z" fill="currentColor" stroke="none"/><path d="M12 12l4.3 2.5A5 5 0 1 1 12 7"/>',
  bar: '<path d="M4.5 20v-8M9.5 20V5M14.5 20v-6M19.5 20V9" stroke-width="3" stroke-linecap="butt"/>',
  line: '<path d="M3 16.5l5-6 4 3 4-7 5 4"/><path d="M3 20.5h18"/>',
  pie: '<path d="M12 12V3.5a8.5 8.5 0 0 1 8.5 8.5z" fill="currentColor" stroke="none"/><path d="M12 12h8.5A8.5 8.5 0 1 1 12 3.5z"/>',
  table: '<rect x="3.5" y="4.5" width="17" height="15" rx="1.5"/><path d="M3.5 9.5h17M3.5 14.5h17M10 9.5v10"/>',
  kpi: '<path d="M4 19.5h16"/><path d="M5 15l4-4 3 3 6-7"/><path d="M14.5 7H18v3.5"/>',
  record: '<rect x="4" y="3.5" width="16" height="17" rx="1.5"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  related: '<rect x="2.5" y="8.5" width="8" height="7" rx="3.5"/><rect x="13.5" y="8.5" width="8" height="7" rx="3.5"/><path d="M10.5 12h3"/>',
  map: '<path d="M3.5 6.5l5-2 7 2.5 5-2v13l-5 2-7-2.5-5 2z"/><path d="M8.5 4.5v13M15.5 7v13"/>',
  search: '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/>',
  param: '<path d="M4 7h9M18 7h2M4 17h4M13 17h7"/><rect x="13" y="5" width="5" height="4" rx="1"/><rect x="8" y="15" width="5" height="4" rx="1"/>',
  'field-grid': '<rect x="3.5" y="4.5" width="7" height="6" rx="1"/><rect x="13.5" y="4.5" width="7" height="6" rx="1"/><rect x="3.5" y="13.5" width="7" height="6" rx="1"/><rect x="13.5" y="13.5" width="7" height="6" rx="1"/>',
  loop: '<path d="M17 3.5l3 3-3 3"/><path d="M20 6.5H8a4 4 0 0 0-4 4v1M7 20.5l-3-3 3-3"/><path d="M4 17.5h12a4 4 0 0 0 4-4v-1"/>',
  if: '<path d="M6 3.5v6a4 4 0 0 0 4 4h8M6 9.5v11"/><path d="M15 10.5l3 3-3 3"/>',
  choice: '<circle cx="12" cy="12" r="8.5"/><path d="M12 12V7a5 5 0 0 1 5 5z" fill="currentColor" stroke="none"/>',
  checkboxes: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 12.5l3 3 5-6.5"/>',
  dropdown: '<rect x="3.5" y="6.5" width="17" height="11" rx="1.5"/><path d="M14 11l2 2 2-2"/>',
  scale: '<path d="M3.5 12h17"/><rect x="11" y="8" width="5" height="8" rx="1.5"/><path d="M3.5 17.5v2M20.5 17.5v2"/>',
  rating: '<path d="M4 20V16a4 4 0 0 1 4 4zM10 20v-6a6 6 0 0 1 6 6z" fill="currentColor" stroke="none"/><path d="M16 20v-8a8 8 0 0 1 4 1"/>',
  number: '<rect x="3.5" y="6.5" width="17" height="11" rx="1.5"/><path d="M7 12h3M15.5 10.5v3M14 12h3"/>',
  'text-answer': '<rect x="3.5" y="5.5" width="17" height="13" rx="1.5"/><path d="M7 10h10M7 14h6"/>',
  up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  dup: '<rect x="8" y="8" width="12" height="12" rx="1.5"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>',
  trash: '<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/>',
  grip: '<path d="M5 8h14M5 12h14M5 16h14"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
  redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  pen: '<path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 7l3 3"/>',
  desktop: '<rect x="3" y="4.5" width="18" height="12" rx="1.5"/><path d="M9 20h6M12 16.5V20"/>',
  mobile: '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  blocks: '<rect x="3.5" y="3.5" width="7" height="7" rx="1"/><rect x="13.5" y="3.5" width="7" height="7" rx="1"/><rect x="3.5" y="13.5" width="7" height="7" rx="1"/><path d="M17 13.5v7M13.5 17h7"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
  filter: '<path d="M3.5 5h17l-6.5 8v6l-4-2v-4z"/>',
  db: '<ellipse cx="12" cy="6" rx="7.5" ry="2.5"/><path d="M4.5 6v12c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5V6M4.5 12c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5"/>',
  code: '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5"/>',
  sliders: '<path d="M4 6h16M4 12h16M4 18h16"/><rect x="7" y="4" width="4" height="4" rx="1" fill="var(--ds-surface)"/><rect x="13" y="10" width="4" height="4" rx="1" fill="var(--ds-surface)"/><rect x="5" y="16" width="4" height="4" rx="1" fill="var(--ds-surface)"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="1.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  refresh: '<path d="M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5"/>',
  id: '<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M7 15c.5-1.6 1.7-2.5 3-2.5s2.5.9 3 2.5M15 10h3M15 13h3"/><path d="M10 8.2a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6z"/>',
  media: '<rect x="3.5" y="5" width="17" height="14" rx="1.5"/><path d="M3.5 16l5-5 4 4 2.5-2.5 5 5"/><circle cx="15.5" cy="9" r="1.5"/>',
  more: '<circle cx="5.5" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="18.5" cy="12" r="1.2" fill="currentColor"/>',
  share: '<path d="M12 15V3.5M7.5 8 12 3.5 16.5 8"/><path d="M5 12.5v7h14v-7"/>',
  external: '<path d="M14 4.5h5.5V10M19.5 4.5 11 13"/><path d="M18 14v5.5H4.5V6H10"/>',
}

const svg = computed(() => IC[props.name] ?? IC.paragraph)
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -- tracés statiques du dictionnaire ci-dessus -->
  <svg
    class="studio-ic"
    viewBox="0 0 24 24"
    :width="size"
    :height="size"
    aria-hidden="true"
    focusable="false"
    v-html="svg"
  />
</template>

<style scoped>
.studio-ic {
  flex: none;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.9;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
