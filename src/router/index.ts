import { createRouter, createWebHistory } from 'vue-router'
import ArticleDetailView from '../views/ArticleDetailView.vue'
import ArticlesView from '../views/ArticlesView.vue'
import ChannelDetailView from '../views/ChannelDetailView.vue'
import ChannelsView from '../views/ChannelsView.vue'
import ChannelFrontView from '../views/ChannelFrontView.vue'
import ForgotPasswordView from '../views/ForgotPasswordView.vue'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import NewsFeedView from '../views/NewsFeedView.vue'
import PollDetailView from '../views/PollDetailView.vue'
import PollsView from '../views/PollsView.vue'
const UserContentsView = () => import('../views/UserContentsView.vue')
import ProfileView from '../views/ProfileView.vue'
import RegisterView from '../views/RegisterView.vue'
import HistoryView from '../views/HistoryView.vue'
import MyChannelsView from '../views/MyChannelsView.vue'
import ChannelCreateView from '../views/ChannelCreateView.vue'
import ChannelManageView from '../views/ChannelManageView.vue'
const StatsDataDetailView = () => import('../views/StatsDataDetailView.vue')
const StatsDataView = () => import('../views/StatsDataView.vue')
const StatsDataSettingsView = () => import('../views/StatsDataSettingsView.vue')
const StatsDataPageView = () => import('../views/StatsDataPageView.vue')
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
          path: 'statsdata/:slug/:pageSlug',
          name: 'statsdata-page',
          component: StatsDataDetailView,
        },
        {
          path: 'stats/:pageSlug',
          name: 'stats-page',
          component: StatsDataPageView,
        },
        {
          path: 'statsdata/:slug/proprietes',
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
          path: 'channels/:handle',
          name: 'channel-front',
          component: ChannelFrontView,
          meta: {
            title: 'Chaîne',
            description: 'Page front d\'une chaîne éditoriale Statsio.',
          },
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
          path: 'tvstats/audiences',
          name: 'tvstats-audiences',
          component: () => import('../views/TvAudiencesView.vue'),
        },
        {
          path: 'tvstats/emission/:id',
          name: 'tvstats-broadcast',
          component: () => import('../views/TvBroadcastView.vue'),
        },
        {
          path: 'medistats',
          name: 'medistats',
          component: () => import('../views/MedistatsView.vue'),
          meta: {
            title: 'Medistats',
            description: 'Données de santé publique, pathologies, médicaments et offre de soins.',
          },
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
          path: 'mes-chaines',
          name: 'my-channels',
          component: MyChannelsView,
          meta: {
            requiresAuth: true,
            title: 'Mes chaînes',
            description: 'Gérez vos chaînes éditoriales et publiez vos contenus.',
          },
        },
        {
          path: 'channels/create',
          name: 'channel-create',
          component: ChannelCreateView,
          meta: {
            requiresAuth: true,
            title: 'Créer une chaîne',
            description: 'Créez votre chaîne éditoriale personnalisée.',
          },
        },
        {
          path: 'channels/:id/manage',
          name: 'channel-manage',
          component: ChannelManageView,
          meta: {
            requiresAuth: true,
            title: 'Gérer la chaîne',
          },
        },
        {
          path: 'historique',
          name: 'history',
          component: HistoryView,
          meta: {
            requiresAuth: true,
            title: 'Historique',
            description: 'Retrouvez tous les contenus que vous avez consultés.',
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
      path: '/',
      component: StudioLayout,
      children: [
        {
          path: 'studio',
          name: 'studio',
          component: () => import('../views/StudioView.vue'),
          meta: {
            requiresAuth: true,
            studio: true,
            title: 'Studio',
            description: 'Créez et éditez vos contenus StatsData avec l\'interface Studio.',
          },
        },
        {
          path: 'studio/:slug',
          name: 'studio-edit',
          component: () => import('../views/StudioView.vue'),
          meta: {
            requiresAuth: true,
            studio: true,
            title: 'Studio — Édition',
          },
        },
        {
          path: 'tvstats/studio',
          name: 'tvstats-studio',
          component: () => import('../views/StudioView.vue'),
          meta: {
            requiresAuth: true,
            studio: true,
            title: 'Studio TVStats',
            description: "Créez et éditez vos contenus TVStats avec l'interface Studio.",
          },
        },
        {
          path: 'tvstats/studio/:slug',
          name: 'tvstats-studio-edit',
          component: () => import('../views/StudioView.vue'),
          meta: {
            requiresAuth: true,
            studio: true,
            title: 'Studio TVStats — Édition',
          },
        },
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
