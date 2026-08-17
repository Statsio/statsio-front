<script setup lang="ts">
import ChannelVerifiedBadge from '@/components/channels/ChannelVerifiedBadge.vue'
import ChannelOrganizationBadge from '@/components/channels/ChannelOrganizationBadge.vue'
import type { ChannelOrganization } from '@/api/channels'

withDefaults(
  defineProps<{ slugs: readonly string[]; organization?: ChannelOrganization | null; size?: 'sm' | 'md' }>(),
  { slugs: () => [], organization: null, size: 'md' },
)
</script>

<template>
  <span v-if="slugs.length || organization" class="inline-flex shrink-0 items-center gap-1">
    <ChannelVerifiedBadge v-if="slugs.includes('verified')" :size="size" />
    <ChannelOrganizationBadge v-if="organization" :organization="organization" :size="size" />
  </span>
</template>
