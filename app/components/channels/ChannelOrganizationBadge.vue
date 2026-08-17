<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AppTooltip from '@/components/ui/AppTooltip.vue'
import type { ChannelOrganization } from '@/api/channels'

const props = withDefaults(defineProps<{ organization: ChannelOrganization; size?: 'sm' | 'md' }>(), { size: 'md' })

const router = useRouter()

const logoUrl = computed(() => props.organization.principal_channel?.profile?.logo_url ?? null)
const principalHandle = computed(() => props.organization.principal_channel?.profile?.handle ?? null)
const principalPath = computed(() =>
  principalHandle.value ? `/channels/${encodeURIComponent(principalHandle.value)}` : null,
)

// Le badge est souvent imbriqué dans un RouterLink (carte de chaîne) : on utilise un
// <button> + navigation programmatique plutôt qu'un lien, pour éviter une ancre imbriquée
// et rediriger vers la chaîne principale au lieu de suivre le lien parent.
function goToPrincipalChannel(event: MouseEvent) {
  if (!principalPath.value) return
  event.stopPropagation()
  event.preventDefault()
  router.push(principalPath.value).catch(() => {})
}
</script>

<template>
  <AppTooltip :text="`Membre de l'organisation ${organization.name}`">
    <component
      :is="principalPath ? 'button' : 'span'"
      :type="principalPath ? 'button' : undefined"
      class="flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-black/5"
      :class="[size === 'sm' ? 'h-4 w-4' : 'h-5 w-5', principalPath ? 'cursor-pointer hover:ring-primary/40' : '']"
      @click="goToPrincipalChannel"
    >
      <img v-if="logoUrl" :src="logoUrl" alt="" class="h-full w-full object-cover" />
      <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-full w-full p-[3px] text-slate-400">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3 21h18M5 21V7l7-4 7 4v14M9 9h1m-1 4h1m4-4h1m-1 4h1M9 21v-4a1 1 0 011-1h4a1 1 0 011 1v4" />
      </svg>
    </component>
  </AppTooltip>
</template>
