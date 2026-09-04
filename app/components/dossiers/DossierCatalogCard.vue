<script setup lang="ts">
import { computed } from 'vue'
import { catalogThemeStyle } from '@/lib/catalog-theme'
import { formatRelativePublished } from '@/lib/catalog-format'
import type { DossierCatalogItem } from '@/types/dossier'
import AppMediaImage from '@/components/ui/AppMediaImage.vue'

const props = defineProps<{
  item: DossierCatalogItem
  following?: boolean
}>()

const emit = defineEmits<{ follow: [] }>()

const style = computed(() => catalogThemeStyle(props.item.category?.slug))
const countLabel = computed(
  () => `${props.item.content_count} contenu${props.item.content_count === 1 ? '' : 's'}`,
)
</script>

<template>
  <NuxtLink
    :to="`/dossiers/${item.slug}`"
    class="u-card group flex flex-col overflow-hidden rounded-[18px] border-[1.5px] border-slate-950/[0.06] bg-white shadow-[0_1px_3px_rgba(20,20,30,0.06)] hover:-translate-y-0.5"
  >
    <div class="relative flex h-[130px] items-center justify-center">
      <AppMediaImage :src="item.image_url" :alt="item.name" class="u-card-media absolute inset-0" />

      <span
        v-if="item.category"
        class="absolute left-3 top-3 rounded-[5px] bg-white px-2 py-1 font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em]"
        :style="{ color: style.fg }"
      >
        {{ item.category.label }}
      </span>

      <button
        type="button"
        :title="following ? 'Ne plus suivre' : 'Suivre ce dossier'"
        :aria-pressed="following"
        class="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full text-xs transition"
        :class="following ? 'bg-primary text-white' : 'bg-white/90 text-slate-950/55 hover:bg-white'"
        @click.prevent="emit('follow')"
      >
        {{ following ? '✓' : '+' }}
      </button>
    </div>

    <div class="flex flex-1 flex-col p-[18px]">
      <p class="u-card-title text-[16.5px] font-extrabold leading-[1.3] tracking-[-0.01em] text-slate-950 text-pretty">
        {{ item.name }}
      </p>
      <p v-if="item.description" class="mt-2 line-clamp-3 text-[12.5px] leading-[1.55] text-slate-950/60">
        {{ item.description }}
      </p>
      <div class="flex-1" />
      <div class="mt-3.5 flex items-center gap-3 border-t border-slate-950/[0.08] pt-3">
        <span class="font-mono text-[11px] text-slate-950/55">{{ countLabel }}</span>
        <span class="h-3 w-px bg-slate-950/[0.12]" />
        <span class="font-mono text-[11px] text-slate-950/55">maj {{ formatRelativePublished(item.updated_at) }}</span>
      </div>
    </div>
  </NuxtLink>
</template>
