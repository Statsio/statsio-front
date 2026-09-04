<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

type Dossier = { slug: string; name: string }

const props = defineProps<{ dossiers?: (Dossier | null | undefined)[] | null }>()

const list = computed(() => (props.dossiers ?? []).filter((d): d is Dossier => Boolean(d?.slug && d?.name)))
</script>

<template>
  <RouterLink
    v-for="dossier in list"
    :key="dossier.slug"
    :to="`/dossiers/${dossier.slug}`"
    :title="`Dossier : ${dossier.name}`"
    class="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/[0.06] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-primary)] transition hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-primary)]/10"
  >
    <span aria-hidden="true">📁</span>
    <span class="min-w-0 truncate">{{ dossier.name }}</span>
  </RouterLink>
</template>
