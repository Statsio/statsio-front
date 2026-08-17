<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: ['auth'], ssr: false, title: 'Invitation', robots: 'noindex,nofollow' })
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import { getInvitationByToken, acceptChannelInvitation, channelRoleLabels, type InvitationDetails } from '@/api/channels'
import { useAuthStore } from '@/stores/auth'
import { getErrorMessage } from '@/lib/http-errors'

const route = useRoute()
const token = computed(() => String(route.params.token))
const auth = useAuthStore()

const invitation = ref<InvitationDetails | null>(null)
const loading = ref(true)
const loadError = ref('')
const accepting = ref(false)
const acceptError = ref('')

const emailMismatch = computed(() =>
  invitation.value && auth.user?.email
    ? invitation.value.email.toLowerCase() !== auth.user.email.toLowerCase()
    : false,
)

onMounted(async () => {
  try {
    invitation.value = await getInvitationByToken(token.value)
  } catch (e) {
    loadError.value = getErrorMessage(e, 'Cette invitation est introuvable.')
  } finally {
    loading.value = false
  }
})

async function accept() {
  accepting.value = true
  acceptError.value = ''
  try {
    const { channel_id } = await acceptChannelInvitation(token.value)
    await navigateTo(`/channels/${channel_id}/dashboard/membres`)
  } catch (e) {
    acceptError.value = getErrorMessage(e, "Impossible d'accepter cette invitation.")
  } finally {
    accepting.value = false
  }
}
</script>

<template>
  <div class="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center gap-6 px-6 py-16">

    <div v-if="loading" class="card-xl h-64 animate-pulse" />

    <p v-else-if="loadError" class="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
      {{ loadError }}
    </p>

    <div v-else-if="invitation" class="card-xl flex flex-col gap-5 p-8 text-center">
      <div v-if="invitation.channel_logo" class="mx-auto h-16 w-16 overflow-hidden rounded-2xl">
        <img :src="invitation.channel_logo" alt="" class="h-full w-full object-cover" />
      </div>
      <div v-else class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-bold text-primary">
        {{ (invitation.channel_name ?? '?').slice(0, 1).toUpperCase() }}
      </div>

      <div>
        <h1 class="text-xl font-bold text-slate-950">
          Rejoindre {{ invitation.channel_name ?? 'cette chaîne' }}
        </h1>
        <p class="mt-2 text-sm text-slate-500">
          Vous êtes invité·e en tant que
          <span class="font-semibold text-slate-800">{{ channelRoleLabels[invitation.role] ?? invitation.role_label }}</span>.
        </p>
      </div>

      <p v-if="invitation.status !== 'pending'" class="rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
        Cette invitation n'est plus valide.
      </p>
      <p v-else-if="invitation.expired" class="rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
        Cette invitation a expiré.
      </p>
      <template v-else-if="emailMismatch">
        <p class="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Cette invitation est destinée à <strong>{{ invitation.email }}</strong>, alors que vous êtes connecté·e avec <strong>{{ auth.user?.email }}</strong>.
        </p>
        <AppButton variant="secondary" size="md" as="router-link" to="/login">Se connecter avec un autre compte</AppButton>
      </template>
      <template v-else>
        <p v-if="acceptError" class="text-sm text-rose-600">{{ acceptError }}</p>
        <AppButton variant="primary" size="md" :disabled="accepting" @click="accept">
          {{ accepting ? 'Acceptation...' : "Accepter l'invitation" }}
        </AppButton>
      </template>
    </div>

  </div>
</template>
