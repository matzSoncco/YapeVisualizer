<template>
  <div class="profile-container">
    <Toast />
    <ConfirmDialog />

    <header class="profile-header">
      <div class="header-left">
        <Button icon="pi pi-arrow-left" @click="router.push('/admin')" text rounded aria-label="Volver" v-tooltip.bottom="'Volver al Admin'" />
        <h1>Mi Perfil y Configuración</h1>
      </div>
    </header>

    <div class="profile-layout">
      
      <aside class="profile-sidebar">
        <Card class="profile-card user-info-card">
          <template #content>
            <div class="user-avatar-wrapper">
              <Avatar :label="userInitial" size="xlarge" shape="circle" class="user-avatar-lg" />
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
              <Tag :value="subscriptionStatus.isActive ? 'ACTIVO' : 'INACTIVO'" :severity="subscriptionStatus.isActive ? 'success' : 'danger'" rounded />
            </div>
          </template>
          <template #content>
            <p class="text-sm mt-2">Nivel: <b>{{ subscriptionStatus.planName }}</b></p>
            <p class="text-sm">Sedes: {{ sucursales.length }} / {{ subscriptionStatus.limitSucursales }}</p>
          </template>
        </Card>

        <Card class="profile-card security-card" :class="{ 'highlight-focus': isDefaultPin }" ref="securityCardRef">
          <template #header>
            <div class="card-header">
              <h3><i class="pi pi-shield"></i> Seguridad</h3>
            </div>
          </template>
          <template #content>
            <div class="security-content">
              <p class="text-sm text-gray-500 mb-3">Control de acceso administrativo</p>
              
              <div v-if="isDefaultPin" class="pin-warning-box">
                <i class="pi pi-exclamation-triangle"></i>
                <span>Tu PIN es inseguro (Default).</span>
              </div>

              <Button label="Cambiar PIN" icon="pi pi-key" severity="secondary" outlined class="w-full" @click="pinModalRef.open()" />
            </div>
          </template>
        </Card>
      </aside>

      <main class="profile-main">
        
        <Card class="profile-card brand-card mb-4">
          <template #header>
            <div class="card-header">
              <h3><i class="pi pi-image"></i> Identidad del Negocio</h3>
              <Button label="Editar Marca" icon="pi pi-pencil" text @click="businessModalRef?.open()" />
            </div>
          </template>
          <template #content>
            <div class="flex align-items-center gap-4 py-2">
              <Avatar :image="store.userProfile?.businessProfile?.logoUrl" size="xlarge" shape="circle" class="border-1 border-300" />
              <div>
                <h4 class="m-0 text-xl">{{ store.userProfile?.businessProfile?.name || 'Nombre no configurado' }}</h4>
                <p class="text-sm text-gray-500 m-0 mt-1">Este logo y nombre aparecerán en tus notas de venta.</p>
              </div>
            </div>
          </template>
        </Card>

        <Card class="profile-card branches-card">
          <template #header>
            <div class="card-header">
              <div class="header-title">
                <i class="pi pi-building"></i>
                <h3>Mis Sucursales</h3>
              </div>
              <Button label="Nueva Sede" icon="pi pi-plus" @click="handleOpenCreation" :disabled="subscriptionStatus.isHardBlocked || sucursales.length >= subscriptionStatus.limitSucursales" size="small" />
            </div>
          </template>

          <template #content>
            <div v-if="sucursales.length === 0" class="empty-state-branches">
              <div class="empty-icon"><i class="pi pi-shop"></i></div>
              <h4>No tienes sucursales aún</h4>
              <Button label="Crear Sede" icon="pi pi-plus" text @click="handleOpenCreation" />
            </div>

            <div v-else class="branches-grid">
              <div v-for="sucursal in sucursales" :key="sucursal.id" class="branch-item-card">
                <div class="branch-icon"><span>{{ sucursal.icono || '🏪' }}</span></div>
                <div class="branch-info">
                  <h4>{{ sucursal.nombre }}</h4>
                  <span class="text-xs text-gray-500">Serie: {{ sucursal.serie || 'NV01' }}</span>
                </div>
                <div class="branch-actions">
                  <Button v-if="!subscriptionStatus.isHardBlocked" icon="pi pi-pencil" text rounded @click="sucursalModalRef.open(sucursal)" v-tooltip.top="'Editar'" />
                  <Button v-if="!subscriptionStatus.isHardBlocked" icon="pi pi-trash" text rounded severity="danger" @click="deleteSucursalModal(sucursal.id)" v-tooltip.top="'Eliminar'" />
                </div>
              </div>
            </div>
          </template>
        </Card>
      </main>
    </div>

    <ChangePinModal ref="pinModalRef" />
    <SucursalModal ref="sucursalModalRef" />
    <BusinessConfigModal ref="businessModalRef" />
    </div>
</template>

<script setup>
import { computed, ref, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';
import { useSucursal } from '../composables/useSucursal';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { useSubscription } from '@/composables/useSubscription';
import { store } from '@/store';

import ChangePinModal from '@/components/profile/ChangePinModal.vue';
import SucursalModal from '@/components/profile/SucursalModal.vue';
import BusinessConfigModal from '@/components/profile/BusinessConfigModal.vue';

import '@/assets/profile.css';

const router = useRouter();
const toast = useToast();
const confirm = useConfirm();
const { user } = useAuth();
const { sucursales, deleteSucursal } = useSucursal();
const { subscriptionStatus } = useSubscription();

const pinModalRef = ref(null);
const sucursalModalRef = ref(null);
const businessModalRef = ref(null);

const securityCardRef = ref(null);
const isDefaultPin = computed(() => store.userProfile?.adminPin === '1234');
const userName = computed(() => user.value?.displayName || 'Usuario');
const userInitial = computed(() => (user.value?.email || 'U').charAt(0).toUpperCase());

onMounted(async () => {
  if (store.userProfile?.adminPin === '1234') {
    await nextTick();
    securityCardRef.value?.$el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
});

/**
 * Funcion para manejar la creación de una nueva sucursal
 * Valida el límite de sucursales según el plan de suscripción antes de abrir el modal
 */
const handleOpenCreation = () => {
  const limite = subscriptionStatus.value.limitSucursales;
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
  
  sucursalModalRef.value.open();
};

/**
 * Funcion para manejar la eliminación de una sucursal con confirmación
 * @param id - ID de la sucursal a eliminar
 */
const deleteSucursalModal = (id) => {
  confirm.require({
    message: '¿Estás seguro de eliminar esta sucursal? Se perderá el acceso a sus ventas.',
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: { label: 'Cancelar', severity: 'secondary', outlined: true },
    acceptProps: { label: 'Eliminar', severity: 'danger' },
    accept: async () => {
      try {
        await deleteSucursal(id);
        toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Sucursal eliminada correctamente', life: 3000 });
      } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 5000 });
      }
    }
  });
};
</script>