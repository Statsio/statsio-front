<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getNameInitials } from '@/lib/format'
import { resolveChannelColors } from '@/lib/channel-brand'
import type { ChannelCatalogItem } from '@/types/channel-catalog'

/**
 * Avatar Bold Outline d'une chaîne : logo, ou initiales sur la couleur de la chaîne.
 * Les indépendants sont ronds, les rédactions et institutions carrées.
 */
const props = withDefaults(
  defineProps<{
    item: Pick<
      ChannelCatalogItem,
      'id' | 'name' | 'kind' | 'logo_url' | 'custom_color_primary' | 'custom_color_secondary'
    >
    size?: number
  }>(),
  { size: 60 },
)

const failed = ref(false)
watch(
  () => props.item.logo_url,
  () => {
    failed.value = false
  },
)
const initials = computed(() => getNameInitials(props.item.name).toUpperCase())
const color = computed(
  () =>
    resolveChannelColors(
      String(props.item.id),
      props.item.custom_color_primary,
      props.item.custom_color_secondary,
    ).primary,
)
</script>

<template>
  <span
    class="chav"
    :class="{ 'chav--round': item.kind === 'independant' }"
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      fontSize: `${Math.round(size / 3)}px`,
      background: item.logo_url && !failed ? undefined : color,
    }"
    aria-hidden="true"
  >
    <img v-if="item.logo_url && !failed" :src="item.logo_url" alt="" @error="failed = true" />
    <template v-else>{{ initials }}</template>
  </span>
</template>

<style scoped>
.chav {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 2px solid var(--ds-ol);
  border-radius: 6px;
  background: var(--ds-surface);
  box-shadow: 3px 3px 0 var(--ds-sh);
  color: #fff;
  font-family: var(--ds-display);
  font-weight: 800;
  line-height: 1;
}
.chav--round {
  border-radius: 50%;
}
.chav img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
