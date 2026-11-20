<script setup lang="ts">
import { RouterLink } from 'vue-router'
import AppNavIcon from '@/components/layout/AppNavIcon.vue'
import type { HeaderNavItem } from '@/components/layout/brands/header-nav.types'

defineProps<{ items: HeaderNavItem[] }>()

const emit = defineEmits<{ hover: [item: HeaderNavItem] }>()
</script>

<template>
  <nav class="ds-nav hidden items-center gap-1 lg:flex">
    <component
      :is="item.href.startsWith('/') ? RouterLink : 'a'"
      v-for="item in items"
      :key="item.label"
      :to="item.href.startsWith('/') ? item.href : undefined"
      :href="item.href.startsWith('/') ? undefined : item.href"
      class="ds-nav__link group inline-flex items-center gap-1.5 rounded-[3px] px-2.5 py-2"
      @mouseenter="emit('hover', item)"
    >
      <AppNavIcon :kind="item.icon" class="h-[16px] w-[16px] shrink-0" />
      <span>{{ item.label }}</span>
    </component>
  </nav>
</template>

<style scoped>
/* Nav Bold Outline : liens sobres, violet au survol, souligné épais quand actif. */
.ds-nav__link {
  position: relative;
  color: var(--ds-muted);
  font: 600 14.5px/1 var(--ds-ui);
  white-space: nowrap;
  transition: color 0.15s;
}
.ds-nav__link:hover {
  color: var(--ds-link);
}
.ds-nav__link.router-link-active {
  color: var(--ds-link);
}
.ds-nav__link.router-link-active::after {
  content: '';
  position: absolute;
  right: 10px;
  bottom: -2px;
  left: 10px;
  height: 2px;
  background: var(--ds-ol);
}
.ds-nav__link:focus-visible {
  outline: 2px solid var(--ds-focus);
  outline-offset: 2px;
}
</style>
