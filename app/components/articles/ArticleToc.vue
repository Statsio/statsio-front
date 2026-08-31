<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  entries: { id: string; label: string }[]
  linked: { id: string; title: string }[]
}>()

const activeId = ref<string | null>(null)
let observer: IntersectionObserver | null = null

function observe() {
  observer?.disconnect()
  if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined' || !props.entries.length) return
  observer = new IntersectionObserver(
    (records) => {
      const visible = records
        .filter((r) => r.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
      if (visible) activeId.value = visible.target.id
    },
    { rootMargin: '-20% 0px -70% 0px', threshold: 0 },
  )
  for (const e of props.entries) {
    const el = document.getElementById(e.id)
    if (el) observer.observe(el)
  }
}

onMounted(() => setTimeout(observe, 50))
watch(() => props.entries, () => setTimeout(observe, 50), { deep: true })
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <nav v-if="entries.length >= 2 || linked.length" class="hidden lg:block">
    <template v-if="entries.length >= 2">
      <p class="mb-3 text-[9.5px] font-extrabold uppercase tracking-[0.09em] text-[var(--studio-faint)]">Sommaire</p>
      <div class="flex flex-col gap-px">
        <a
          v-for="(e, i) in entries"
          :key="e.id"
          :href="`#${e.id}`"
          class="flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[12.5px] font-semibold transition-colors"
          :class="activeId === e.id
            ? 'bg-[var(--studio-tag)] text-[var(--studio-tag-ink)]'
            : 'text-[var(--studio-muted)] hover:bg-white hover:text-[var(--studio-ink)]'"
        >
          <span class="mono shrink-0 text-[9.5px]" :class="activeId === e.id ? 'text-[var(--studio-tag-ink)]/70' : 'text-[var(--studio-faint)]'">
            {{ String(i + 1).padStart(2, '0') }}
          </span>
          <span class="truncate">{{ e.label }}</span>
        </a>
      </div>
    </template>

    <div
      v-if="linked.length"
      class="mt-[18px] rounded-xl border-[1.5px] border-dashed border-[var(--studio-line-strong)] px-3 py-[13px]"
    >
      <p class="mb-1.5 text-[10px] font-extrabold uppercase tracking-[0.05em] text-[var(--studio-faint)]">Statsdata liés</p>
      <a
        v-for="l in linked"
        :key="l.id"
        :href="`#${l.id}`"
        class="mt-[5px] block truncate text-[12px] font-semibold text-[var(--color-primary)] hover:text-[#3b82f6]"
      >▤ {{ l.title }}</a>
    </div>
  </nav>
</template>
