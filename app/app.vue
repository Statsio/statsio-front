<script setup lang="ts">
import { computed } from 'vue'
import { useBootstrapError } from '@/lib/app-bootstrap'
import { useFavicon } from '@/composables/useFavicon'

const bootstrapError = useBootstrapError()
const showCreateFab = computed(() => {
  const path = useRoute().path
  return !['/login', '/register', '/forgot-password', '/verify-email', '/studio', '/tvstats/studio'].some(p => path.startsWith(p))
})

useFavicon()

const retry = () => {
  window.location.reload()
}
</script>

<template>
  <AppLoadingBar />
  <ComingSoonGate>
    <StagingGate>
      <AppBootstrapError v-if="bootstrapError" :error="bootstrapError" @retry="retry" />
      <template v-else>
        <NuxtLayout>
          <NuxtPage />
        </NuxtLayout>
        <AppCreateFab v-if="showCreateFab" />
      </template>
      <AppNotificationStack />
    </StagingGate>
  </ComingSoonGate>
  <CookieBanner />
</template>
