<template>
  <div class="productos-view-root">
    <AdminHeader title="Gestión de Inventario" />

    <main class="productos-container">
      <AdminInventory />
    </main>
  </div>
</template>

<script setup>
import AdminHeader from '@/components/admin/AdminHeader.vue'
import AdminInventory from '@/components/admin/AdminInventory.vue'
</script>

<style scoped>
.productos-view-root {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-surface-alt, #f8fafc);
  min-height: 0;
}

.productos-container {
  flex: 1;
  padding: 1.5rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  overflow-y: auto;
}
</style>