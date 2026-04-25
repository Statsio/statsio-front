import { createRouter, createWebHistory } from 'vue-router'
import ArticleDetailView from '../views/ArticleDetailView.vue'
import ArticlesView from '../views/ArticlesView.vue'
import ChannelDetailView from '../views/ChannelDetailView.vue'
import ChannelsView from '../views/ChannelsView.vue'
import ForgotPasswordView from '../views/ForgotPasswordView.vue'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import NewsFeedView from '../views/NewsFeedView.vue'
import PollDetailView from '../views/PollDetailView.vue'
import PollsView from '../views/PollsView.vue'
import UserContentsView from '../views/UserContentsView.vue'
import ProfileView from '../views/ProfileView.vue'
import RegisterView from '../views/RegisterView.vue'
import ContentStudioView from '../views/ContentStudioView.vue'
import StatsDataDetailView from '../views/StatsDataDetailView.vue'
import StatsDataView from '../views/StatsDataView.vue'
import StatsDataSettingsView from '../views/StatsDataSettingsView.vue'
import StatsDataStudioPreviewView from '../views/StatsDataStudioPreviewView.vue'
import TvProgrammeView from '../views/TvProgrammeView.vue'
import TvstatsView from '../views/TvstatsView.vue'
import { useAuthStore } from '@/stores/auth'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import StudioLayout from '@/layouts/StudioLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: DefaultLayout,
      children: [
        {
          path: '',
          name: 'home',
          component: HomeView,
          meta: {
            title: 'Accueil',
            description:
              'Statsio centralise les analyses, les sources et les signaux en temps réel pour créer des articles, des StatsData et des sondages à fort impact.',
          },
        },
        {
          path: 'articles',
          name: 'articles',
          component: ArticlesView,
          meta: {
            title: 'Articles',
            description: 'Décryptages et analyses enrichies par les données. Parcourez les sujets et signaux du moment.',
          },
        },
        {
          path: 'articles/:slug',
          name: 'article-detail',
          component: ArticleDetailView,
        },
        {
          path: 'sondages',
          name: 'polls',
          component: PollsView,
          meta: {
            title: 'Sondages',
            description:
              'Parcourez les sondages, comparez les vagues et accédez au détail pour répondre question par question.',
          },
        },
        {
          path: 'sondages/:slug',
          name: 'poll-detail',
          component: PollDetailView,
        },
        {
          path: 'statsdata',
          name: 'statsdata',
          component: StatsDataView,
          meta: {
            title: 'StatsData',
            description: 'Explorez des datasets, comparez des indicateurs et suivez les mises à jour.',
          },
        },
        {
          path: 'integrations/statsdata',
          name: 'integrations-statsdata',
          component: StatsDataView,
          meta: {
            title: 'Intégration StatsData',
            description: 'Présentation de l’intégration StatsData et catalogue public.',
          },
        },
        {
          path: 'statsdata/:slug',
          name: 'statsdata-detail',
          component: StatsDataDetailView,
        },
        {
          path: 'statsdata/:id/proprietes',
          name: 'statsdata-settings',
          component: StatsDataSettingsView,
          meta: {
            requiresAuth: true,
          },
        },
        {
          path: 'chaines',
          name: 'channels',
          component: ChannelsView,
          meta: {
            title: 'Chaînes',
            description: 'Recherchez, filtrez et suivez des chaînes éditoriales et thématiques.',
          },
        },
        {
          path: 'chaines/:slug',
          name: 'channel-detail',
          component: ChannelDetailView,
        },
        {
          path: 'tvstats',
          name: 'tvstats',
          component: TvstatsView,
          meta: {
            title: 'TVStats',
            description: 'Tableaux de bord et vues TV enrichies par les signaux d’audience.',
          },
        },
        {
          path: 'tvstats/programme-tv',
          name: 'tvstats-programme-tv',
          component: TvProgrammeView,
        },
        {
          path: 'about',
          name: 'about',
          component: () => import('../views/AboutView.vue'),
        },
        {
          path: 'profile',
          name: 'profile',
          component: ProfileView,
          meta: {
            requiresAuth: true,
          },
        },
        {
          path: 'contenus',
          name: 'user-contents',
          component: UserContentsView,
          meta: {
            requiresAuth: true,
            title: 'Mes contenus',
            description: 'Retrouvez et gérez vos contenus StatsData.',
          },
        },
        {
          path: 'fil-actus',
          name: 'news-feed',
          component: NewsFeedView,
          meta: {
            requiresAuth: true,
          },
        },
      ],
    },
    {
      path: '/studio',
      component: StudioLayout,
      children: [
        {
          path: 'statsdata/nouveau',
          name: 'studio-statsdata-create',
          component: ContentStudioView,
          meta: {
            requiresAuth: true,
            studio: true,
            studioDocumentKind: 'statsdata' as const,
            title: 'Studio - Nouveau StatsData',
            description: 'Créez une nouvelle visualisation de données interactive avec le studio Statsio.',
          },
        },
        {
          path: 'statsdata/:id',
          name: 'studio-statsdata-edit',
          component: ContentStudioView,
          meta: {
            requiresAuth: true,
            studio: true,
            studioDocumentKind: 'statsdata' as const,
            title: 'Studio - Édition StatsData',
            description: 'Modifiez votre visualisation de données interactive avec le studio Statsio.',
          },
        },
        {
          path: 'statsdata/:id/previsualisation',
          name: 'studio-statsdata-preview',
          component: StatsDataStudioPreviewView,
          meta: {
            requiresAuth: true,
            studio: true,
            studioDocumentKind: 'statsdata' as const,
            title: 'Studio - Prévisualisation StatsData',
            description: 'Prévisualisez votre visualisation de données interactive avant publication.',
          },
        },
      ],
    },
    {
      path: '/',
      component: StudioLayout,
      children: [
        {
          path: 'login',
          name: 'login',
          component: LoginView,
          meta: {
            guestOnly: true,
          },
        },
        {
          path: 'register',
          name: 'register',
          component: RegisterView,
          meta: {
            guestOnly: true,
          },
        },
        {
          path: 'forgot-password',
          name: 'forgot-password',
          component: ForgotPasswordView,
        },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.hasSession) {
    // Remember where the user wanted to go, so login can send them back.
    if (typeof window !== 'undefined' && to.fullPath && !to.fullPath.startsWith('/login')) {
      const key = 'statsio.auth.redirectAfterLogin'
      try {
        window.sessionStorage.setItem(key, to.fullPath)
      } catch {
        // ignore
      }
      try {
        window.localStorage.setItem(key, to.fullPath)
      } catch {
        // ignore
      }
    }
    return { name: 'login' }
  }

  if (to.meta.guestOnly && authStore.hasSession) {
    return { name: 'profile' }
  }

  return true
})

export default router
