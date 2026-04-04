<template>
  <div class="settings-root">
    <AdminHeader title="Configuración" />

    <div class="settings-container">
      <aside class="settings-nav">
        <nav class="nav-menu">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            :class="['nav-item', { active: activeTab === tab.id }]"
            @click="activeTab = tab.id"
          >
            <i :class="tab.icon"></i>
            <span>{{ tab.label }}</span>
          </button>
        </nav>
      </aside>

      <main class="settings-content">
        <Transition name="fade-slide" mode="out-in">
          
          <div v-if="activeTab === 'account'" class="tab-pane">
            <h2 class="pane-title">Mi Cuenta y Seguridad</h2>
            <p class="pane-desc">Administra tu identidad y el acceso administrativo al sistema.</p>
            
            <div class="pane-cards">
              <ProfileInfoCard :user="user" />
              <SecurityCard :isDefault="isDefaultPin" @change-pin="pinModalRef.open()" />
            </div>
          </div>

          <div v-else-if="activeTab === 'business'" class="tab-pane">
            <h2 class="pane-title">Datos del Negocio</h2>
            <p class="pane-desc">Información legal y visual que aparecerá en tus tickets y reportes.</p>
            
            <div class="pane-cards">
              <BusinessForm /> 
            </div>
          </div>

          <div v-else-if="activeTab === 'billing'" class="tab-pane">
            <h2 class="pane-title">Suscripción y Límites</h2>
            <p class="pane-desc">Revisa el estado de tu plan actual.</p>
            
            <div class="pane-cards">
              <SubscriptionCard :status="subscriptionStatus" :count="sucursales.length" />
            </div>
          </div>

        </Transition>
      </main>
    </div>

    <ChangePinModal ref="pinModalRef" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuth } from '@/composables/core/useAuth'
import { useSucursal } from '@/composables/admin/useSucursal'
import { useSubscription } from '@/composables/core/useSubscription'
import { store } from '@/store'

import AdminHeader from '@/components/admin/AdminHeader.vue'
import ProfileInfoCard from '@/components/profile/ProfileInfoCard.vue'
import SubscriptionCard from '@/components/profile/SubscriptionCard.vue'
import SecurityCard from '@/components/profile/SecurityCard.vue'
import BusinessForm from '@/components/profile/BusinessForm.vue'
import ChangePinModal from '@/components/profile/ChangePinModal.vue'

const { user } = useAuth()
const { sucursales } = useSucursal()
const { subscriptionStatus } = useSubscription()
const pinModalRef = ref(null)

const activeTab = ref('account')

const tabs = [
  { id: 'account', label: 'Cuenta y Seguridad', icon: 'pi pi-user' },
  { id: 'business', label: 'Datos del Negocio', icon: 'pi pi-shop' },
  { id: 'billing', label: 'Suscripción', icon: 'pi pi-sparkles' },
]

const isDefaultPin = computed(() => store.userProfile?.adminPin === '1234')
</script>

<style scoped>
.settings-root {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-surface-alt);
  min-height: 0;
}

.settings-container {
  flex: 1;
  display: flex;
  gap: 3rem;
  padding: 2rem 3rem;
  max-width: 1100px;
  margin: 0 auto;
  width: 100%;
  overflow-y: auto;
}

/* --- NAVEGACIÓN IZQUIERDA --- */
.settings-nav {
  width: 240px;
  flex-shrink: 0;
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  position: sticky;
  top: 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  font-size: 0.9rem;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-item:hover {
  background: rgba(15, 23, 42, 0.04);
  color: var(--color-primary);
}

.nav-item.active {
  background: var(--bg-app);
  color: var(--color-primary);
  box-shadow: var(--shadow-flat);
  font-weight: 700;
}

.nav-item i {
  font-size: 1rem;
}

/* --- CONTENIDO DERECHO --- */
.settings-content {
  flex: 1;
  min-width: 0; /* EL SALVAVIDAS ANTI-DESBORDE */
}

.pane-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-primary);
  margin: 0 0 0.5rem 0;
}

.pane-desc {
  color: var(--color-text-muted);
  font-size: 0.9rem;
  margin: 0 0 2rem 0;
}

.pane-cards {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 600px; /* Mantiene los formularios con un ancho legible */
}

/* Transición */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.fade-slide-enter-from { opacity: 0; transform: translateY(10px); }
.fade-slide-leave-to { opacity: 0; transform: translateY(-10px); }

/* Responsive */
@media (max-width: 850px) {
  .settings-container {
    flex-direction: column;
    gap: 1.5rem;
    padding: 1.5rem;
  }
  .settings-nav {
    width: 100%;
  }
  .nav-menu {
    flex-direction: row;
    overflow-x: auto;
    padding-bottom: 0.5rem;
  }
  .nav-item {
    white-space: nowrap;
  }
  .pane-cards {
    max-width: 100%;
  }
}
</style>