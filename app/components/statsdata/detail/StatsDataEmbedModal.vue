<script setup lang="ts">
import { ref } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'

const props = defineProps<{
  open: boolean
  snippet: string
  previewUrl: string
}>()

const emit = defineEmits<{ 'update:open': [boolean] }>()

const copied = ref(false)
function copy() {
  navigator.clipboard.writeText(props.snippet).then(() => {
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  })
}
</script>

<template>
  <AppModal :open="open" title="Intégrer cette StatsData" size="md" @update:open="emit('update:open', $event)">
    <div class="flex flex-col gap-4">
      <p class="text-sm text-slate-500">
        Collez ce code dans votre page ou votre CMS. Le contenu reste à jour automatiquement.
      </p>

      <div>
        <label class="mb-2 block text-xs font-semibold uppercase tracking-[0.06em] text-slate-400">Code d'intégration</label>
        <textarea
          :value="snippet"
          readonly
          rows="4"
          class="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-600 outline-none"
          @focus="($event.target as HTMLTextAreaElement).select()"
        />
      </div>

      <div class="flex justify-end">
        <AppButton variant="primary" size="sm" @click="copy">{{ copied ? 'Copié !' : 'Copier le code' }}</AppButton>
      </div>

      <div>
        <label class="mb-2 block text-xs font-semibold uppercase tracking-[0.06em] text-slate-400">Aperçu</label>
        <iframe
          :src="previewUrl"
          class="h-[320px] w-full rounded-xl border border-slate-200"
          loading="lazy"
          title="Aperçu de l'intégration"
        />
      </div>
    </div>
  </AppModal>
</template>
