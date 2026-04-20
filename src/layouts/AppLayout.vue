<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import Button from 'primevue/button';
import Menu from 'primevue/menu';

const authStore = useAuthStore();
const router = useRouter();
const menu = ref();

onMounted(() => {
  authStore.init();
});

const isAuthenticated = computed(() => !!authStore.token);
const userName = computed(() => authStore.user || 'Гість');
const userRole = computed(() => authStore.role || '');

const userMenuItems = ref([
  {
    label: 'Мій профіль',
    icon: 'pi pi-user',
    command: () => { router.push('/profile'); }
  },
  {
    label: 'Вийти',
    icon: 'pi pi-sign-out',
    command: () => { logout(); }
  }
]);

const toggleMenu = (event: any) => {
  menu.value.toggle(event);
};

const logout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<template>
  <div class="layout-container">
    <aside class="sidebar">
      <div class="logo">
        <i class="pi pi-box" style="font-size: 1.5rem"></i>
        <span>AIS Plumbing</span>
      </div>
      
      <nav class="menu-nav">
        <router-link to="/" class="menu-item">
          <i class="pi pi-list"></i> <span>Товари</span>
        </router-link>
        <router-link v-if="isAuthenticated" to="/stocks" class="menu-item">
          <i class="pi pi-map"></i> <span>Склад</span>
        </router-link>
        <router-link v-if="userRole === 'Admin'" to="/users" class="menu-item">
          <i class="pi pi-users"></i> <span>Персонал</span>
        </router-link>
      </nav>
    </aside>

    <div class="main-content">
      <header class="header">
        <div class="header-left">
          <Button icon="pi pi-bars" text severity="secondary" />
        </div>
        
        <div class="header-right">
          <template v-if="isAuthenticated">
            <div class="user-profile-wrapper" @click="toggleMenu">
              <div class="user-details">
                <span class="user-name">{{ userName }}</span>
                <span class="user-role">{{ userRole }}</span>
              </div>
              <div class="user-avatar">
                <i class="pi pi-user"></i>
              </div>
              <i class="pi pi-chevron-down text-xs ml-2 text-slate-400"></i>
            </div>
            <Menu ref="menu" :model="userMenuItems" :popup="true" />
          </template>
          
          <template v-else>
            <Button label="Увійти" icon="pi pi-sign-in" severity="info" text @click="router.push('/login')" />
          </template>
        </div>
      </header>
      
      <main class="content-area">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.layout-container { display: flex; height: 100vh; overflow: hidden; }
.sidebar { width: 260px; background: #1e293b; color: white; display: flex; flex-direction: column; }
.logo { padding: 2rem; font-weight: bold; display: flex; align-items: center; gap: 10px; font-size: 1.2rem; border-bottom: 1px solid #334155; }
.menu-nav { padding: 1rem 0; flex: 1; }
.menu-item { display: flex; align-items: center; gap: 12px; padding: 1rem 2rem; color: #cbd5e1; text-decoration: none; transition: 0.3s; }
.menu-item:hover { background: #334155; color: white; }
.menu-item.router-link-active { background: #10b981; color: white; border-right: 4px solid #fff; }

.main-content { flex: 1; display: flex; flex-direction: column; overflow-y: auto; background: #f1f5f9; }
.header { height: 64px; background: white; display: flex; align-items: center; justify-content: space-between; padding: 0 2rem; border-bottom: 1px solid #e2e8f0; }
.content-area { padding: 2rem; }

.header-right { display: flex; align-items: center; }
.user-profile-wrapper { 
    display: flex; 
    align-items: center; 
    cursor: pointer; 
    padding: 0.5rem;
    border-radius: 8px;
    transition: background 0.2s;
}
.user-profile-wrapper:hover { background: #f8fafc; }

.user-details { display: flex; flex-direction: column; align-items: flex-end; margin-right: 0.75rem; line-height: 1.2; }
.user-name { font-weight: 600; color: #1e293b; font-size: 0.9rem; }
.user-role { font-size: 0.75rem; color: #64748b; text-transform: uppercase; }

.user-avatar {
    width: 35px;
    height: 35px;
    background: #ecfdf5;
    color: #10b981;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #d1fae5;
}
</style>