<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import type { KlaroManager } from '@/lib/klaro'
import { klaroConfig, purposeMeta } from '@/lib/klaro'

const visible = ref(false)
const showModal = ref(false)
const manager = ref<KlaroManager | null>(null)

// Signal venant de l'extérieur (ex: lien "Gérer les cookies" du footer)
const openRequest = useCookieBanner()
watch(openRequest, (requested) => {
  if (requested) {
    visible.value = true
    openModal()
    openRequest.value = false
  }
})

const localConsents = reactive<Record<string, boolean>>({})

// Accordéon : true = déplié (ouvert par défaut)
const expandedGroups = reactive<Record<string, boolean>>({})

function toggleGroup(purpose: string) {
  expandedGroups[purpose] = !expandedGroups[purpose]
}

// Services grouped by first purpose
const serviceGroups = computed(() => {
  const groups: Array<{
    purpose: string
    label: string
    description: string
    services: typeof klaroConfig.services
  }> = []

  const seen = new Set<string>()
  for (const service of klaroConfig.services) {
    const purpose = service.purposes[0] ?? 'other'
    if (!seen.has(purpose)) {
      seen.add(purpose)
      groups.push({
        purpose,
        label: purposeMeta[purpose]?.label ?? purpose,
        description: purposeMeta[purpose]?.description ?? '',
        services: [],
      })
    }
    groups.find(g => g.purpose === purpose)!.services.push(service)
  }
  return groups
})

// ── Google Consent Mode v2 ─────────────────────────────────────────────────
type GcmConsent = 'granted' | 'denied'
interface GcmUpdate {
  analytics_storage: GcmConsent
  functionality_storage: GcmConsent
  ad_storage: GcmConsent
  ad_user_data: GcmConsent
  ad_personalization: GcmConsent
}

function pushGcmConsent(consents: Record<string, boolean>) {
  const w = window as typeof window & { gtag?: (...args: unknown[]) => void }
  if (!w.gtag) return
  const update: GcmUpdate = {
    analytics_storage: consents['google-tag-manager'] ? 'granted' : 'denied',
    functionality_storage: consents['youtube'] ? 'granted' : 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  }
  w.gtag('consent', 'update', update)
}

function syncLocalConsents() {
  for (const service of klaroConfig.services) {
    if (!service.required) {
      localConsents[service.name] = manager.value?.consents[service.name] ?? service.default ?? false
    }
  }
  // Ouvrir tous les groupes par défaut à l'ouverture de la modale
  for (const group of serviceGroups.value) {
    if (!(group.purpose in expandedGroups)) {
      expandedGroups[group.purpose] = true
    }
  }
}

onMounted(() => {
  manager.value = useNuxtApp().$klaroManager
  if (!manager.value.confirmed) {
    visible.value = true
  }
})

function acceptAll() {
  manager.value?.changeAll(true)
  manager.value?.saveAndApplyConsents()
  pushGcmConsent(Object.fromEntries(klaroConfig.services.map(s => [s.name, true])))
  visible.value = false
}

function declineAll() {
  manager.value?.changeAll(false)
  manager.value?.saveAndApplyConsents()
  pushGcmConsent(Object.fromEntries(klaroConfig.services.map(s => [s.name, false])))
  visible.value = false
}

function openModal() {
  syncLocalConsents()
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

function saveSelection() {
  for (const [name, value] of Object.entries(localConsents)) {
    manager.value?.updateConsent(name, value)
  }
  manager.value?.saveAndApplyConsents()
  pushGcmConsent(localConsents)
  visible.value = false
  showModal.value = false
}
</script>

<template>
  <Teleport to="body">

    <!-- ── Bandeau compact (bottom-right) ───────────────────────────────────── -->
    <Transition name="cookie-banner">
      <div
        v-if="visible && !showModal"
        class="fixed bottom-5 right-5 z-[9001] w-[calc(100vw-2.5rem)] max-w-[420px] bg-white rounded-2xl border border-slate-100 shadow-[0_4px_6px_-1px_rgba(15,23,42,0.04),_0_20px_50px_-8px_rgba(15,23,42,0.14)] p-5"
        role="dialog"
        aria-label="Préférences de confidentialité"
      >
        <div class="flex items-center gap-3 mb-3">
          <img src="/brand/statsio-cookie.svg" alt="" aria-hidden="true" class="w-8 h-8 shrink-0">
          <h2 class="font-bold text-slate-900 text-[0.9375rem] leading-tight">
            Vos préférences de confidentialité
          </h2>
        </div>

        <p class="text-slate-500 text-[0.8125rem] leading-relaxed">
          Nous utilisons des cookies pour améliorer votre expérience.
          <NuxtLink to="/politique-de-confidentialite" class="text-violet-500 underline underline-offset-2">
            En savoir plus
          </NuxtLink>
        </p>

        <div class="flex flex-wrap gap-2 mt-4">
          <button
            class="flex-1 whitespace-nowrap rounded-full border border-slate-200 text-slate-500 text-[0.8125rem] font-semibold px-4 py-2 hover:bg-slate-50 hover:border-slate-300 transition-colors"
            @click="declineAll"
          >
            Tout refuser
          </button>
          <button
            class="flex-1 whitespace-nowrap rounded-full border border-violet-200 text-violet-500 text-[0.8125rem] font-semibold px-4 py-2 hover:bg-violet-50 transition-colors"
            @click="openModal"
          >
            Personnaliser
          </button>
          <button
            class="flex-1 whitespace-nowrap rounded-full bg-violet-500 text-white text-[0.8125rem] font-semibold px-4 py-2 shadow-[0_4px_12px_rgba(139,92,246,0.3)] hover:bg-violet-600 hover:-translate-y-px transition-all"
            @click="acceptAll"
          >
            Tout accepter
          </button>
        </div>
      </div>
    </Transition>

    <!-- ── Modale de personnalisation ───────────────────────────────────────── -->
    <Transition name="cookie-modal">
      <div
        v-if="showModal"
        class="fixed inset-0 z-[9002] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Personnaliser mes préférences"
        @click="closeModal"
      >
        <!-- Overlay -->
        <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />

        <!-- Carte (stop propagation pour ne pas fermer au clic intérieur) -->
        <div
          class="relative z-10 flex flex-col w-[min(540px,92vw)] max-h-[85vh] bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-[0_4px_6px_-1px_rgba(15,23,42,0.06),_0_30px_80px_-10px_rgba(15,23,42,0.22)]"
          @click.stop
        >
          <!-- En-tête -->
          <div class="shrink-0 bg-gradient-to-br from-violet-500 to-blue-500 px-7 pt-6 pb-5">
            <img
              src="/brand/statsio-cookie.svg"
              alt=""
              aria-hidden="true"
              class="w-8 h-8 mb-3"
              style="filter: brightness(0) invert(1); opacity: 0.9"
            >
            <h2 class="text-white font-bold text-[1.0625rem] tracking-tight">
              Vos préférences de confidentialité
            </h2>
            <p class="text-white/80 text-[0.8125rem] mt-1.5 leading-relaxed">
              Choisissez les services que vous autorisez. Modifiable à tout moment.
              <NuxtLink to="/politique-de-confidentialite" class="text-white/90 underline underline-offset-2">
                Politique de confidentialité
              </NuxtLink>.
            </p>
          </div>

          <!-- Corps (scrollable) -->
          <div class="min-h-0 flex-1 overflow-y-auto py-2">
            <div
              v-for="group in serviceGroups"
              :key="group.purpose"
              class="border-b border-slate-100 last:border-0"
            >
              <!-- En-tête accordéon -->
              <button
                class="w-full flex items-center justify-between gap-3 px-7 py-4 text-left hover:bg-slate-50 transition-colors"
                :aria-expanded="expandedGroups[group.purpose]"
                @click="toggleGroup(group.purpose)"
              >
                <div>
                  <p class="text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-violet-500">
                    {{ group.label }}
                  </p>
                  <p class="text-slate-400 text-[0.75rem] mt-0.5">{{ group.description }}</p>
                </div>
                <!-- Chevron -->
                <svg
                  class="shrink-0 w-4 h-4 text-slate-400 transition-transform duration-200"
                  :class="expandedGroups[group.purpose] ? 'rotate-180' : ''"
                  viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                >
                  <path d="M4 6l4 4 4-4"/>
                </svg>
              </button>

              <!-- Contenu dépliable -->
              <Transition name="accordion">
                <div v-show="expandedGroups[group.purpose]" class="px-7 pb-2">
                  <div
                    v-for="service in group.services"
                    :key="service.name"
                    class="flex items-start justify-between gap-4 py-3.5 border-t border-slate-100 first:border-0"
                  >
                    <div class="min-w-0">
                      <p class="font-semibold text-slate-900 text-[0.875rem]">{{ service.title }}</p>
                      <p v-if="service.description" class="text-slate-500 text-[0.8125rem] mt-0.5 leading-relaxed">
                        {{ service.description }}
                      </p>
                    </div>

                    <!-- Toggle -->
                    <button
                      v-if="!service.required"
                      role="switch"
                      :aria-checked="localConsents[service.name]"
                      :aria-label="`Autoriser ${service.title}`"
                      class="relative w-10 h-[22px] rounded-full shrink-0 mt-1 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                      :class="localConsents[service.name] ? 'bg-violet-500' : 'bg-slate-200'"
                      @click="localConsents[service.name] = !localConsents[service.name]"
                    >
                      <span
                        class="absolute top-[2px] left-[2px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform duration-200"
                        :class="localConsents[service.name] ? 'translate-x-[18px]' : 'translate-x-0'"
                      />
                    </button>

                    <!-- Badge "Requis" -->
                    <span v-else class="shrink-0 mt-1 text-[0.6875rem] font-semibold text-slate-400 bg-slate-100 rounded-full px-2.5 py-1">
                      Requis
                    </span>
                  </div>
                </div>
              </Transition>
            </div>
          </div>

          <!-- Pied -->
          <div class="shrink-0 bg-slate-50 border-t border-slate-100 px-7 py-4 flex items-center justify-between gap-3">
            <button
              class="text-[0.8125rem] text-slate-400 hover:text-slate-600 transition-colors underline underline-offset-2"
              @click="() => { declineAll(); closeModal() }"
            >
              Tout refuser
            </button>
            <div class="flex items-center gap-2.5">
              <button
                class="rounded-full border border-slate-200 text-slate-600 text-[0.8125rem] font-semibold px-4 py-2 hover:bg-slate-100 transition-colors"
                @click="closeModal"
              >
                Fermer
              </button>
              <button
                class="rounded-full bg-violet-500 text-white text-[0.8125rem] font-semibold px-5 py-2 shadow-[0_4px_12px_rgba(139,92,246,0.3)] hover:bg-violet-600 hover:-translate-y-px transition-all"
                @click="saveSelection"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

  </Teleport>
</template>

<style scoped>
.cookie-banner-enter-active,
.cookie-banner-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.cookie-banner-enter-from,
.cookie-banner-leave-to {
  opacity: 0;
  transform: translateY(0.75rem);
}

.cookie-modal-enter-active,
.cookie-modal-leave-active {
  transition: opacity 0.2s ease;
}
.cookie-modal-enter-from,
.cookie-modal-leave-to {
  opacity: 0;
}

.accordion-enter-active,
.accordion-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.accordion-enter-from,
.accordion-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
