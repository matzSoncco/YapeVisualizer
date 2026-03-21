<template>
  <div class="loading-overlay-full">
    <ProgressSpinner strokeWidth="4" />
    <p>{{ mensaje }}</p>
  </div>
</template>

<script setup>
import ProgressSpinner from 'primevue/progressspinner'

defineProps({
  mensaje: {
    type: String,
    default: 'Sincronizando datos, por favor espera...',
  },
})
</script>

<style scoped>
.loading-overlay-full {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--bg-surface);
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.loading-overlay-full p {
  margin-top: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-size: 0.85rem;
  animation: pulse-text 2s infinite;
}

@keyframes pulse-text {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
