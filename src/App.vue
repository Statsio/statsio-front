<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppBootstrapError from '@/components/layout/AppBootstrapError.vue'
import AppCreateFab from '@/components/layout/AppCreateFab.vue'
import { bootstrapError } from '@/lib/app-bootstrap'

const retry = () => {
  window.location.reload()
}
</script>

<template>
  <AppBootstrapError v-if="bootstrapError" :error="bootstrapError" @retry="retry" />
  <template v-else>
    <RouterView />
    <AppCreateFab />
  </template>
</template>
