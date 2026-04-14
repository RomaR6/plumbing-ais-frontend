import { createRouter, createWebHistory } from 'vue-router'
import ProductsView from '../views/ProductsView.vue'

const router = createRouter({
history: createWebHistory(import.meta.env.BASE_URL),
routes: [
    {
    path: '/',
    name: 'products',
    component: ProductsView
    },
    {
    path: '/stocks',
    name: 'stocks',
    
    component: () => import('../views/StocksView.vue')
    }
]
})

export default router