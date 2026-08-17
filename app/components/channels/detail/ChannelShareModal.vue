<script setup lang="ts">
import { computed, ref } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'

const props = defineProps<{
  open: boolean
  channelName: string
}>()

const emit = defineEmits<{ 'update:open': [boolean] }>()

const shareUrl = computed(() => (typeof window !== 'undefined' ? window.location.href : ''))
const shareText = computed(() => `Découvre la chaîne ${props.channelName} sur Statsio`)

const copiedKey = ref<'link' | 'discord' | null>(null)
function markCopied(key: 'link' | 'discord') {
  copiedKey.value = key
  setTimeout(() => {
    if (copiedKey.value === key) copiedKey.value = null
  }, 2000)
}

function copyLink() {
  navigator.clipboard.writeText(shareUrl.value).then(() => markCopied('link'))
}

function copyForDiscord() {
  navigator.clipboard.writeText(shareUrl.value).then(() => markCopied('discord'))
}

const shareLinks = computed(() => [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    href: `https://wa.me/?text=${encodeURIComponent(`${shareText.value} ${shareUrl.value}`)}`,
    bg: '#25D366',
  },
  {
    id: 'sms',
    label: 'Message',
    href: `sms:?&body=${encodeURIComponent(`${shareText.value} ${shareUrl.value}`)}`,
    bg: '#0ea5e9',
  },
  {
    id: 'email',
    label: 'E-mail',
    href: `mailto:?subject=${encodeURIComponent(shareText.value)}&body=${encodeURIComponent(shareUrl.value)}`,
    bg: '#64748b',
  },
])

const canNativeShare = computed(() => typeof navigator !== 'undefined' && !!navigator.share)
async function nativeShare() {
  try {
    await navigator.share({ title: props.channelName, text: shareText.value, url: shareUrl.value })
  } catch {
    // L'utilisateur a annulé le partage natif — rien à faire.
  }
}

function close() {
  emit('update:open', false)
}

function selectInputContent(event: FocusEvent) {
  ;(event.target as HTMLInputElement).select()
}
</script>

<template>
  <AppModal :open="open" title="Partager la chaîne" size="sm" @update:open="close">
    <div class="flex flex-col gap-6">
      <div class="grid grid-cols-4 gap-2">
        <a
          v-for="link in shareLinks"
          :key="link.id"
          :href="link.href"
          target="_blank"
          rel="noopener noreferrer"
          class="flex flex-col items-center gap-2 rounded-2xl p-2.5 text-center transition hover:bg-slate-50"
        >
          <span class="flex h-12 w-12 items-center justify-center rounded-full text-white" :style="{ background: link.bg }">
            <svg v-if="link.id === 'whatsapp'" viewBox="0 0 24 24" fill="currentColor" class="h-6 w-6" aria-hidden="true">
              <path
                d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.99c-.003 5.451-4.437 9.885-9.885 9.888m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413"
              />
            </svg>
            <svg v-else-if="link.id === 'sms'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-5 w-5" aria-hidden="true">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.556-4.03 8.25-9 8.25a9.76 9.76 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
              />
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-5 w-5" aria-hidden="true">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M2.25 6.75c0-.621.504-1.125 1.125-1.125h17.25c.621 0 1.125.504 1.125 1.125v10.5c0 .621-.504 1.125-1.125 1.125H3.375A1.125 1.125 0 012.25 17.25V6.75z"
              />
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 7l9 6 9-6" />
            </svg>
          </span>
          <span class="text-xs font-semibold text-slate-600">{{ link.label }}</span>
        </a>

        <button
          type="button"
          class="flex flex-col items-center gap-2 rounded-2xl p-2.5 text-center transition hover:bg-slate-50"
          @click="copyForDiscord"
        >
          <span class="flex h-12 w-12 items-center justify-center rounded-full text-white" style="background: #5865f2">
            <svg v-if="copiedKey !== 'discord'" viewBox="0 0 24 24" fill="currentColor" class="h-6 w-6" aria-hidden="true">
              <path
                d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.522 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"
              />
            </svg>
            <svg v-else viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5" aria-hidden="true">
              <path
                fill-rule="evenodd"
                d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4L8 11.6l6.8-6.8a1 1 0 0 1 1.4 0z"
                clip-rule="evenodd"
              />
            </svg>
          </span>
          <span class="text-xs font-semibold text-slate-600">{{ copiedKey === 'discord' ? 'Copié !' : 'Discord' }}</span>
        </button>
      </div>

      <button
        v-if="canNativeShare"
        type="button"
        class="flex items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        @click="nativeShare"
      >
        Plus d'options de partage
      </button>

      <div>
        <label class="mb-2 block text-xs font-semibold uppercase tracking-[0.06em] text-slate-400">Lien de la chaîne</label>
        <div class="flex items-center gap-2 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-3 py-2.5">
          <input
            :value="shareUrl"
            type="text"
            readonly
            class="min-w-0 flex-1 border-none bg-transparent text-sm text-slate-600 outline-none"
            @focus="selectInputContent"
          />
          <AppButton variant="secondary" size="sm" @click="copyLink">
            {{ copiedKey === 'link' ? 'Copié !' : 'Copier' }}
          </AppButton>
        </div>
      </div>
    </div>
  </AppModal>
</template>
