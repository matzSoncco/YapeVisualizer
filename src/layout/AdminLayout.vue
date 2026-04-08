<template>
  <div class="admin-layout">
    <AdminSidebar />
    <main class="admin-main">
      <router-view v-slot="{ Component }">
        <transition name="fade-slide" mode="out-in">
              <component :is="Component" class="admin-view" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup>
import AdminSidebar from '@/components/admin/AdminSidebar.vue'
</script>

<style scoped>
.admin-layout {
  display: flex;
  height: 100vh;
  height: 100dvh;
  width: 100%;
  overflow: hidden;
  background: var(--bg-surface-alt);
}

.admin-main {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-surface-alt);
}

:deep(.admin-view) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(8px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}
</style>
