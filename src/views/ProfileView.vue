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
              <span>{{ subscriptionStatus.labelFecha }}:</span>
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
            <button @click="openModalCreation" class="btn-primary-sm">
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
                <button @click="openModalEdit(sucursal)" class="action-btn edit" title="Editar">
                  ✏️
                </button>
                <button @click="deleteSucursalModal(sucursal.id)" class="action-btn delete" title="Eliminar">
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
import { computed, ref, reactive } from 'vue';
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';
import { useSucursal } from '../composables/useSucursal';
import { formatearFecha } from '@/utils/dates';
import { store } from '@/store';
import '@/assets/admin.css'; 
import '@/assets/profile.css';

const router = useRouter();
const { user } = useAuth();
const { sucursales, addSucursal, deleteSucursal } = useSucursal();

const showModal = ref(false);
const isEditing = ref(false); 
const form = reactive({ id: null, nombre: '', icono: '' });

const userName = computed(() => user.value?.displayName || 'Usuario');
const userInitial = computed(() => (user.value?.email || 'U').charAt(0).toUpperCase());

/**
 * Estado de la suscripción del usuario
 * @return {Object} Información de la suscripción del usuario
 */
const subscriptionStatus = computed(() => {
  const sub = store.userProfile.subscription || {};
  
  let fechaMostrar = 'N/A';
  let etiqueta = 'Próximo cobro';

  if (sub.status === 'trial' && sub.trialEndDate) {
      fechaMostrar = formatearFecha(sub.trialEndDate);
      etiqueta = 'Fin de prueba';
  } else if (sub.nextBillingDate) {
      fechaMostrar = formatearFecha(sub.nextBillingDate);
  }

  const isVisuallyActive = sub.isActive && (sub.status === 'active' || sub.status === 'trial');

  return {
    active: isVisuallyActive,
    plan: sub.planName || 'Cargando...',
    limit: sub.limitSucursales || 0,
    nextBilling: fechaMostrar,
    labelFecha: etiqueta
  };
});

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
 * Abre el modal de creación SOLO si el usuario tiene cupo.
 */
const openModalCreation = () => {
    const limite = subscriptionStatus.value.limit;
    const actual = sucursales.value.length;

    if (actual >= limite) {
        // Alerta de prueba
        // TODO: Mejorar con un modal para UX más amigable
        alert(`Has alcanzado el límite de sedes permitidas (${actual}/${limite}). Por favor, actualiza tu plan para agregar más sedes.`);
        return;
    }

    form.id = null;
    form.nombre = '';
    form.icono = '';
    isEditing.value = false;
    showModal.value = true;
};

/**
 * Inicia la edición de una sucursal
 * @param {Object} sucursal - sucursal a editar
 */
const openModalEdit = (sucursal) => {
  form.id = sucursal.id;
  form.nombre = sucursal.nombre;
  form.icono = sucursal.icono;
  isEditing.value = true;
  showModal.value = true;
};

/**
 * Guarda una nueva sucursal o actualiza una existente
 */
const handleSaveBranch = async () => {
  if (!form.nombre.trim()) return;

  try {
    if (isEditing.value) {
      const sucursalRef = doc(db, 'users', user.value.uid, 'sucursales', form.id);
      await updateDoc(sucursalRef, {
        nombre: form.nombre,
        icono: form.icono || '🏪'
      });
    } else {
      await addSucursal({ nombre: form.nombre, icono: form.icono || '🏪' });
    }
    closeModal();
  } catch (e) {
    alert("Error al guardar: " + e.message);
  }
};

/**
 * Elimina una sucursal
 * @param {String} id - ID de la sucursal a eliminar
 */
const deleteSucursalModal = async (id) => {
  if (confirm('¿Estás seguro de eliminar esta sucursal?')) {
    try {
      await deleteSucursal(id);
    } catch (e) {
      alert(e.message);
    }
  }
};
</script>