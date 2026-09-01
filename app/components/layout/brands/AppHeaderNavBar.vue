<script setup lang="ts">
import { RouterLink } from 'vue-router'
import AppNavIcon from '@/components/layout/AppNavIcon.vue'
import type { HeaderNavItem } from '@/components/layout/brands/header-nav.types'

defineProps<{ items: HeaderNavItem[] }>()

const emit = defineEmits<{ hover: [item: HeaderNavItem] }>()
</script>

<template>
  <nav class="hidden items-center gap-0.5 lg:flex">
    <component
      :is="item.href.startsWith('/') ? RouterLink : 'a'"
      v-for="item in items"
      :key="item.label"
      :to="item.href.startsWith('/') ? item.href : undefined"
      :href="item.href.startsWith('/') ? undefined : item.href"
      class="group inline-flex items-center gap-1.5 rounded-[10px] px-2.5 py-2 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 [&.router-link-active]:bg-slate-100 [&.router-link-active]:text-slate-900"
      @mouseenter="emit('hover', item)"
    >
      <AppNavIcon :kind="item.icon" class="h-[16px] w-[16px] shrink-0" />
      <span>{{ item.label }}</span>
    </component>
  </nav>
</template>
