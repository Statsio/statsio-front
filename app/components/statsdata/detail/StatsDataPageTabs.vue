<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

type TabPage = { id: string; title: string; slug?: string; icon?: string }

/** Onglets de pages d'un StatsData (charte « Tranches ») ; `<select>` sous 1100px. */
const props = defineProps<{
  docSlug: string
  pages: TabPage[]
  activePageId?: string | null
  accentColor?: string | null
}>()

const router = useRouter()

function pageLink(page: { id: string; slug?: string }) {
  return `/statsdata/${props.docSlug}/${page.slug ?? page.id}`
}

const activeValue = computed(() => {
  const active = props.pages.find((p) => p.id === props.activePageId)
  return active ? pageLink(active) : ''
})

function onSelect(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  if (value && value !== router.currentRoute.value.path) void router.push(value)
}
</script>

<template>
  <select :value="activeValue" class="sdtabs__sel" aria-label="Page du StatsData" @change="onSelect">
    <option v-for="page in pages" :key="page.id" :value="pageLink(page)">
      {{ page.icon ? `${page.icon} ` : '' }}{{ page.title }}
    </option>
  </select>

  <nav class="sdtabs" aria-label="Pages du StatsData">
    <RouterLink
      v-for="page in pages"
      :key="page.id"
      :to="pageLink(page)"
      class="sdtabs__tab"
      :class="{ 'is-on': activePageId === page.id }"
      :aria-current="activePageId === page.id ? 'page' : undefined"
    >
      <span v-if="page.icon" aria-hidden="true">{{ page.icon }}</span>{{ page.title }}
    </RouterLink>
  </nav>
</template>

<style scoped>
.sdtabs {
  display: none;
  min-width: 0;
  flex-wrap: nowrap;
  gap: 4px;
  margin: 0 auto;
  overflow-x: auto;
  padding: 3px 5px 5px 3px;
}
.sdtabs__tab {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 2px solid transparent;
  border-radius: 3px;
  color: var(--ds-muted);
  font: 600 13.5px/1.2 var(--ds-ui);
  white-space: nowrap;
  text-decoration: none;
  transition: color 0.15s;
}
.sdtabs__tab:hover {
  color: var(--ds-text);
}
.sdtabs__tab.is-on {
  border-color: var(--ds-ol);
  background: var(--ds-surface);
  box-shadow: 2px 2px 0 var(--ds-sh);
  color: var(--ds-text);
}
.sdtabs__sel {
  min-width: 0;
  max-width: 260px;
  height: 36px;
  margin-left: auto;
  padding: 0 8px;
  border: 2px solid var(--ds-ol);
  border-radius: 3px;
  background: var(--ds-surface);
  color: var(--ds-text);
  font: 600 13.5px/1 var(--ds-ui);
}
@media (min-width: 1101px) {
  .sdtabs {
    display: flex;
  }
  .sdtabs__sel {
    display: none;
  }
}
@media (max-width: 620px) {
  .sdtabs__sel {
    flex: 1;
    max-width: none;
    margin-left: 0;
  }
}
</style>
