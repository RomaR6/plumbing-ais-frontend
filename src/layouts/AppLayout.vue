<template>
  <div class="layout-wrapper">
    <aside class="layout-sidebar">
      <div class="sidebar-header">
        <h3>Plumbing AIS</h3>
      </div>
      <nav>
        <router-link to="/">📦 Товари</router-link>
        <router-link to="/stocks">🏬 Склад</router-link>
      </nav>
    </aside>

    <main class="layout-main">
      <header class="layout-header">
        <span>Адмін-панель</span>
      </header>
      <div class="layout-content">
        <router-view /> </div>
    </main>
  </div>
</template>

<style scoped>
.layout-wrapper { display: flex; min-height: 100vh; }
.layout-sidebar { width: 250px; background: #1e293b; color: white; padding: 1rem; }
.layout-main { flex: 1; display: flex; flex-direction: column; background: #f8f9fa; }
.layout-header { height: 60px; background: white; border-bottom: 1px solid #ddd; display: flex; align-items: center; padding: 0 2rem; }
.layout-content { padding: 2rem; }
nav a { display: block; color: #cbd5e1; text-decoration: none; padding: 0.75rem 0; }
nav a.router-link-active { color: white; font-weight: bold; }
</style>