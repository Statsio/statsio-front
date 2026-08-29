<script setup lang="ts">
import DashboardShell from '@/components/layout/DashboardShell.vue'
import AccountSidebar from '@/components/user/AccountSidebar.vue'
import AccountTopbar from '@/components/user/AccountTopbar.vue'

usePageSeo({ robots: 'noindex,nofollow' })
</script>

<template>
  <DashboardShell>
    <template #sidebar="{ close }">
      <AccountSidebar @navigate="close" />
    </template>

    <template #topbar>
      <AccountTopbar />
    </template>

    <div class="mx-auto w-full max-w-[1180px] px-5 pb-16 pt-8 sm:px-8 md:px-10">
      <slot />
    </div>
  </DashboardShell>
</template>
