import './assets/main.css'
import './assets/theme.scss'
import './assets/accessibility.css'

import axios from 'axios'
import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { setBootstrapError } from './lib/app-bootstrap'
import { useAuthStore } from './stores/auth'

const app = createApp(App)
const pinia = createPinia()
const authStore = useAuthStore(pinia)

try {
  await authStore.initialize()
} catch (error) {
  const isNetworkError = axios.isAxiosError(error) && !error.response

  setBootstrapError({
    title: 'Connexion au serveur impossible',
    message: isNetworkError
      ? 'Statsio a rencontré une erreur de connexion. Vérifiez votre connexion internet et réessayez.'
      : 'Statsio n’a pas pu terminer son initialisation. Réessayez dans un instant.',
    details: `Code erreur: ERR_NETWORK_API`,
  })
}

app.use(pinia)
app.use(router)

app.mount('#app')
