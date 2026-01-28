<template>
  <div class="profile-container">
    <Toast />
    <ConfirmDialog />

    <!-- Header -->
    <header class="profile-header">
      <Button
        label="Volver al Panel"
        icon="pi pi-arrow-left"
        @click="router.push('/admin')"
        outlined
      />
      <h1>Mi Perfil y Configuración</h1>
    </header>

    <div class="profile-grid">
      
      <!-- Sidebar -->
      <aside class="profile-sidebar">
        
        <!-- User Card -->
        <Card class="user-card">
          <template #content>
            <Avatar
              :label="userInitial"
              size="xlarge"
              shape="circle"
              style="background-color: var(--dark-jungle-green); color: white; width: 80px; height: 80px; font-size: 2rem;"
            />
            <h2 class="user-name">{{ userName }}</h2>
            <p class="user-email">{{ user?.email }}</p>
            <Tag value="Dueño de Negocio" severity="secondary" />
          </template>
        </Card>

        <!-- Subscription Card -->
        <Card class="subscription-card">
          <template #header>
            <div class="subscription-header">
              <h3>Estado de Suscripción</h3>
              <Tag 
                :value="subscriptionStatus.active ? 'ACTIVO' : 'SUSPENDIDO'"
                :severity="subscriptionStatus.active ? 'success' : 'danger'"
              />
            </div>
          </template>

          <template #content>
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
                <Badge 
                  :value="`${sucursales.length} / ${subscriptionStatus.limit}`"
                  :severity="sucursales.length >= subscriptionStatus.limit ? 'danger' : 'success'"
                />
              </div>
            </div>
          </template>

          <template #footer>
            <Button
              v-if="!subscriptionStatus.active"
              label="Reactivar Servicio"
              icon="pi pi-bolt"
              severity="warning"
              class="w-full"
            />
            <Button
              v-else
              label="Cancelar Suscripción"
              icon="pi pi-times"
              severity="danger"
              outlined
              class="w-full"
            />
          </template>
        </Card>
      </aside>

      <!-- Branches Section -->
      <main class="branches-section">
        <Card>
          <template #header>
            <div class="branches-header">
              <div class="branches-title">
                <i class="pi pi-building"></i>
                <h3>Mis Sucursales</h3>
              </div>
              <Button
                label="Nueva Sede"
                icon="pi pi-plus"
                @click="openModalCreation"
                size="small"
              />
            </div>
          </template>

          <template #content>
            <div v-if="sucursales.length === 0" class="empty-branches">
              <i class="pi pi-inbox" style="font-size: 3rem; color: var(--jet); opacity: 0.3;"></i>
              <p>No tienes sucursales registradas.</p>
              <p class="subtext">Agrega tu primera tienda para comenzar a monitorear.</p>
            </div>

            <div v-else class="branches-list">
              <Card 
                v-for="sucursal in sucursales" 
                :key="sucursal.id" 
                class="branch-item"
              >
                <template #content>
                  <div class="branch-content">
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
                      <Button
                        icon="pi pi-pencil"
                        @click="openModalEdit(sucursal)"
                        text
                        rounded
                        severity="secondary"
                      />
                      <Button
                        icon="pi pi-trash"
                        @click="deleteSucursalModal(sucursal.id)"
                        text
                        rounded
                        severity="danger"
                      />
                    </div>
                  </div>
                </template>
              </Card>
            </div>
          </template>
        </Card>
      </main>
    </div>

    <!-- Modal -->
    <Dialog
      v-model:visible="showModal"
      :header="isEditing ? 'Editar Sucursal' : 'Nueva Sucursal'"
      :modal="true"
      :closable="true"
      :style="{ width: '450px' }"
    >
      <div class="modal-form">
        <div class="form-group">
          <label for="nombre">Nombre de la Sede</label>
          <InputText
            id="nombre"
            v-model="form.nombre"
            placeholder="Ej. Tienda Centro"
            class="w-full"
          />
        </div>

        <div class="form-group">
          <label for="icono">Icono (Emoji)</label>
          <InputText
            id="icono"
            v-model="form.icono"
            placeholder="Ej. 🍕"
            class="w-full"
          />
        </div>
      </div>

      <template #footer>
        <Button
          label="Cancelar"
          icon="pi pi-times"
          @click="closeModal"
          severity="secondary"
          outlined
        />
        <Button
          label="Guardar"
          icon="pi pi-check"
          @click="handleSaveBranch"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { computed, ref, reactive } from 'vue';
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';
import { useSucursal } from '../composables/useSucursal';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { formatearFecha } from '@/utils/dates';
import { store } from '@/store';

import '@/assets/profile.css';

const router = useRouter();
const toast = useToast();
const confirm = useConfirm();
const { user } = useAuth();
const { sucursales, addSucursal, deleteSucursal } = useSucursal();

const showModal = ref(false);
const isEditing = ref(false); 
const form = reactive({ id: null, nombre: '', icono: '' });

const userName = computed(() => user.value?.displayName || 'Usuario');
const userInitial = computed(() => (user.value?.email || 'U').charAt(0).toUpperCase());

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

const closeModal = () => {
  showModal.value = false;
  isEditing.value = false;
  form.nombre = '';
  form.icono = '';
  form.id = null;
};

const openModalCreation = () => {
    const limite = subscriptionStatus.value.limit;
    const actual = sucursales.value.length;

    if (actual >= limite) {
        toast.add({
          severity: 'warn',
          summary: 'Límite alcanzado',
          detail: `Has alcanzado el límite de sedes (${actual}/${limite}). Actualiza tu plan.`,
          life: 4000
        });
        return;
    }

    form.id = null;
    form.nombre = '';
    form.icono = '';
    isEditing.value = false;
    showModal.value = true;
};

const openModalEdit = (sucursal) => {
  form.id = sucursal.id;
  form.nombre = sucursal.nombre;
  form.icono = sucursal.icono;
  isEditing.value = true;
  showModal.value = true;
};

const handleSaveBranch = async () => {
  if (!form.nombre.trim()) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'El nombre es obligatorio',
      life: 3000
    });
    return;
  }

  try {
    if (isEditing.value) {
      const sucursalRef = doc(db, 'users', user.value.uid, 'sucursales', form.id);
      await updateDoc(sucursalRef, {
        nombre: form.nombre,
        icono: form.icono || '🏪'
      });
      toast.add({
        severity: 'success',
        summary: 'Actualizado',
        detail: 'Sucursal actualizada correctamente',
        life: 3000
      });
    } else {
      await addSucursal({ nombre: form.nombre, icono: form.icono || '🏪' });
      toast.add({
        severity: 'success',
        summary: 'Creado',
        detail: 'Sucursal creada correctamente',
        life: 3000
      });
    }
    closeModal();
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: e.message,
      life: 3000
    });
  }
};

const deleteSucursalModal = (id) => {
  confirm.require({
    message: '¿Estás seguro de eliminar esta sucursal?',
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: { label: 'Cancelar', severity: 'secondary', outlined: true },
    acceptProps: { label: 'Eliminar', severity: 'danger' },
    accept: async () => {
      try {
        await deleteSucursal(id);
        toast.add({
          severity: 'success',
          summary: 'Eliminado',
          detail: 'Sucursal eliminada correctamente',
          life: 3000
        });
      } catch (e) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: e.message,
          life: 3000
        });
      }
    }
  });
};
</script>