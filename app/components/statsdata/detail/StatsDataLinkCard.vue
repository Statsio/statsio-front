<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  slug: string
}>()

const isCopied = ref(false)
function copyLink() {
  navigator.clipboard.writeText(window.location.href).then(() => {
    isCopied.value = true
    setTimeout(() => { isCopied.value = false }, 2000)
  })
}
</script>

<template>
  <button
    type="button"
    class="w-full rounded-2xl border border-[#18181f]/[0.08] bg-white px-5 py-4 text-left transition-colors hover:border-[#18181f]/20"
    @click="copyLink"
  >
    <p class="mb-1.5 text-[11px] font-bold uppercase tracking-[0.04em] text-[#18181f]/45">Lien public</p>
    <p class="mono truncate text-xs text-[#18181f]/55">
      {{ isCopied ? 'Copié !' : `/statsdata/${slug}` }}
    </p>
  </button>
</template>
