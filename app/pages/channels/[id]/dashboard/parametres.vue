<script setup lang="ts">
definePageMeta({ layout: 'channel-dashboard', middleware: ['auth'], ssr: false, title: 'Paramètres de la chaîne', robots: 'noindex,nofollow' })
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import { updateChannelProfile, deleteChannel } from '@/api/channels'
import { useChannelDashboard } from '@/composables/useChannelDashboard'

const route = useRoute()
const router = useRouter()
const channelId = computed(() => Number(route.params.id))
const { channel, isLoading, loadError, ensureLoaded, reload } = useChannelDashboard()

const colorPrimary = ref('#8b5cf6')
const colorSecondary = ref('#3b82f6')
const colorSaving = ref(false)
const colorSuccess = ref(false)

const deleteConfirm = ref('')
const deleteLoading = ref(false)

const inputClass = 'rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20'

const initForm = () => {
  if (!channel.value) return
  colorPrimary.value = channel.value.profile.custom_color_primary ?? '#8b5cf6'
  colorSecondary.value = channel.value.profile.custom_color_secondary ?? '#3b82f6'
}

onMounted(async () => {
  await ensureLoaded(channelId.value)
  initForm()
})

watch(channel, initForm)

const saveColors = async () => {
  if (!channel.value) return
  colorSaving.value = true
  colorSuccess.value = false
  try {
    await updateChannelProfile(channelId.value, {
      custom_color_primary: colorPrimary.value,
      custom_color_secondary: colorSecondary.value,
    })
    await reload()
    colorSuccess.value = true
    setTimeout(() => colorSuccess.value = false, 3000)
  } catch {}
  finally { colorSaving.value = false }
}

const handleDelete = async () => {
  if (deleteConfirm.value !== channel.value?.profile.name) return
  deleteLoading.value = true
  try {
    await deleteChannel(channelId.value)
    router.push('/mes-chaines')
  } catch {}
  finally { deleteLoading.value = false }
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
        <p class="eyebrow text-primary">Paramètres</p>
        <h1 class="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950">Paramètres</h1>
        <p class="mt-2 text-slate-500">Apparence et gestion avancée de votre chaîne.</p>
      </div>

      <!-- Couleurs -->
      <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
        <p class="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Apparence</p>
        <h2 class="mt-2 text-2xl font-semibold text-slate-950">Couleurs de la chaîne</h2>
        <div class="mt-4 h-16 w-full overflow-hidden rounded-2xl" :style="`background:linear-gradient(135deg,${colorPrimary}33,${colorSecondary}55)`" />
        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <label class="flex flex-col gap-2">
            <span class="text-sm font-semibold text-slate-700">Couleur principale</span>
            <div class="flex items-center gap-3 rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3">
              <input v-model="colorPrimary" type="color" class="h-8 w-8 cursor-pointer rounded-lg border-0 bg-transparent p-0" />
              <span class="font-mono text-sm text-slate-600">{{ colorPrimary }}</span>
            </div>
          </label>
          <label class="flex flex-col gap-2">
            <span class="text-sm font-semibold text-slate-700">Couleur secondaire</span>
            <div class="flex items-center gap-3 rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3">
              <input v-model="colorSecondary" type="color" class="h-8 w-8 cursor-pointer rounded-lg border-0 bg-transparent p-0" />
              <span class="font-mono text-sm text-slate-600">{{ colorSecondary }}</span>
            </div>
          </label>
        </div>
        <div class="mt-4 flex items-center gap-3">
          <AppButton variant="primary" size="md" :disabled="colorSaving" @click="saveColors">
            {{ colorSaving ? 'Enregistrement...' : 'Enregistrer' }}
          </AppButton>
          <span v-if="colorSuccess" class="text-sm font-semibold text-emerald-600">✓ Sauvegardé</span>
        </div>
      </div>

      <!-- Zone dangereuse -->
      <div class="rounded-[2rem] border border-rose-200 bg-rose-50 p-6 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.35)]">
        <p class="text-xs font-semibold uppercase tracking-[0.24em] text-rose-700">Zone dangereuse</p>
        <h2 class="mt-2 text-2xl font-semibold text-slate-950">Supprimer la chaîne</h2>
        <p class="mt-3 text-sm leading-7 text-slate-600">
          Cette action est <strong>irréversible</strong>. Tous les contenus et abonnés seront perdus.<br />
          Tapez <strong>{{ channel.profile.name }}</strong> pour confirmer.
        </p>
        <input v-model="deleteConfirm" type="text" :class="inputClass + ' mt-4 w-full border-rose-200'" :placeholder="channel.profile.name" />
        <div class="mt-4">
          <AppButton
            variant="outline"
            size="md"
            class="border-rose-400 text-rose-700 hover:bg-rose-100"
            :disabled="deleteConfirm !== channel.profile.name || deleteLoading"
            @click="handleDelete"
          >
            {{ deleteLoading ? 'Suppression...' : 'Supprimer définitivement' }}
          </AppButton>
        </div>
      </div>
    </template>

  </div>
</template>
