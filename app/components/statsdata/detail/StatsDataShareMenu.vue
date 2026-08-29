<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps<{
  shareUrl: string
  canWebShare: boolean
  targets: { key: string; label: string; href: string }[]
}>()

const emit = defineEmits<{ 'native-share': []; 'open-embed': [] }>()

const open = ref(false)
const copied = ref(false)
const root = ref<HTMLElement | null>(null)

function toggle() {
  if (props.canWebShare) {
    emit('native-share')
    return
  }
  open.value = !open.value
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(props.shareUrl)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch { /* ignore */ }
}

function onDocClick(e: MouseEvent) {
  if (root.value && !root.value.contains(e.target as Node)) open.value = false
}
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <div ref="root" class="relative">
    <button
      type="button"
      class="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-[10px] border-[1.5px] border-[#18181f]/15 bg-white px-[18px] py-3 text-[14px] font-bold text-[#18181f] transition-colors hover:border-[#18181f]/25"
      @click="toggle"
    >
      <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
      </svg>
      Partager
    </button>

    <div
      v-if="open"
      class="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-[#18181f]/10 bg-white py-1.5 shadow-lg"
    >
      <button type="button" class="flex w-full items-center gap-2.5 px-4 py-2 text-left text-[13px] font-medium text-[#18181f] hover:bg-[#18181f]/[0.04]" @click="copyLink">
        <span class="text-[#18181f]/45">{{ copied ? '✓' : '⧉' }}</span>
        {{ copied ? 'Lien copié !' : 'Copier le lien' }}
      </button>
      <a
        v-for="target in targets"
        :key="target.key"
        :href="target.href"
        target="_blank"
        rel="noopener nofollow"
        class="flex w-full items-center gap-2.5 px-4 py-2 text-left text-[13px] font-medium text-[#18181f] hover:bg-[#18181f]/[0.04]"
        @click="open = false"
      >
        <span class="text-[#18181f]/45">↗</span>
        {{ target.label }}
      </a>
      <div class="my-1 border-t border-[#18181f]/[0.07]" />
      <button type="button" class="flex w-full items-center gap-2.5 px-4 py-2 text-left text-[13px] font-medium text-[#18181f] hover:bg-[#18181f]/[0.04]" @click="open = false; emit('open-embed')">
        <span class="text-[#18181f]/45">&lt;/&gt;</span>
        Intégrer (iframe)
      </button>
    </div>
  </div>
</template>
