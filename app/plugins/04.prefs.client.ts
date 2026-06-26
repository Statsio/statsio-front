import { usePrefsStore } from '@/stores/prefs'

export default defineNuxtPlugin(() => {
  usePrefsStore().init()
})
