<template>
  <div class="branches-view-root">
    <AdminHeader title="Gestión de Sedes" />

    <main class="branches-container">
      <div class="branches-card">
        <div class="card-header">
          <div class="card-header-title">
            <i class="pi pi-building" />
            <h2>Mis Sucursales</h2>
          </div>
          <button class="btn-new" :disabled="isAtLimit" @click="openCreateModal">
            <i class="pi pi-plus" /> Nueva sede
          </button>
        </div>

        <div class="branches-body">
          <div v-if="sucursales.length === 0" class="empty-state">
            <div class="empty-icon">🏪</div>
            <p class="empty-title">Sin sucursales aún</p>
            <p class="empty-sub">Crea tu primera sede para empezar a operar.</p>
            <button class="btn-new-empty" @click="openCreateModal">
              <i class="pi pi-plus" /> Crear primera sede
            </button>
          </div>

          <template v-else>
            <div class="branches-list">
              <div v-for="sucursal in sucursales" :key="sucursal.id" class="branch-row">
                <div class="branch-icon">{{ sucursal.icono || '🏪' }}</div>

                <div class="branch-info">
                  <span class="branch-name">{{ sucursal.nombre }}</span>
                  <span class="branch-serie">Serie: {{ sucursal.serie || 'NV001' }}</span>
                </div>

                <div v-if="!subscriptionStatus.isHardBlocked" class="branch-actions">
                  <button class="action-btn" @click="openEditModal(sucursal)" title="Editar sede">
                    <i class="pi pi-pencil" />
                  </button>
                  <button
                    class="action-btn danger"
                    @click="confirmDelete(sucursal.id)"
                    title="Eliminar sede"
                  >
                    <i class="pi pi-trash" />
                  </button>
                </div>
              </div>
            </div>

            <div class="usage-footer">
              <span class="usage-text">
                {{ sucursales.length }} de {{ subscriptionStatus.limitSucursales }} sedes utilizadas
              </span>
              <div class="usage-track">
                <div
                  class="usage-fill"
                  :style="{ width: `${usagePercent}%` }"
                  :class="usageFillClass"
                />
              </div>
            </div>
          </template>
        </div>
      </div>
    </main>

    <SucursalModal ref="sucursalModalRef" />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { useSucursal } from '@/composables/admin/useSucursal'
import { useSubscription } from '@/composables/core/useSubscription'

import AdminHeader from '@/components/admin/AdminHeader.vue'
import SucursalModal from '@/components/profile/SucursalModal.vue'

// Consumimos directamente de los composables, sin props
const { sucursales, deleteSucursal } = useSucursal()
const { subscriptionStatus } = useSubscription()

const confirm = useConfirm()
const toast = useToast()
const sucursalModalRef = ref(null)

const isAtLimit = computed(
  () =>
    subscriptionStatus.value.isHardBlocked ||
    sucursales.value.length >= subscriptionStatus.value.limitSucursales,
)

const usagePercent = computed(() =>
  Math.min((sucursales.value.length / subscriptionStatus.value.limitSucursales) * 100, 100),
)

const usageFillClass = computed(() => {
  if (usagePercent.value >= 100) return 'fill-danger'
  if (usagePercent.value >= 75) return 'fill-warning'
  return 'fill-ok'
})

// Controladores del Modal
const openCreateModal = () => {
  if (isAtLimit.value) {
    toast.add({ severity: 'warn', summary: 'Límite alcanzado', detail: 'Actualiza tu plan.' })
    return
  }
  sucursalModalRef.value.open()
}

const openEditModal = (sucursal) => {
  sucursalModalRef.value.open(sucursal)
}

const confirmDelete = (id) => {
  confirm.require({
    message: '¿Eliminar esta sucursal? Se perderá el acceso a sus ventas registradas.',
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Eliminar',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await deleteSucursal(id)
        toast.add({ severity: 'success', summary: 'Sucursal eliminada', life: 3000 })
      } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: e.message })
      }
    },
  })
}
</script>

<style scoped>
/* Contenedor Principal de la Vista */
.branches-view-root {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-surface-alt);
  min-height: 0;
}

.branches-container {
  flex: 1;
  padding: 2rem 3rem;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
  overflow-y: auto;
}

/* La Tarjeta Principal */
.branches-card {
  background: var(--bg-app);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

/* -- Header -- */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.5);
}

.card-header-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.card-header-title i {
  font-size: 1.25rem;
  color: var(--color-text-muted);
}

.card-header-title h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--color-text-main);
}

.btn-new {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  background: var(--color-primary);
  color: var(--color-accent);
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-new:hover:not(:disabled) {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
}

.btn-new:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

/* -- Body -- */
.branches-body {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* El resto de tu CSS se mantiene intacto porque está excelente */
/* Solo agrégale los estilos de .empty-state, .branch-row, .branch-actions, y .usage-footer que ya tenías */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem 1rem;
  text-align: center;
}
.empty-icon {
  font-size: 3.5rem;
  opacity: 0.25;
  line-height: 1;
}
.empty-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--color-text-main);
}
.empty-sub {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text-muted);
}
.btn-new-empty {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 1rem;
  padding: 0.6rem 1.25rem;
  background: transparent;
  color: var(--color-primary);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-new-empty:hover {
  background: var(--color-primary);
  color: var(--color-accent);
  border-color: var(--color-primary);
}

.branches-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}
.branch-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-surface-alt);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}
.branch-row:hover {
  border-color: var(--color-primary-mid);
  background: var(--bg-app);
  box-shadow: var(--shadow-flat);
}
.branch-icon {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  background: var(--bg-app);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}
.branch-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}
.branch-name {
  font-size: 1rem;
  font-weight: 800;
  color: var(--color-text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.branch-serie {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  font-family: monospace;
}
.branch-actions {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
}
.action-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.2s ease;
}
.action-btn:hover {
  background: var(--bg-surface);
  color: var(--color-text-main);
}
.action-btn.danger:hover {
  background: var(--color-error-soft);
  color: var(--color-error-dark);
}

.usage-footer {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 1.5rem;
  margin-top: 1rem;
  border-top: 1px solid var(--color-border);
}
.usage-text {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-muted);
}
.usage-track {
  width: 100%;
  height: 6px;
  background: var(--color-border);
  border-radius: 99px;
  overflow: hidden;
}
.usage-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.5s ease;
}
.fill-ok {
  background: var(--color-success);
}
.fill-warning {
  background: var(--color-warning);
}
.fill-danger {
  background: var(--color-error);
}
</style>
