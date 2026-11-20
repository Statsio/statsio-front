<script setup lang="ts">
import { ref, watch } from 'vue'
import type { CatalogPublisher } from '@/types/catalog'

/** Logo (ou initiales, si absent ou en erreur) de l'éditeur d'un article, cerclé du contour de la charte. */
const props = withDefaults(defineProps<{ publisher: CatalogPublisher; size?: number }>(), {
  size: 30,
})

const failed = ref(false)
watch(
  () => props.publisher.logo_url,
  () => {
    failed.value = false
  },
)
</script>

<template>
  <span class="art-mark" :style="{ width: `${size}px`, height: `${size}px` }" aria-hidden="true">
    <img
      v-if="publisher.logo_url && !failed"
      :src="publisher.logo_url"
      alt=""
      @error="failed = true"
    />
    <span v-else>{{ publisher.initials }}</span>
  </span>
</template>

<style scoped>
.art-mark {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 2px solid var(--ds-ol);
  border-radius: 50%;
  background: var(--ds-tint);
  color: var(--ds-link);
  font: 800 11px/1 var(--ds-ui);
}
.art-mark img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
