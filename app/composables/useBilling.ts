import { ref } from 'vue'
import { startCheckoutSession, startPortalSession } from '@/api/billing'
import { useAppNotifications } from '@/composables/useAppNotifications'
import { getErrorMessage } from '@/lib/http-errors'

/**
 * Démarre les flux Stripe hébergés (Checkout pour payer, portail client pour gérer
 * l'abonnement) : redirection plein écran, pas d'UI custom — voir /offres et
 * AccountBillingCard.vue.
 */
export function useBilling() {
  const notifications = useAppNotifications()
  const isRedirecting = ref(false)

  async function goToCheckout() {
    isRedirecting.value = true
    try {
      const url = await startCheckoutSession()
      window.location.assign(url)
    } catch (error) {
      notifications.error(getErrorMessage(error, 'Impossible de démarrer le paiement pour le moment.'))
      isRedirecting.value = false
    }
  }

  async function goToPortal() {
    isRedirecting.value = true
    try {
      const url = await startPortalSession()
      window.location.assign(url)
    } catch (error) {
      notifications.error(getErrorMessage(error, "Impossible d'ouvrir la gestion de l'abonnement pour le moment."))
      isRedirecting.value = false
    }
  }

  return { isRedirecting, goToCheckout, goToPortal }
}
