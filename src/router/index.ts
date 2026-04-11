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
import TvProgrammeView from '../views/TvProgrammeView.vue'
import TvstatsView from '../views/TvstatsView.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/articles',
      name: 'articles',
      component: ArticlesView,
    },
    {
      path: '/articles/:slug',
      name: 'article-detail',
      component: ArticleDetailView,
    },
    {
      path: '/sondages',
      name: 'polls',
      component: PollsView,
    },
    {
      path: '/sondages/:slug',
      name: 'poll-detail',
      component: PollDetailView,
    },
    {
      path: '/statsdata',
      name: 'statsdata',
      component: StatsDataView,
    },
    {
      path: '/statsdata/:slug',
      name: 'statsdata-detail',
      component: StatsDataDetailView,
    },
    {
      path: '/studio/statsdata/nouveau',
      name: 'studio-statsdata-create',
      component: ContentStudioView,
      meta: {
        requiresAuth: true,
        studio: true,
        studioDocumentKind: 'statsdata' as const,
      },
    },
    {
      path: '/studio/statsdata/:id',
      name: 'studio-statsdata-edit',
      component: ContentStudioView,
      meta: {
        requiresAuth: true,
        studio: true,
        studioDocumentKind: 'statsdata' as const,
      },
    },
    {
      path: '/chaines',
      name: 'channels',
      component: ChannelsView,
    },
    {
      path: '/chaines/:slug',
      name: 'channel-detail',
      component: ChannelDetailView,
    },
    {
      path: '/tvstats',
      name: 'tvstats',
      component: TvstatsView,
    },
    {
      path: '/tvstats/programme-tv',
      name: 'tvstats-programme-tv',
      component: TvProgrammeView,
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: {
        guestOnly: true,
      },
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: ForgotPasswordView,
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/contenus',
      name: 'user-contents',
      component: UserContentsView,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/fil-actus',
      name: 'news-feed',
      component: NewsFeedView,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: {
        guestOnly: true,
      },
    },
  ],
})

router.beforeEach((to) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.hasSession) {
    return { name: 'login' }
  }

  if (to.meta.guestOnly && authStore.hasSession) {
    return { name: 'profile' }
  }

  return true
})

export default router
