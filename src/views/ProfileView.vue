<template>
  <div class="profile-container">
    <Toast />
    <ConfirmDialog />

    <header class="profile-header">
      <div class="header-left">
        <Button
          icon="pi pi-arrow-left"
          @click="router.push('/admin')"
          text
          rounded
          aria-label="Volver"
          v-tooltip.bottom="'Volver al Admin'"
        />
        <h1>Mi Perfil y Configuración</h1>
      </div>
    </header>

    <div class="profile-layout">
      
      <aside class="profile-sidebar">
        
        <Card class="profile-card user-info-card">
          <template #content>
            <div class="user-avatar-wrapper">
              <Avatar
                :label="userInitial"
                size="xlarge"
                shape="circle"
                class="user-avatar-lg"
              />
            </div>
            <div class="user-details">
              <h2 class="user-name">{{ userName }}</h2>
              <p class="user-email">{{ user?.email }}</p>
              <Tag value="Administrador" class="role-tag" rounded />
            </div>
          </template>
        </Card>

        <Card class="profile-card subscription-card">
          <template #header>
            <div class="card-header">
              <h3><i class="pi pi-sparkles"></i> Tu Plan</h3>
              <Tag 
                :value="subscriptionStatus.isActive ? 'ACTIVO' : 'INACTIVO'"
                :severity="subscriptionStatus.isActive ? 'success' : 'danger'"
                rounded
              />
            </div>
          </template>

          <template #content>
            <div class="plan-details">
              <div class="plan-row">
                <span class="lbl">Nivel Actual</span>
                <span class="val highlight">{{ subscriptionStatus.planName }}</span>
              </div>
              <div class="plan-row">
                <span class="lbl">{{ subscriptionStatus.labelFecha }}</span>
                <span class="val">{{ subscriptionStatus.fechaMostrar }}</span>
              </div>
              
              <div class="usage-meter">
                <div class="meter-labels">
                  <span class="lbl">Sucursales</span>
                  <span class="val" :class="{ 'limit-reached': sucursales.length >= subscriptionStatus.limitSucursales }">
                    {{ sucursales.length }} / {{ subscriptionStatus.limitSucursales }}
                  </span>
                </div>
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    :style="{ width: `${(sucursales.length / subscriptionStatus.limitSucursales) * 100}%` }"
                    :class="{ 'full': sucursales.length >= subscriptionStatus.limitSucursales }"
                  ></div>
                </div>
              </div>
            </div>
          </template>

          <template #footer>
            <div class="plan-actions">
                <Button
                v-if="!subscriptionStatus.isActive"
                label="Reactivar Servicio"
                icon="pi pi-bolt"
                severity="warning"
                class="btn-full"
                />
                <Button
                v-else
                label="Gestionar Suscripción"
                icon="pi pi-external-link"
                severity="secondary"
                outlined
                class="btn-full"
                />
            </div>
          </template>
        </Card>
      </aside>

      <main class="profile-main">
        <Card class="profile-card branches-card">
          <template #header>
            <div class="card-header">
              <div class="header-title">
                <i class="pi pi-building"></i>
                <h3>Mis Sucursales</h3>
              </div>
              <Button
                label="Nueva Sede"
                icon="pi pi-plus"
                @click="openModalCreation"
                :disabled="sucursales.length >= subscriptionStatus.limitSucursales"
                size="small"
              />
            </div>
          </template>

          <template #content>
            <div v-if="sucursales.length === 0" class="empty-state-branches">
              <div class="empty-icon">
                <i class="pi pi-shop"></i>
              </div>
              <h4>No tienes sucursales aún</h4>
              <p>Crea tu primera sede para empezar a vender.</p>
              <Button label="Crear Sede" icon="pi pi-plus" text @click="openModalCreation" />
            </div>

            <div v-else class="branches-grid">
              <div 
                v-for="sucursal in sucursales" 
                :key="sucursal.id" 
                class="branch-item-card"
              >
                <div class="branch-icon">
                    <span>{{ sucursal.icono || '🏪' }}</span>
                </div>
                <div class="branch-info">
                    <h4>{{ sucursal.nombre }}</h4>
                    <span class="branch-id">ID: {{ sucursal.id }}</span>
                </div>
                <div class="branch-actions">
                    <Button icon="pi pi-pencil" text rounded @click="openModalEdit(sucursal)" v-tooltip.top="'Editar'" />
                    <Button icon="pi pi-trash" text rounded severity="danger" @click="deleteSucursalModal(sucursal.id)" v-tooltip.top="'Eliminar'" />
                </div>
              </div>
            </div>
          </template>
        </Card>
      </main>
    </div>

    <Dialog
      v-model:visible="showModal"
      :header="isEditing ? 'Editar Sucursal' : 'Nueva Sucursal'"
      modal
      class="custom-dialog"
      :style="{ width: '400px' }"
      :draggable="false"
    >
      <div class="form-grid">
        <div class="form-field">
          <label for="nombre">Nombre de la Sede</label>
          <InputText id="nombre" v-model="form.nombre" placeholder="Ej. Tienda Centro" class="input-full" autofocus />
        </div>

        <div class="form-field">
          <label for="icono">Icono (Emoji)</label>
          <div class="emoji-input-wrapper">
             <InputText id="icono" v-model="form.icono" placeholder="Ej. 🍕" class="input-emoji" />
             <span class="helper-text">Usa una tecla (Windows + .) para abrir emojis</span>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-actions">
            <Button label="Cancelar" icon="pi pi-times" text @click="closeModal" severity="secondary" />
            <Button label="Guardar" icon="pi pi-check" @click="handleSaveBranch" :disabled="!form.nombre" />
        </div>
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
import { useSubscription } from '@/composables/useSubscription';

import '@/assets/profile.css';

const router = useRouter();
const toast = useToast();
const confirm = useConfirm();
const { user } = useAuth();
const { sucursales, addSucursal, deleteSucursal } = useSucursal();
const { subscriptionStatus } = useSubscription();

const showModal = ref(false);
const isEditing = ref(false); 
const form = reactive({ id: null, nombre: '', icono: '' });

const userName = computed(() => user.value?.displayName || 'Usuario');
const userInitial = computed(() => (user.value?.email || 'U').charAt(0).toUpperCase());

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