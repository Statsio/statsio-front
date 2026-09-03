<script setup lang="ts">
import type { CatalogItem } from '@/types/catalog'
import type { ContentCardMode, ContentManageMeta } from '@/types/content-card'
import ContentCard from '@/components/content/ContentCard.vue'

/** Sucre syntaxique : `<ContentCard format="row">`. */
withDefaults(
  defineProps<{
    item: CatalogItem
    mode?: ContentCardMode
    favorited?: boolean
    manage?: ContentManageMeta
    feature?: boolean
    basePath?: string
  }>(),
  { mode: 'public', favorited: false, feature: false },
)

const emit = defineEmits<{
  favorite: []
  edit: []
  remove: [string]
}>()
</script>

<template>
  <ContentCard
    :item="item"
    format="row"
    :mode="mode"
    :favorited="favorited"
    :manage="manage"
    :feature="feature"
    :base-path="basePath"
    @favorite="emit('favorite')"
    @edit="emit('edit')"
    @remove="emit('remove', $event)"
  >
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </ContentCard>
</template>
