<template>
  <router-view />
</template>

<style>
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background-color: #f1f5f9;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  height: 100%;
  width: 100%;
}

* {
  box-sizing: border-box;
}

@media (max-width: 768px) {
  .content-area {
    padding: 1rem !important;
  }
  
  .p-button {
    touch-action: manipulation;
  }
}
</style>