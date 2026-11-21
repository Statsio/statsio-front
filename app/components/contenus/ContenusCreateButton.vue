<script setup lang="ts">
import CreateContentMenu from '@/components/create/CreateContentMenu.vue'
import DsButton from '@/components/ds/DsButton.vue'
import StudioIcon from '@/components/studio/ui/StudioIcon.vue'
</script>

<template>
  <CreateContentMenu align="right">
    <template #default="{ open, toggle }">
      <DsButton :aria-expanded="open" aria-haspopup="menu" @click="toggle">
        <StudioIcon :name="open ? 'x' : 'plus'" :size="16" />
        Nouveau contenu
      </DsButton>
    </template>
  </CreateContentMenu>
</template>
