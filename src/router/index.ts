import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import AppLayout from '../layouts/AppLayout.vue'

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
          meta: { requiresAuth: true } 
        },
        { 
          path: 'users', 
          name: 'users', 
          component: () => import('../views/UsersView.vue'),
          meta: { requiresAuth: true, role: 'Admin' } 
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

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const isAuthenticated = !!localStorage.getItem('token');

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login');
  } else if (to.meta.role && authStore.role !== to.meta.role) {
    next('/');
  } else {
    next();
  }
})

export default router