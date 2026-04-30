<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter, useRoute } from 'vue-router';
import Button from 'primevue/button';
import Menu from 'primevue/menu';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const menu = ref();
const isCollapsed = ref(false);
const isMobile = ref(false);
const mobileVisible = ref(false);

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768;
  if (!isMobile.value) mobileVisible.value = false;
};

onMounted(() => {
  authStore.init();
  checkMobile();
  window.addEventListener('resize', checkMobile);
});

watch(() => route.path, () => {
  if (isMobile.value) mobileVisible.value = false;
});

const isAuthenticated = computed(() => !!authStore.token);
const userRole = computed(() => authStore.role || '');

const userMenuItems = ref([
  { label: 'Мій профіль', icon: 'pi pi-user', command: () => { router.push('/profile'); } },
  { label: 'Вийти', icon: 'pi pi-sign-out', command: () => { logout(); } }
]);

const toggleSidebar = () => {
  if (isMobile.value) {
    mobileVisible.value = !mobileVisible.value;
  } else {
    isCollapsed.value = !isCollapsed.value;
  }
};

const toggleMenu = (event: any) => { menu.value.toggle(event); };

const logout = () => {
  authStore.logout();
  router.push('/login');
};

const isItemActive = (path: string) => {
  if (path === '/products') {
    return route.path === '/products' || route.path === '/';
  }
  return route.path.startsWith(path);
};
</script>

<template>
  <div class="layout-container">
    <!-- Overlay для мобільного меню -->
    <div v-if="isMobile && mobileVisible" class="sidebar-overlay" @click="mobileVisible = false"></div>

    <aside :class="['sidebar', { 
      'collapsed': isCollapsed && !isMobile, 
      'mobile-active': mobileVisible && isMobile,
      'mobile-hidden': !mobileVisible && isMobile 
    }]">
      <div class="logo">
        <i class="pi pi-box" style="font-size: 1.5rem"></i>
        <span v-if="!isCollapsed || isMobile">AIS Plumbing</span>
      </div>
      
      <nav class="menu-nav">
        <router-link to="/products" :class="['menu-item', { 'manual-active': isItemActive('/products') }]">
          <i class="pi pi-list"></i>
          <span v-if="!isCollapsed || isMobile">Товари</span>
        </router-link>
        
        <router-link v-if="isAuthenticated" to="/stocks" :class="['menu-item', { 'manual-active': isItemActive('/stocks') }]">
          <i class="pi pi-map"></i>
          <span v-if="!isCollapsed || isMobile">Склад</span>
        </router-link>

        <router-link v-if="isAuthenticated" to="/transactions" :class="['menu-item', { 'manual-active': isItemActive('/transactions') }]">
          <i class="pi pi-sync"></i>
          <span v-if="!isCollapsed || isMobile">Транзакції</span>
        </router-link>

        <router-link v-if="['Admin', 'Manager'].includes(userRole)" to="/reports" :class="['menu-item', { 'manual-active': isItemActive('/reports') }]">
          <i class="pi pi-chart-bar"></i>
          <span v-if="!isCollapsed || isMobile">Аналітика та звіти</span>
        </router-link>

        <router-link v-if="userRole === 'Admin'" to="/users" :class="['menu-item', { 'manual-active': isItemActive('/users') }]">
          <i class="pi pi-users"></i>
          <span v-if="!isCollapsed || isMobile">Персонал</span>
        </router-link>

        <router-link v-if="userRole === 'Admin'" to="/logs" :class="['menu-item', { 'manual-active': isItemActive('/logs') }]">
          <i class="pi pi-history"></i>
          <span v-if="!isCollapsed || isMobile">Журнал дій</span>
        </router-link>
      </nav>
    </aside>

    <div class="main-content">
      <header class="header">
        <div class="header-left">
          <Button icon="pi pi-bars" text severity="secondary" @click="toggleSidebar" />
        </div>
        
        <div class="header-right">
          <template v-if="isAuthenticated">
            <div class="user-profile-wrapper" @click="toggleMenu">
              <div class="user-details text-right hidden-mobile">
                <div v-if="authStore.user" class="user-name">
                  {{ authStore.user.firstName }} {{ authStore.user.lastName }}
                </div>
                <div class="user-role">{{ userRole }}</div>
              </div>
              <div class="user-avatar"><i class="pi pi-user"></i></div>
              <i class="pi pi-chevron-down text-xs ml-2 text-slate-400"></i>
            </div>
            <Menu ref="menu" :model="userMenuItems" :popup="true" />
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
.layout-container { display: flex; height: 100vh; overflow: hidden; position: relative; }

.sidebar { 
  width: 260px; 
  background: #1e293b; 
  color: white; 
  display: flex; 
  flex-direction: column; 
  transition: transform 0.3s ease, width 0.3s ease;
  flex-shrink: 0;
  z-index: 1000;
}

.sidebar.collapsed { width: 80px; }

.logo { 
  padding: 2rem; 
  font-weight: bold; 
  display: flex; 
  align-items: center; 
  gap: 12px; 
  font-size: 1.2rem; 
  border-bottom: 1px solid #334155;
  white-space: nowrap;
}

.menu-nav { padding: 1rem 0; flex: 1; overflow-x: hidden; }

.menu-item { 
  display: flex; 
  align-items: center; 
  gap: 16px; 
  padding: 1rem 1.5rem; 
  color: #cbd5e1; 
  text-decoration: none; 
  transition: all 0.2s;
  white-space: nowrap;
  border-right: 4px solid transparent; 
}

.sidebar.collapsed .menu-item { justify-content: center; padding: 1rem; gap: 0; }

.menu-item:hover { background: #334155; color: white; }

.manual-active { 
  background: #10b981 !important; 
  color: white !important; 
  border-right: 4px solid #fff !important; 
}

.main-content { flex: 1; display: flex; flex-direction: column; overflow-y: auto; background: #f1f5f9; min-width: 0; }

.header { 
  height: 64px; 
  background: white; 
  display: flex; 
  align-items: center; 
  justify-content: space-between; 
  padding: 0 1.5rem; 
  border-bottom: 1px solid #e2e8f0; 
  flex-shrink: 0;
}

.content-area { padding: 1.5rem; }

.user-profile-wrapper { display: flex; align-items: center; cursor: pointer; padding: 0.5rem; border-radius: 8px; }

.user-details { display: flex; flex-direction: column; align-items: flex-end; margin-right: 0.75rem; line-height: 1.2; }

.user-name { font-weight: 600; color: #1e293b; font-size: 0.9rem; }

.user-role { font-size: 0.75rem; color: #64748b; text-transform: uppercase; }

.user-avatar {
  width: 35px; height: 35px; background: #ecfdf5; color: #10b981; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; border: 1px solid #d1fae5;
}


@media (max-width: 768px) {
  .sidebar {
    position: absolute;
    height: 100%;
    left: 0;
    top: 0;
    box-shadow: 10px 0 15px -3px rgba(0, 0, 0, 0.1);
  }
  
  .mobile-hidden { transform: translateX(-100%); }
  
  .mobile-active { transform: translateX(0); }
  
  .sidebar-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
  }
  
  .hidden-mobile { display: none; }
  
  .content-area { padding: 1rem; }
  
  .header { padding: 0 1rem; }
}
</style>