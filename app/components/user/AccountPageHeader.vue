<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue'
import CreateContentMenu from '@/components/create/CreateContentMenu.vue'

withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    /** Affiche les actions par défaut (profil public + nouveau contenu). */
    showActions?: boolean
  }>(),
  { subtitle: '', showActions: true },
)
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
        <AppButton as="router-link" to="/user/chaines" variant="secondary" size="md">
          Voir mon profil public
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
