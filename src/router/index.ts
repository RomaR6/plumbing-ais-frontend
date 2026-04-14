import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '../layouts/AppLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
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
          component: () => import('../views/StocksView.vue')
        }
      ]
    }
  ]
})

export default router