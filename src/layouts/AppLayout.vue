<template>
  <div class="layout-container">
    <aside class="sidebar">
      <div class="logo">
        <i class="pi pi-box" style="font-size: 1.5rem"></i>
        <span>AIS Plumbing</span>
      </div>
      
      <nav class="menu">
        <router-link to="/" class="menu-item">
          <i class="pi pi-list"></i> <span>Товари</span>
        </router-link>
        <router-link to="/stocks" class="menu-item">
          <i class="pi pi-map"></i> <span>Склад</span>
        </router-link>
      </nav>
    </aside>

    <div class="main-content">
      <header class="header">
        <div class="header-left">
          <i class="pi pi-bars"></i>
        </div>
        <div class="header-right">
          <i class="pi pi-user"></i>
          <span>Адміністратор</span>
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
.menu { padding: 1rem 0; flex: 1; }
.menu-item { display: flex; align-items: center; gap: 12px; padding: 1rem 2rem; color: #cbd5e1; text-decoration: none; transition: 0.3s; }
.menu-item:hover { background: #334155; color: white; }
.menu-item.router-link-active { background: #10b981; color: white; border-right: 4px solid #fff; }
.main-content { flex: 1; display: flex; flex-direction: column; overflow-y: auto; background: #f1f5f9; }
.header { height: 64px; background: white; display: flex; align-items: center; justify-content: space-between; padding: 0 2rem; border-bottom: 1px solid #e2e8f0; }
.content-area { padding: 2rem; }
</style>