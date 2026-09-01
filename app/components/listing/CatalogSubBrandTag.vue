<script setup lang="ts">
import { computed } from 'vue'
import { resolveContentSubBrand, subBrandContentPath } from '@/lib/content-subbrand'
import type { ContentType } from '@/types/content-creation'

const props = defineProps<{
  categories: string[] | null | undefined
  /** Type de contenu de la carte, pour cibler la bonne liste côté sous-marque. */
  contentType: ContentType
}>()

const brand = computed(() => resolveContentSubBrand(props.categories))
const to = computed(() => (brand.value ? subBrandContentPath(brand.value, props.contentType) : ''))
</script>

<template>
  <NuxtLink
    v-if="brand"
    :to="to"
    class="mb-[7px] flex w-fit items-center gap-1.5 text-[11px] font-bold text-slate-500 transition hover:text-primary"
    @click.stop
  >
    <img :src="brand.logo" :alt="brand.name" class="block h-3.5 w-3.5 rounded-[3px]" />
    <span>Publié sur <span class="text-slate-950">{{ brand.name }}</span></span>
  </NuxtLink>
</template>
