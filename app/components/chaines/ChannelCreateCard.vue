<script setup lang="ts">
import { ref } from 'vue'
import ChannelConsentModal from '@/components/chaines/ChannelConsentModal.vue'
import type { Channel } from '@/api/channels'

const CHANNEL_COLORS = ['#8b5cf6', '#3b82f6', '#166534', '#991b1b', '#f59e0b']
const DEFAULT_COLOR = CHANNEL_COLORS[0]!

const isOpen = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ created: [Channel] }>()

const name = ref('')
const color = ref(DEFAULT_COLOR)
const consentOpen = ref(false)

function close() {
  isOpen.value = false
  name.value = ''
  color.value = DEFAULT_COLOR
}

function submit() {
  if (!name.value.trim()) return
  consentOpen.value = true
}

function handleCreated(channel: Channel) {
  consentOpen.value = false
  close()
  emit('created', channel)
}
</script>

<template>
  <div
    v-if="!isOpen"
    class="flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-2.5 rounded-2xl border-[1.5px] border-dashed border-slate-300/70 bg-[#f7f6fb] transition hover:border-primary/40"
    @click="isOpen = true"
  >
    <div class="flex h-11 w-11 items-center justify-center rounded-xl border-[1.5px] border-slate-200 bg-white text-[22px] font-bold text-primary">
      +
    </div>
    <div class="text-[14.5px] font-bold text-slate-950">Créer une nouvelle chaîne</div>
    <p class="max-w-[220px] text-center text-[12.5px] text-slate-500">
      Publiez vos propres articles, datasets et sondages sous une identité dédiée.
    </p>
  </div>

  <div v-else class="card box-border min-h-[220px] p-[26px]">
    <div class="mb-4 text-[15px] font-bold text-slate-950">Nouvelle chaîne</div>

    <div class="mb-3.5">
      <div class="mb-[7px] text-xs font-semibold text-slate-500">Nom de la chaîne</div>
      <input
        v-model="name"
        type="text"
        placeholder="Ex : Sport & Data"
        class="w-full rounded-[10px] border-[1.5px] border-slate-200 px-3.5 py-2.5 text-[13.5px] text-slate-950 focus:border-primary/40 focus:outline-none"
        @keydown.enter="submit"
      />
    </div>

    <div class="mb-4">
      <div class="mb-2 text-xs font-semibold text-slate-500">Couleur</div>
      <div class="flex gap-2">
        <button
          v-for="c in CHANNEL_COLORS"
          :key="c"
          type="button"
          class="box-border h-7 w-7 rounded-lg"
          :style="{ background: c, border: `2px solid ${color === c ? '#18181f' : 'transparent'}` }"
          :aria-label="`Choisir la couleur ${c}`"
          @click="color = c"
        />
      </div>
    </div>

    <div class="flex gap-2.5">
      <button
        type="button"
        class="rounded-[10px] bg-slate-950 px-5 py-2.5 text-[13px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="!name.trim()"
        @click="submit"
      >
        Créer la chaîne
      </button>
      <button
        type="button"
        class="rounded-[10px] border-[1.5px] border-slate-200 bg-white px-5 py-2.5 text-[13px] font-bold text-slate-950"
        @click="close"
      >
        Annuler
      </button>
    </div>
  </div>

  <ChannelConsentModal v-model:open="consentOpen" :name="name" :color="color" @created="handleCreated" />
</template>
