<script setup lang="ts">
import { computed } from 'vue'
import ArticleTile from '@/components/articles/listing/ArticleTile.vue'
import StatsDataTile from '@/components/statsdata/listing/StatsDataTile.vue'
import SurveyTile from '@/components/polls/listing/SurveyTile.vue'
import { publicContentPath } from '@/lib/content-display'
import { rubricBadgeOf } from '@/lib/listing-rubrics'
import { channelCategoryLabels } from '@/api/channels'
import { useContentBasePath } from '@/composables/useContentBasePath'
import type { CatalogItem } from '@/types/catalog'
import type { ContentType } from '@/types/content-creation'

const props = defineProps<{
  item: CatalogItem
  type: ContentType
  favorited: boolean
  query?: string
}>()
const emit = defineEmits<{ favorite: [] }>()

const basePath = useContentBasePath()
const to = computed(() => publicContentPath(props.type, props.item.slug, basePath.value))
const rubric = computed(() => rubricBadgeOf(props.item.category, [], channelCategoryLabels))
</script>

<template>
  <StatsDataTile
    v-if="type === 'statsdata'"
    :item="item"
    :to="to"
    :rubric="rubric"
    :favorited="favorited"
    :query="query"
    @favorite="emit('favorite')"
  />
  <SurveyTile
    v-else-if="type === 'survey'"
    :item="item"
    :to="to"
    :rubric="rubric"
    :favorited="favorited"
    :query="query"
    @favorite="emit('favorite')"
  />
  <ArticleTile
    v-else
    :item="item"
    :to="to"
    :rubric="rubric"
    :favorited="favorited"
    :query="query"
    @favorite="emit('favorite')"
  />
</template>
