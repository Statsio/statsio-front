<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import {
  createOrganization,
  joinOrganization,
  leaveOrganization,
  getJoinableOrganizations,
  type Channel,
  type ChannelOrganization,
} from '@/api/channels'
import { getErrorMessage } from '@/lib/http-errors'

const props = defineProps<{ channelId: number; channel: Channel }>()
const emit = defineEmits<{ reload: [] }>()

const isPrincipal = () => props.channel.organization?.principal_channel_id === props.channel.id

// --- Organisation existante ---
const leaveLoading = ref(false)
const leaveError = ref('')

const handleLeave = async () => {
  leaveLoading.value = true
  leaveError.value = ''
  try {
    await leaveOrganization(props.channelId)
    emit('reload')
  } catch (e) {
    leaveError.value = getErrorMessage(e, "Erreur lors de la mise à jour de l'organisation.")
  } finally {
    leaveLoading.value = false
  }
}

// --- Organisations rejoignables ---
const joinable = ref<ChannelOrganization[]>([])
const joinableLoading = ref(false)
const joinLoadingId = ref<number | null>(null)
const joinError = ref('')

const loadJoinable = async () => {
  if (props.channel.organization) return
  joinableLoading.value = true
  try {
    joinable.value = await getJoinableOrganizations(props.channelId)
  } catch {}
  finally { joinableLoading.value = false }
}

onMounted(loadJoinable)
watch(() => props.channel.organization, loadJoinable)

const handleJoin = async (organizationId: number) => {
  joinLoadingId.value = organizationId
  joinError.value = ''
  try {
    await joinOrganization(props.channelId, organizationId)
    emit('reload')
  } catch (e) {
    joinError.value = getErrorMessage(e, 'Erreur lors de la liaison.')
  } finally {
    joinLoadingId.value = null
  }
}

// --- Création d'une organisation ---
const newOrgName = ref('')
const createLoading = ref(false)
const createError = ref('')

const handleCreate = async () => {
  if (!newOrgName.value.trim()) return
  createLoading.value = true
  createError.value = ''
  try {
    await createOrganization(props.channelId, newOrgName.value.trim())
    newOrgName.value = ''
    emit('reload')
  } catch (e) {
    createError.value = getErrorMessage(e, "Erreur lors de la création de l'organisation.")
  } finally {
    createLoading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Organisation actuelle -->
    <div v-if="channel.organization" class="card-xl p-6 sm:p-7">
      <p class="eyebrow text-primary">Organisation</p>
      <div class="mt-5 flex items-center gap-4">
        <div class="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
          <img
            v-if="channel.organization.principal_channel?.profile?.logo_url"
            :src="channel.organization.principal_channel.profile.logo_url"
            alt=""
            class="h-full w-full object-cover"
          />
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate text-lg font-bold text-slate-950">{{ channel.organization.name }}</p>
          <p class="mt-0.5 text-[13px] text-slate-500">
            {{ isPrincipal() ? 'Cette chaîne est la chaîne principale — son logo sert de badge.' : `Chaîne principale : ${channel.organization.principal_channel?.profile?.name ?? '—'}` }}
          </p>
        </div>
      </div>
      <p v-if="leaveError" class="mt-4 text-sm text-rose-600">{{ leaveError }}</p>
      <div class="mt-5 border-t border-slate-100 pt-5">
        <p v-if="isPrincipal()" class="mb-3 text-[13px] leading-6 text-slate-500">
          Quitter dissoudra l'organisation : les autres chaînes éventuellement liées perdront le badge.
        </p>
        <AppButton variant="outline" size="md" class="border-rose-300 text-rose-700 hover:bg-rose-50" :disabled="leaveLoading" @click="handleLeave">
          {{ leaveLoading ? 'Patientez...' : (isPrincipal() ? "Dissoudre l'organisation" : "Quitter l'organisation") }}
        </AppButton>
      </div>
    </div>

    <template v-else>
      <!-- Rejoindre une organisation existante -->
      <div v-if="joinableLoading || joinable.length" class="card-xl p-6 sm:p-7">
        <p class="eyebrow text-primary">Rejoindre une organisation</p>
        <p class="mt-2 text-[13.5px] text-slate-500">
          Chaînes principales dont vous êtes propriétaire — lier cette chaîne ajoutera leur logo comme badge.
        </p>
        <p v-if="joinError" class="mt-3 text-sm text-rose-600">{{ joinError }}</p>
        <div v-if="joinableLoading" class="mt-4 h-16 animate-pulse rounded-2xl bg-slate-100" />
        <div v-else class="mt-4 flex flex-col gap-2.5">
          <div
            v-for="org in joinable"
            :key="org.id"
            class="flex items-center gap-3 rounded-[1.25rem] border border-slate-200 px-4 py-3"
          >
            <div class="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-slate-100">
              <img v-if="org.principal_channel?.profile?.logo_url" :src="org.principal_channel.profile.logo_url" alt="" class="h-full w-full object-cover" />
            </div>
            <p class="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">{{ org.name }}</p>
            <AppButton variant="outline" size="sm" :disabled="joinLoadingId === org.id" @click="handleJoin(org.id)">
              {{ joinLoadingId === org.id ? 'Liaison...' : 'Rejoindre' }}
            </AppButton>
          </div>
        </div>
      </div>

      <!-- Créer une organisation -->
      <div class="card-xl p-6 sm:p-7">
        <p class="eyebrow text-primary">Créer une organisation</p>
        <p class="mt-2 text-[13.5px] text-slate-500">
          Cette chaîne en deviendra la chaîne principale : son logo servira de badge sur les autres chaînes que vous y lierez.
        </p>
        <form class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center" @submit.prevent="handleCreate">
          <input
            v-model="newOrgName"
            type="text"
            placeholder="Nom de l'organisation"
            class="flex-1 rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
            required
          />
          <AppButton type="submit" variant="primary" size="md" :disabled="createLoading || !newOrgName.trim()">
            {{ createLoading ? 'Création...' : "Créer l'organisation" }}
          </AppButton>
        </form>
        <p v-if="createError" class="mt-3 text-sm text-rose-600">{{ createError }}</p>
      </div>
    </template>
  </div>
</template>
