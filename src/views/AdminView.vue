<template>
  <div class="admin-container">
    
    <header class="admin-topbar">
      <div class="brand-section">
        <button @click="volverAlDashboard" class="btn-back-dash">
          ← Volver al Dashboard
        </button>
        
        <div class="titles">
          <h1>PANEL DE ADMINISTRADOR</h1>
          <p class="greeting">👋 Hola, {{ userName }}</p>
        </div>
      </div>

      <div class="user-profile-container" ref="dropdownRef">
        <div class="avatar-circle" @click="toggleMenu">
          <span>{{ userInitial }}</span>
        </div>

        <div v-if="showMenu" class="profile-dropdown">
          <div class="dropdown-header">
            <p class="dd-name">{{ userName }}</p>
            <p class="dd-email">{{ user?.email }}</p>
          </div>
          <hr>
          <button @click="irAPerfil" class="dd-item">
            👤 Mi Perfil
          </button>
          <button @click="handleLogout" class="dd-item text-danger">
            🚪 Cerrar Sesión
          </button>
        </div>
      </div>
    </header>

    <section class="filters-bar">
       </section>
    <main class="data-section">
       </main>

  </div>
</template>

<script setup>
import { ref, computed, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';
import { useSucursal } from '../composables/useSucursal';
import '@/assets/admin.css';

const router = useRouter();
const { user, logOut } = useAuth();
const { limpiarSucursal } = useSucursal();

const showMenu = ref(false);
const dropdownRef = ref(null);
const reportes = ref([]);
const filters = ref({ startDate: '', endDate: '', branchId: '' });

const userName = computed(() => user.value?.displayName || 'Admin');
const userInitial = computed(() => (userName.value || 'A').charAt(0).toUpperCase());

/**
 * Cerrar el menú al hacer clic afuera
 */
onUnmounted(() => {
  document.removeEventListener('click', closeMenuOutside);
});

/**
 * Alternar el menú de perfil
 * @param e - Evento de clic
 */
const toggleMenu = (e) => { e.stopPropagation(); showMenu.value = !showMenu.value; };
const closeMenuOutside = (e) => { if (dropdownRef.value && !dropdownRef.value.contains(e.target)) showMenu.value = false; };

/**
 * Navegación al dashboard
 */
const volverAlDashboard = () => {
  limpiarSucursal();
  router.push('/dashboard');
};

/**
 * Navegación al perfil
 */
const irAPerfil = () => {
  router.push('/profile');
};

/**
 * Cerrar sesión
 */
const handleLogout = async () => {
  await logOut();
  limpiarSucursal();
  router.push('/');
};

// TODO: Implementar funcionalidad de reportes y filtros
</script>

<style scoped>
/* Estilo rápido para el botón de volver */
.btn-back-dash {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.3);
    color: white;
    padding: 5px 10px;
    border-radius: 5px;
    margin-right: 15px;
    cursor: pointer;
    font-size: 0.8rem;
}
.btn-back-dash:hover {
    background: rgba(255,255,255,0.1);
}
.brand-section {
    display: flex; 
    align-items: center;
}
</style>