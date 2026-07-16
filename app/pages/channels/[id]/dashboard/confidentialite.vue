<script setup lang="ts">
definePageMeta({ layout: 'channel-dashboard', middleware: ['auth'], ssr: false, title: 'Confidentialité de la chaîne', robots: 'noindex,nofollow' })
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import { updateChannelProfile } from '@/api/channels'
import { useChannelDashboard } from '@/composables/useChannelDashboard'

const route = useRoute()
const channelId = computed(() => Number(route.params.id))
const { channel, isLoading, loadError, ensureLoaded, reload } = useChannelDashboard()

const ageRestriction = ref(0)
const privacySaving = ref(false)
const privacySuccess = ref(false)

const ageOptions = [
  { value: 0, label: 'Tout public' },
  { value: 13, label: '13 ans et plus' },
  { value: 16, label: '16 ans et plus' },
  { value: 18, label: '18 ans et plus' },
]

const initForm = () => {
  if (!channel.value) return
  ageRestriction.value = channel.value.profile.age_restriction ?? 0
}

onMounted(async () => {
  await ensureLoaded(channelId.value)
  initForm()
})

watch(channel, initForm)

const savePrivacy = async () => {
  if (!channel.value) return
  privacySaving.value = true
  privacySuccess.value = false
  try {
    await updateChannelProfile(channelId.value, { age_restriction: Number(ageRestriction.value) })
    await reload()
    privacySuccess.value = true
    setTimeout(() => privacySuccess.value = false, 3000)
  } catch {}
  finally { privacySaving.value = false }
}
</script>

<template>
  <div class="mx-auto flex max-w-4xl flex-col gap-6">

    <template v-if="isLoading">
      <div class="h-10 w-64 animate-pulse rounded-2xl bg-slate-200" />
      <div class="h-72 animate-pulse rounded-[2rem] bg-slate-100" />
    </template>

    <p v-else-if="loadError" class="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
      {{ loadError }}
    </p>

    <template v-else-if="channel">
      <div>
        <p class="eyebrow text-primary">Confidentialité</p>
        <h1 class="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950">Confidentialité</h1>
        <p class="mt-2 text-slate-500">Contrôlez qui peut accéder aux contenus de votre chaîne.</p>
      </div>

      <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
        <p class="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Restriction d'âge</p>
        <h2 class="mt-2 text-2xl font-semibold text-slate-950">Public cible</h2>
        <div class="mt-4 flex flex-col gap-3">
          <label
            v-for="opt in ageOptions"
            :key="opt.value"
            class="flex cursor-pointer items-center gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-primary/30"
            :class="ageRestriction === opt.value ? 'border-primary/40 bg-primary/5' : ''"
          >
            <input v-model="ageRestriction" type="radio" name="age_restriction" :value="opt.value" class="accent-primary" />
            <span class="text-sm font-semibold text-slate-700">{{ opt.label }}</span>
          </label>
        </div>
        <div class="mt-4 flex items-center gap-3">
          <AppButton variant="primary" size="md" :disabled="privacySaving" @click="savePrivacy">
            {{ privacySaving ? 'Enregistrement...' : 'Enregistrer' }}
          </AppButton>
          <span v-if="privacySuccess" class="text-sm font-semibold text-emerald-600">✓ Sauvegardé</span>
        </div>
      </div>
    </template>

  </div>
</template>
