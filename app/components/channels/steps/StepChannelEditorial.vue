<script setup lang="ts">
import StepChannelCategories from '@/components/channels/steps/StepChannelCategories.vue'
import type { ChannelCategory } from '@/api/channels'

const description = defineModel<string>('description', { required: true })
const categories = defineModel<ChannelCategory[]>('categories', { required: true })
</script>

<template>
  <div class="flex flex-col gap-6 py-2">
    <label class="flex flex-col gap-2">
      <span class="text-sm font-semibold text-slate-700">
        Description <span class="text-rose-500">*</span>
      </span>
      <textarea
        v-model="description"
        required
        rows="4"
        class="resize-none rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
        placeholder="Décrivez votre ligne éditoriale, vos thématiques et ce qui rend votre chaîne unique..."
      ></textarea>
      <span class="text-xs text-slate-500">Présentez votre chaîne à vos futurs abonnés</span>
    </label>

    <div class="flex flex-col gap-2">
      <span class="text-sm font-semibold text-slate-700">
        Catégories <span class="text-rose-500">*</span>
      </span>
      <StepChannelCategories v-model="categories" />
      <span class="text-xs text-slate-500">Aidez les utilisateurs à découvrir votre chaîne</span>
    </div>
  </div>
</template>
