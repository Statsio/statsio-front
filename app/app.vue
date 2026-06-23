<script setup lang="ts">
import { computed } from 'vue'
import { useBootstrapError } from '@/lib/app-bootstrap'
import { useFavicon } from '@/composables/useFavicon'

const bootstrapError = useBootstrapError()
const showCreateFab = computed(() => !useRoute().meta.studio)

useFavicon()

const retry = () => {
  window.location.reload()
}
</script>

<template>
  <AppBootstrapError v-if="bootstrapError" :error="bootstrapError" @retry="retry" />
  <template v-else>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <AppCreateFab v-if="showCreateFab" />
  </template>
  <AppNotificationStack />
</template>
