<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppNotifications } from '@/composables/useAppNotifications'
import { anonymizeAccount } from '@/api/statsio-user'

const authStore = useAuthStore()
const router = useRouter()
const notifications = useAppNotifications()

const confirming = ref(false)
const deleting = ref(false)

async function confirmDelete() {
  deleting.value = true
  try {
    await anonymizeAccount()
    authStore.clearSession()
    router.push('/')
  } catch {
    notifications.error('La suppression a échoué. Veuillez réessayer.')
  } finally {
    deleting.value = false
    confirming.value = false
  }
}
</script>

<template>
  <section class="rounded-2xl border border-rose-200 bg-rose-50 p-6 sm:p-7">
    <div class="mb-2.5 text-xs font-bold uppercase tracking-[0.04em] text-rose-600">Zone sensible</div>
    <p class="mb-4 max-w-lg text-[13px] leading-6 text-slate-600 text-pretty">
      La suppression de votre compte est définitive : historique, favoris et abonnements seront effacés et ne pourront
      pas être récupérés.
    </p>

    <div v-if="confirming" class="flex flex-wrap items-center gap-3">
      <span class="text-[13px] font-bold text-rose-600">Confirmer la suppression définitive ?</span>
      <button
        type="button"
        :disabled="deleting"
        class="rounded-full bg-rose-600 px-[18px] py-2 text-[12px] font-bold uppercase tracking-[0.06em] text-white disabled:opacity-60"
        @click="confirmDelete"
      >
        {{ deleting ? 'Suppression…' : 'Oui, supprimer' }}
      </button>
      <button type="button" class="text-[12.5px] font-semibold text-slate-500" @click="confirming = false">
        Annuler
      </button>
    </div>
    <button
      v-else
      type="button"
      class="rounded-full border-[1.5px] border-rose-600 bg-white px-5 py-2 text-[12.5px] font-bold text-rose-600 transition hover:bg-rose-600 hover:text-white"
      @click="confirming = true"
    >
      Supprimer mon compte
    </button>
  </section>
</template>
