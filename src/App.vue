<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppBootstrapError from '@/components/layout/AppBootstrapError.vue'
import AppCreateFab from '@/components/layout/AppCreateFab.vue'
import AppNotificationStack from '@/components/layout/AppNotificationStack.vue'
import { bootstrapError } from '@/lib/app-bootstrap'

const route = useRoute()
const showCreateFab = computed(() => !route.meta.studio)

const retry = () => {
  window.location.reload()
}
</script>

<template>
  <AppBootstrapError v-if="bootstrapError" :error="bootstrapError" @retry="retry" />
  <template v-else>
    <RouterView />
    <AppCreateFab v-if="showCreateFab" />
  </template>
  <AppNotificationStack />
</template>
