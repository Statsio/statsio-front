<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import DsLabel from '@/components/ds/DsLabel.vue'
import DsTypeGlyph from '@/components/ds/DsTypeGlyph.vue'
import { sectorPath } from '@/lib/ds/pie'

export interface ArticleTocEntry {
  id: string
  label: string
  /** 2 = titre de section, 3 = sous-titre. */
  level?: number
}

export interface ArticleLinkedDoc {
  slug: string
  title: string
  href: string
  blocks: { id: string; label: string }[]
}

const props = defineProps<{
  entries: ArticleTocEntry[]
  linked: ArticleLinkedDoc[]
}>()

const activeId = ref<string | null>(null)
let observer: IntersectionObserver | null = null

const heads = () => props.entries.filter((e) => (e.level ?? 2) < 3)

function shareOf(entry: ArticleTocEntry) {
  const list = heads()
  const i = list.findIndex((e) => e.id === entry.id)
  if (i < 0 || !list.length) return 0
  return (i + 1) / list.length
}

const piePath = (share: number) => sectorPath(10, 10, 8.5, -90, -90 + 360 * Math.min(1, share))

function observe() {
  observer?.disconnect()
  if (
    typeof window === 'undefined' ||
    typeof IntersectionObserver === 'undefined' ||
    !props.entries.length
  )
    return
  observer = new IntersectionObserver(
    (records) => {
      const visible = records
        .filter((r) => r.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
      if (visible) activeId.value = visible.target.id
    },
    { rootMargin: '-30% 0px -60% 0px', threshold: 0 },
  )
  for (const e of props.entries) {
    const el = document.getElementById(e.id)
    if (el) observer.observe(el)
  }
}

function goTo(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  if (typeof history !== 'undefined') history.replaceState(null, '', `#${id}`)
  activeId.value = id
}

onMounted(() => setTimeout(observe, 50))
watch(
  () => props.entries,
  () => setTimeout(observe, 50),
  { deep: true },
)
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div v-if="entries.length >= 2 || linked.length" class="arttoc">
    <nav v-if="entries.length >= 2" aria-label="Sommaire">
      <DsLabel as="p" class="arttoc__title">Sommaire</DsLabel>
      <div class="arttoc__list">
        <a
          v-for="(e, i) in entries"
          :key="e.id"
          :href="`#${e.id}`"
          class="arttoc__a"
          :class="{ 'is-on': activeId === e.id, 'is-sub': (e.level ?? 2) >= 3 }"
          :aria-current="activeId === e.id ? 'location' : undefined"
          @click.prevent="goTo(e.id)"
        >
          <svg
            v-if="(e.level ?? 2) < 3"
            viewBox="0 0 20 20"
            width="16"
            height="16"
            aria-hidden="true"
            class="arttoc__pie"
          >
            <circle cx="10" cy="10" r="8.5" />
            <path :d="piePath(shareOf(e))" />
          </svg>
          <span class="sr-only">{{ String(i + 1).padStart(2, '0') }}</span>
          <span class="min-w-0">{{ e.label }}</span>
        </a>
      </div>
    </nav>

    <section v-for="doc in linked" :key="doc.slug" class="arttoc__doc">
      <DsLabel as="p">Données de l'article</DsLabel>
      <div class="arttoc__doc-h">
        <span class="arttoc__kind"><DsTypeGlyph kind="statsdata" :size="12" />StatsData lié</span>
        <b>{{ doc.title }}</b>
      </div>
      <ul v-if="doc.blocks.length" class="arttoc__uses">
        <li v-for="b in doc.blocks" :key="b.id">
          <a :href="`#${b.id}`" @click.prevent="goTo(b.id)">
            <span class="arttoc__wedge" aria-hidden="true" />
            {{ b.label }}
          </a>
        </li>
      </ul>
      <RouterLink :to="doc.href" class="arttoc__open">Ouvrir le StatsData →</RouterLink>
    </section>
  </div>
</template>

<style scoped>
.arttoc {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.arttoc__title {
  margin-bottom: 8px;
}
.arttoc__list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.arttoc__a {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border: 2px solid transparent;
  border-radius: 3px;
  color: var(--ds-muted);
  font-size: 14px;
  line-height: 1.35;
  text-decoration: none;
}
.arttoc__a:hover {
  color: var(--ds-text);
}
.arttoc__a.is-on {
  border-color: var(--ds-ol);
  background: var(--ds-surface);
  color: var(--ds-text);
  font-weight: 700;
}
.arttoc__a.is-sub {
  padding-left: 34px;
  font-size: 13px;
}
.arttoc__pie {
  flex: none;
}
.arttoc__pie circle {
  fill: none;
  stroke: var(--ds-ol);
  stroke-width: 1.5;
}
.arttoc__pie path {
  fill: var(--ds-violet-500);
}
.arttoc__doc {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border: 2px solid var(--ds-ol);
  border-radius: 6px;
  background: var(--ds-surface);
  box-shadow: 5px 5px 0 var(--ds-sh);
}
.arttoc__doc-h {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--ds-line);
}
.arttoc__doc-h b {
  font-size: 15px;
  line-height: 1.3;
}
.arttoc__kind {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--ds-ol);
  font: 500 11px/1 var(--ds-num);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.arttoc__uses {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 13.5px;
}
.arttoc__uses a {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--ds-muted);
  text-decoration: none;
}
.arttoc__uses a:hover {
  color: var(--ds-text);
}
.arttoc__wedge {
  display: inline-block;
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: 100% 0 0 0;
  background: var(--ds-violet-500);
}
.arttoc__open {
  color: var(--ds-link);
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
}
.arttoc__open:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>
