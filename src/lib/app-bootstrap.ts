import { ref } from 'vue'

export type AppBootstrapErrorState = {
  title: string
  message: string
  details?: string
}

export const bootstrapError = ref<AppBootstrapErrorState | null>(null)

export const setBootstrapError = (error: AppBootstrapErrorState) => {
  bootstrapError.value = error
}

export const clearBootstrapError = () => {
  bootstrapError.value = null
}
