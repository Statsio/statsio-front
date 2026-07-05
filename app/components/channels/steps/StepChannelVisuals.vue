<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'

const props = defineProps<{
  channelName: string
}>()

const logo = defineModel<File | null>('logo', { required: true })
const banner = defineModel<File | null>('banner', { required: true })
const primaryColor = defineModel<string>('primaryColor', { required: true })
const accentColor = defineModel<string>('accentColor', { required: true })

const logoPreview = ref<string | null>(null)
const bannerPreview = ref<string | null>(null)

const initials = computed(() =>
  props.channelName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || 'CH'
)

const onLogoChange = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (logoPreview.value) URL.revokeObjectURL(logoPreview.value)
  logo.value = file
  logoPreview.value = URL.createObjectURL(file)
}

const onBannerChange = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (bannerPreview.value) URL.revokeObjectURL(bannerPreview.value)
  banner.value = file
  bannerPreview.value = URL.createObjectURL(file)
}

onBeforeUnmount(() => {
  if (logoPreview.value) URL.revokeObjectURL(logoPreview.value)
  if (bannerPreview.value) URL.revokeObjectURL(bannerPreview.value)
})
</script>

<template>
  <div class="flex flex-col gap-6 py-2">
    <!-- Aperçu live de la carte chaîne -->
    <div class="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
      <div
        class="relative h-24 w-full"
        :style="`background:linear-gradient(135deg,${primaryColor}33,${accentColor}55)`"
      >
        <img v-if="bannerPreview" :src="bannerPreview" alt="" class="h-full w-full object-cover" />
      </div>
      <div class="px-5 pb-5">
        <div class="-mt-7 mb-2">
          <img
            v-if="logoPreview"
            :src="logoPreview"
            alt=""
            class="h-14 w-14 rounded-2xl object-cover ring-4 ring-white"
          />
          <div
            v-else
            class="flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-bold text-white ring-4 ring-white"
            :style="`background:${primaryColor}`"
          >
            {{ initials }}
          </div>
        </div>
        <p class="text-sm font-semibold text-slate-950">{{ channelName || 'Votre chaîne' }}</p>
        <p class="text-xs text-slate-400">Aperçu de votre carte de chaîne</p>
      </div>
    </div>

    <!-- Uploads -->
    <div class="grid gap-4 sm:grid-cols-2">
      <label class="group flex cursor-pointer flex-col items-center gap-3 rounded-[1.5rem] border-2 border-dashed border-slate-200 p-5 text-center transition hover:border-primary/40">
        <input type="file" accept="image/*" class="sr-only" @change="onLogoChange" />
        <div class="h-14 w-14 overflow-hidden rounded-2xl bg-slate-100">
          <img v-if="logoPreview" :src="logoPreview" alt="" class="h-full w-full object-cover" />
          <div v-else class="flex h-full w-full items-center justify-center text-slate-300">
            <svg class="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
        </div>
        <div>
          <p class="text-sm font-semibold text-slate-700">Logo</p>
          <p class="mt-0.5 text-xs text-slate-400">Format carré — 500×500px min.</p>
        </div>
      </label>

      <label class="group flex cursor-pointer flex-col items-center gap-3 rounded-[1.5rem] border-2 border-dashed border-slate-200 p-5 text-center transition hover:border-primary/40">
        <input type="file" accept="image/*" class="sr-only" @change="onBannerChange" />
        <div class="h-14 w-full overflow-hidden rounded-xl bg-slate-100">
          <img v-if="bannerPreview" :src="bannerPreview" alt="" class="h-full w-full object-cover" />
          <div v-else class="flex h-full w-full items-center justify-center text-slate-300">
            <svg class="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
        </div>
        <div>
          <p class="text-sm font-semibold text-slate-700">Bannière</p>
          <p class="mt-0.5 text-xs text-slate-400">Format large — 1920×400px min.</p>
        </div>
      </label>
    </div>

    <!-- Couleurs -->
    <div class="grid gap-4 sm:grid-cols-2">
      <label class="flex flex-col gap-2">
        <span class="text-sm font-semibold text-slate-700">Couleur principale</span>
        <div class="flex items-center gap-3 rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3">
          <input v-model="primaryColor" type="color" class="h-8 w-8 cursor-pointer rounded-lg border-0 bg-transparent p-0" />
          <span class="font-mono text-sm text-slate-600">{{ primaryColor }}</span>
        </div>
      </label>
      <label class="flex flex-col gap-2">
        <span class="text-sm font-semibold text-slate-700">Couleur d'accent</span>
        <div class="flex items-center gap-3 rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3">
          <input v-model="accentColor" type="color" class="h-8 w-8 cursor-pointer rounded-lg border-0 bg-transparent p-0" />
          <span class="font-mono text-sm text-slate-600">{{ accentColor }}</span>
        </div>
      </label>
    </div>
  </div>
</template>
