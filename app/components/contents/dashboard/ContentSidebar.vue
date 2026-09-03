<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppSidebarNavItem from '@/components/ui/AppSidebarNavItem.vue'
import { useAuthStore } from '@/stores/auth'
import { useContentDashboard } from '@/composables/useContentDashboard'
import { formatShortDate } from '@/lib/format'

const emit = defineEmits<{ navigate: [] }>()

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const { content, contentType, statusMeta, typeLabel, studioPath, publicPath, propertiesBase } =
  useContentDashboard()

async function handleLogout() {
  await authStore.logout()
  emit('navigate')
  router.push('/')
}

const savedLabel = computed(() => {
  if (!content.value) return ''
  if (content.value.status === 'published') return `Publié · ${statusMeta.value.label}`
  const date = content.value.updated_at ?? content.value.created_at
  return date ? `Brouillon · modifié le ${formatShortDate(date)}` : 'Brouillon'
})

type NavItem = { to: string; label: string; icon: string; exact?: boolean; count?: string }

const navItems = computed<NavItem[]>(() => [
  {
    to: propertiesBase.value,
    label: 'Contenu',
    exact: true,
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    to: `${propertiesBase.value}/publication`,
    label: 'Publication',
    icon: 'M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7',
  },
  // Les sources de données ne concernent que les Statsdata (les articles et
  // sondages n'alimentent pas de blocs par jeu de données).
  ...(contentType.value === 'statsdata'
    ? [
        {
          to: `${propertiesBase.value}/sources`,
          label: 'Sources de données',
          icon: 'M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125',
          count: content.value?.datasets?.length ? String(content.value.datasets.length) : undefined,
        },
      ]
    : []),
  {
    to: `${propertiesBase.value}/acces`,
    label: 'Accès & partage',
    icon: 'M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244',
  },
  {
    to: `${propertiesBase.value}/historique`,
    label: 'Historique',
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  },
])

function isActive(item: NavItem) {
  return item.exact ? route.path === item.to : route.path.startsWith(item.to)
}
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden">
    <!-- Retour à Mes contenus -->
    <NuxtLink
      to="/user/contenus"
      class="flex shrink-0 items-center gap-2.5 border-b border-slate-100 px-4 py-3 transition hover:bg-slate-50"
      @click="emit('navigate')"
    >
      <span class="w-[18px] shrink-0 text-center text-[14px] leading-none text-primary">←</span>
      <span class="min-w-0 flex-1">
        <span class="block text-[9.5px] font-extrabold uppercase tracking-[0.07em] text-slate-400"
          >Retour à</span
        >
        <span class="mt-0.5 block text-[12.5px] font-bold text-slate-950">Mes contenus</span>
      </span>
    </NuxtLink>

    <!-- Carte identité du contenu -->
    <div class="shrink-0 px-3.5 pb-3.5 pt-4">
      <div class="rounded-2xl border-[1.5px] border-slate-200 p-3.5">
        <div class="flex items-center gap-2">
          <span
            class="rounded-md bg-primary/10 px-1.5 py-0.5 font-mono text-[9.5px] font-semibold uppercase text-primary"
          >
            {{ typeLabel }}
          </span>
          <span
            class="rounded-full px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.04em]"
            :style="{ color: statusMeta.color, background: statusMeta.bg }"
          >
            {{ statusMeta.label }}
          </span>
        </div>
        <div class="mt-2.5 flex items-start gap-2">
          <p class="text-[13.5px] font-extrabold leading-snug text-slate-950 text-pretty">
            {{ content?.title }}
          </p>
        </div>
        <p class="mt-1.5 font-mono text-[10px] text-slate-400">{{ savedLabel }}</p>
      </div>
    </div>

    <!-- Navigation onglets -->
    <nav class="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-3.5">
      <AppSidebarNavItem
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        :label="item.label"
        :icon="item.icon"
        :active="isActive(item)"
        @click="emit('navigate')"
      >
        <template #trailing>
          <span v-if="item.count" class="font-mono text-[10px] text-slate-400">{{
            item.count
          }}</span>
        </template>
      </AppSidebarNavItem>

      <div class="mx-1.5 my-3 h-px bg-slate-100" />

      <AppSidebarNavItem
        :to="studioPath"
        label="Ouvrir dans le Studio"
        icon="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"
        @click="emit('navigate')"
      />
      <AppSidebarNavItem
        v-if="publicPath"
        :to="publicPath"
        label="Voir la page publique"
        icon="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        @click="emit('navigate')"
      />
    </nav>

    <!-- Déconnexion -->
    <div class="shrink-0 border-t border-slate-100 px-3.5 py-2">
      <AppSidebarNavItem
        as="button"
        tone="danger"
        :disabled="authStore.isLoggingOut"
        :label="authStore.isLoggingOut ? 'Déconnexion…' : 'Se déconnecter'"
        icon="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l3 3m0 0l-3 3m3-3H3"
        @click="handleLogout"
      />
    </div>
  </div>
</template>
