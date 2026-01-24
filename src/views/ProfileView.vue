<template>
  <div class="admin-container">
    
    <header class="profile-header">
      <button @click="router.push('/admin')" class="btn-back">
        ← Volver al Panel
      </button>
      <h1>Mi Perfil y Configuración</h1>
    </header>

    <div class="profile-grid">
      
      <aside class="profile-sidebar space-y-6">
        
        <div class="card user-card">
          <div class="user-avatar-large">
            {{ userInitial }}
          </div>
          <h2 class="user-name">{{ userName }}</h2>
          <p class="user-email">{{ user?.email }}</p>
          <div class="user-role-badge">Dueño de Negocio</div>
        </div>

        <div class="card subscription-card">
          <div class="card-header">
            <h3>Estado de Suscripción</h3>
            <span :class="['status-badge', subscriptionStatus.active ? 'active' : 'suspended']">
              {{ subscriptionStatus.active ? 'ACTIVO' : 'SUSPENDIDO' }}
            </span>
          </div>
          
          <div class="sub-details">
            <div class="detail-row">
              <span>Plan Actual:</span>
              <strong>{{ subscriptionStatus.plan }}</strong>
            </div>
            <div class="detail-row">
              <span>Próximo cobro:</span>
              <span>{{ subscriptionStatus.nextBilling }}</span>
            </div>
            <div class="detail-row">
              <span>Límite de Sedes:</span>
              <span>{{ sucursales.length }} / {{ subscriptionStatus.limit }}</span>
            </div>
          </div>

          <div class="sub-actions">
            <button v-if="!subscriptionStatus.active" class="btn-reactivate">
              ⚡ Reactivar Servicio
            </button>
            <button v-else class="btn-outline-danger">
              Cancelar Suscripción
            </button>
          </div>
        </div>
      </aside>

      <main class="branches-section">
        <div class="card">
          <div class="card-header-action">
            <h3>🏢 Mis Sucursales</h3>
            <button @click="showModal = true" class="btn-primary-sm">
              + Nueva Sede
            </button>
          </div>

          <div class="branches-list">
            <div v-for="sucursal in sucursales" :key="sucursal.id" class="branch-item">
              <div class="branch-info">
                <div class="branch-icon-wrapper">
                  {{ sucursal.icono || '🏪' }}
                </div>
                <div>
                  <h4 class="branch-title">{{ sucursal.nombre }}</h4>
                  <p class="branch-id">ID: {{ sucursal.id }}</p>
                </div>
              </div>
              
              <div class="branch-actions">
                <button @click="editarSucursal(sucursal)" class="action-btn edit" title="Editar">
                  ✏️
                </button>
                <button @click="eliminarSucursal(sucursal.id)" class="action-btn delete" title="Eliminar">
                  🗑️
                </button>
              </div>
            </div>

            <div v-if="sucursales.length === 0" class="empty-branches">
              <p>No tienes sucursales registradas.</p>
              <p class="subtext">Agrega tu primera tienda para comenzar a monitorear.</p>
            </div>
          </div>
        </div>
      </main>

    </div>

    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content">
        <h3>{{ isEditing ? 'Editar Sucursal' : 'Nueva Sucursal' }}</h3>
        <form @submit.prevent="handleSaveBranch">
          <div class="form-group">
            <label>Nombre de la Sede</label>
            <input v-model="form.nombre" type="text" class="input-control w-full" required placeholder="Ej. Tienda Centro" />
          </div>
          <div class="form-group">
            <label>Icono (Emoji)</label>
            <input v-model="form.icono" type="text" class="input-control w-full" placeholder="Ej. 🍕" />
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn-secondary">Cancelar</button>
            <button type="submit" class="btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed, onUnmounted, watch, ref, reactive } from 'vue';
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';
import { useSucursal } from '../composables/useSucursal';
import '@/assets/admin.css'; 
import '@/assets/profile.css';

const router = useRouter();
const { user } = useAuth();
const { sucursales, addSucursal, deleteSucursal } = useSucursal();

const showModal = ref(false);
const isEditing = ref(false); 
const form = reactive({ id: null, nombre: '', icono: '' });

/**
 * Estado de suscripción del usuario
 */
const subscriptionStatus = ref({
  active: false,
  plan: 'Cargando información...',
  nextBilling: '--',
  limit: 0
});

let unsubUserListener = null;

/**
 * Formatea una fecha ISO a formato legible
 * @param {String} fechaISO - fecha en formato ISO
 */
// TODO: Mover a un utilitario común
const formatearFecha = (fechaISO) => {
  if (!fechaISO) return 'Indefinido';
  const fecha = new Date(fechaISO + 'T12:00:00'); 
  return fecha.toLocaleDateString('es-PE', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
};

/**
 * Observa cambios en el usuario autenticado para actualizar estado de suscripción
 * @param {Object} newUser - nuevo usuario autenticado
 */
watch(user, (newUser) => {
  if (unsubUserListener) {
    unsubUserListener();
    unsubUserListener = null;
  }

  if (newUser?.uid) {
    const userRef = doc(db, 'users', newUser.uid);
    
    unsubUserListener = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const sub = data.subscription || {};

        let fechaMostrar = 'N/A';
        if (sub.nextBillingDate) {
            fechaMostrar = formatearFecha(sub.nextBillingDate);
        } else if (sub.trialEndDate) {
            fechaMostrar = formatearFecha(sub.trialEndDate) + ' (Fin de prueba)';
        }

        subscriptionStatus.value = {
          active: sub.active || false,
          plan: sub.plan || 'Plan Gratuito',
          limit: sub.limitSucursales || 1,
          nextBilling: fechaMostrar
        };
      }
    });
  }
}, { immediate: true });

/**
 * Limpia el listener al desmontar el componente
 */
onUnmounted(() => {
  if (unsubUserListener) unsubUserListener();
});
const userName = computed(() => user.value?.displayName || 'Usuario');
const userInitial = computed(() => (user.value?.email || 'U').charAt(0).toUpperCase());

/**
 * Cierra el modal de creación/edición de sucursal
 */
const closeModal = () => {
  showModal.value = false;
  isEditing.value = false;
  form.nombre = '';
  form.icono = '';
  form.id = null;
};

/**
 * Guarda una nueva sucursal o actualiza una existente
 */
const handleSaveBranch = async () => {
  if (!form.nombre.trim()) return;

  try {
    if (isEditing.value) {
      // TODO: Implementar logica de edición de sucursal
    } else {
      await addSucursal({ nombre: form.nombre, icono: form.icono || '🏪' });
    }
    closeModal();
  } catch (e) {
    alert("Error: " + e.message);
  }
};

/**
 * Inicia la edición de una sucursal
 * @param {Object} sucursal - sucursal a editar
 */
const editarSucursal = (sucursal) => {
  form.id = sucursal.id;
  form.nombre = sucursal.nombre;
  form.icono = sucursal.icono;
  isEditing.value = true;
  showModal.value = true;
};

/**
 * Elimina una sucursal
 * @param {String} id - ID de la sucursal a eliminar
 */
const eliminarSucursal = async (id) => {
  if (confirm('¿Estás seguro de eliminar esta sucursal?')) {
    try {
      await deleteSucursal(id);
    } catch (e) {
      alert(e.message);
    }
  }
};
</script>