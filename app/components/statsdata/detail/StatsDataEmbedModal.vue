<script setup lang="ts">
import { ref } from 'vue'
import DsButton from '@/components/ds/DsButton.vue'
import DsLabel from '@/components/ds/DsLabel.vue'
import StudioModal from '@/components/studio/ui/StudioModal.vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    snippet: string
    previewUrl: string
    title?: string
    previewHeight?: number
  }>(),
  {
    title: 'Intégrer cette StatsData',
    previewHeight: 320,
  },
)

const emit = defineEmits<{ 'update:open': [boolean] }>()

const copied = ref(false)

async function copy() {
  try {
    await navigator.clipboard.writeText(props.snippet)
    copied.value = true
    window.setTimeout(() => { copied.value = false }, 2000)
  } catch {
    copied.value = false
  }
}

function close() {
  emit('update:open', false)
}
</script>

<template>
  <StudioModal
    v-if="open"
    :title="title"
    subtitle="Collez ce code dans votre page ou votre CMS. Le contenu reste à jour automatiquement."
    :width="640"
    @close="close"
  >
    <div class="flex flex-col gap-5">
      <div>
        <DsLabel class="mb-2">Code d'intégration</DsLabel>
        <textarea
          :value="snippet"
          readonly
          rows="4"
          class="w-full resize-none rounded-[4px] border-2 border-[var(--ds-divide)] bg-[var(--ds-tint)] p-3 text-[12.5px] text-[var(--ds-text)] outline-none focus:border-[var(--ds-ol)] focus:shadow-[2px_2px_0_var(--ds-sh)]"
          style="font-family: var(--ds-num)"
          @focus="($event.target as HTMLTextAreaElement).select()"
        />
      </div>

      <div>
        <DsLabel class="mb-2">Aperçu</DsLabel>
        <iframe
          :src="previewUrl"
          class="w-full rounded-[4px] border-2 border-[var(--ds-ol)] bg-[var(--ds-surface)] shadow-[3px_3px_0_var(--ds-sh)]"
          :style="{ height: `${previewHeight}px` }"
          loading="lazy"
          title="Aperçu de l'intégration"
        />
      </div>
    </div>

    <template #footer>
      <span />
      <DsButton @click="copy">{{ copied ? 'Copié' : 'Copier le code' }}</DsButton>
    </template>
  </StudioModal>
</template>
