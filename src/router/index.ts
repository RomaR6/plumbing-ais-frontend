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
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue')
    },
    {
      path: '/',
      component: AppLayout,
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
          meta: { requiresAuth: true, roles: ['Admin', 'Manager'] } 
        },
        { 
          path: 'transactions', 
          name: 'transactions', 
          component: () => import('../views/TransactionsView.vue'),
          meta: { requiresAuth: true, roles: ['Admin', 'Manager'] } 
        },
        { 
          path: 'users', 
          name: 'users', 
          component: () => import('../views/UsersView.vue'),
          meta: { requiresAuth: true, roles: ['Admin'] } 
        },
        { 
          path: 'reports', 
          name: 'reports', 
          component: () => import('../views/ReportsView.vue'),
          meta: { requiresAuth: true, roles: ['Admin'] } 
        },
        { 
          path: 'logs', 
          name: 'logs', 
          component: () => import('../views/LogsView.vue'),
          meta: { requiresAuth: true, roles: ['Admin'] } 
        },
        {
          path: 'profile',
          name: 'profile',
          component: () => import('../views/ProfileView.vue'),
          meta: { requiresAuth: true }
        }
      ]
    }
  ]
})

router.beforeEach((to, _, next) => {
  const authStore = useAuthStore();
  if (!authStore.token && localStorage.getItem('token')) {
    authStore.init();
  }
  const isAuthenticated = !!authStore.token;
  const userRole = authStore.role || '';

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login');
  } 
  else if (to.meta.roles && !to.meta.roles.includes(userRole)) {
    next('/');
  } 
  else {
    next();
  }
})

export default router