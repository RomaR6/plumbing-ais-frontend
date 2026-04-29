import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import AppLayout from '../layouts/AppLayout.vue'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    roles?: string[]
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue')
    },
    {
      path: '/',
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        { 
          path: '', 
          name: 'products', 
          component: () => import('../views/ProductsView.vue') 
        },
        { 
          path: 'stocks', 
          name: 'stocks', 
          component: () => import('../views/StocksView.vue'),
          meta: { roles: ['Admin', 'Manager'] } 
        },
        { 
          path: 'transactions', 
          name: 'transactions', 
          component: () => import('../views/TransactionsView.vue'),
          meta: { roles: ['Admin', 'Manager'] } 
        },
        { 
          path: 'users', 
          name: 'users', 
          component: () => import('../views/UsersView.vue'),
          meta: { roles: ['Admin'] } 
        },
        { 
          path: 'reports', 
          name: 'reports', 
          component: () => import('../views/ReportsView.vue'),
          meta: { roles: ['Admin'] } 
        },
        { 
          path: 'logs', 
          name: 'logs', 
          component: () => import('../views/LogsView.vue'),
          meta: { roles: ['Admin'] } 
        },
        { 
          path: 'profile', 
          name: 'profile', 
          component: () => import('../views/ProfileView.vue')
        }
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

router.beforeEach(async (to, _, next) => {
  const authStore = useAuthStore();
  
  if (!authStore.token && localStorage.getItem('token')) {
    await authStore.init();
  }
  
  const isAuthenticated = !!authStore.token;
  const userRole = authStore.role || '';

  if (to.name !== 'login' && !isAuthenticated) {
    next({ name: 'login' });
  } 
  else if (to.name === 'login' && isAuthenticated) {
    next({ name: 'products' });
  }
  else if (to.meta.roles && !to.meta.roles.includes(userRole)) {
    next({ name: 'products' });
  } 
  else {
    next();
  }
})

export default router