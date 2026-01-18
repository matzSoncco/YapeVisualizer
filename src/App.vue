<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <RouterView />
</template>

<style>
/* Estilos globales para resetear márgenes y fuentes */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

body {
  overflow-x: hidden;
}

#app {
  min-height: 100vh;
}
</style>