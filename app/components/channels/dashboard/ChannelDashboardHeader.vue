<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue'
import CreateContentMenu from '@/components/create/CreateContentMenu.vue'
import { useChannelDashboard } from '@/composables/useChannelDashboard'

withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    /** Affiche les actions par défaut (page publique + nouveau contenu). */
    showActions?: boolean
  }>(),
  { subtitle: '', showActions: true },
)

const { channel } = useChannelDashboard()
</script>

<template>
  <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
    <div class="min-w-0">
      <h1 class="text-[25px] font-extrabold text-slate-950">{{ title }}</h1>
      <p v-if="subtitle" class="mt-1.5 max-w-[560px] text-[13.5px] text-pretty text-slate-500">
        {{ subtitle }}
      </p>
    </div>

    <div v-if="showActions || $slots.actions" class="flex shrink-0 items-center gap-2.5">
      <slot name="actions">
        <AppButton
          v-if="channel?.profile?.handle"
          as="router-link"
          :to="`/channels/@${channel.profile.handle}`"
          variant="secondary"
          size="md"
        >
          Voir la page publique
        </AppButton>
        <CreateContentMenu align="right">
          <template #default="{ toggle }">
            <AppButton variant="gradient" size="md" @click="toggle">Nouveau contenu</AppButton>
          </template>
        </CreateContentMenu>
      </slot>
    </div>
  </div>
</template>
