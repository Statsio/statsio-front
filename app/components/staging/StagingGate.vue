<script setup lang="ts">
import { ref, onMounted } from 'vue'

const config = useRuntimeConfig()
const appEnv = config.public.appEnv as string
const correctPassword = config.public.passwordMiddleware as string

const SESSION_KEY = 'statsio.staging.access'
const isProduction = appEnv === 'production'
const isGranted = ref(true)
const input = ref('')
const error = ref(false)

onMounted(() => {
  if (isProduction) return
  try {
    isGranted.value = sessionStorage.getItem(SESSION_KEY) === 'granted'
  } catch {
    isGranted.value = false
  }
})

function submit() {
  if (input.value === correctPassword) {
    try { sessionStorage.setItem(SESSION_KEY, 'granted') } catch {}
    isGranted.value = true
  } else {
    error.value = true
    input.value = ''
  }
}
</script>

<template>
  <slot v-if="isProduction || isGranted" />

  <div
    v-else
    class="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/95 backdrop-blur-sm p-4"
  >
    <div class="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900 p-8 shadow-2xl">
      <div class="mb-6 space-y-1.5">
        <div class="flex items-center gap-2">
          <span class="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </span>
          <span class="text-xs font-semibold uppercase tracking-widest text-amber-400">Staging</span>
        </div>
        <h2 class="text-xl font-semibold text-white">Accès restreint</h2>
        <p class="text-sm text-slate-400">Cet environnement est réservé aux tests internes.</p>
      </div>

      <form class="space-y-4" @submit.prevent="submit">
        <div class="space-y-1.5">
          <input
            v-model="input"
            type="password"
            placeholder="Mot de passe"
            autocomplete="current-password"
            class="w-full rounded-2xl border px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500"
            :class="error
              ? 'border-rose-500/60 bg-rose-950/40 focus:border-rose-400'
              : 'border-white/10 bg-white/5 focus:border-primary focus:bg-white/8'"
            @input="error = false"
          />
          <Transition
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="opacity-0 -translate-y-0.5"
            enter-to-class="opacity-100 translate-y-0"
          >
            <p v-if="error" class="text-xs font-medium text-rose-400">
              Mot de passe incorrect.
            </p>
          </Transition>
        </div>

        <button
          type="submit"
          class="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 active:scale-[0.98]"
        >
          Accéder
        </button>
      </form>
    </div>
  </div>
</template>
