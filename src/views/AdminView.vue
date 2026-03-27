<template>
  <div class="admin-view-container">
    <header class="admin-toolbar">
      <div class="toolbar-left">
        <Button
          v-for="tab in tabs"
          :key="tab.id"
          :label="tab.label"
          :icon="tab.icon"
          :severity="activeTab === tab.id ? 'primary' : 'secondary'"
          :outlined="activeTab !== tab.id"
          @click="activeTab = tab.id"
          size="small"
        />
      </div>

      <div class="toolbar-right">
        <DatePicker
          v-model="filters.startDate"
          dateFormat="dd/mm"
          placeholder="Inicio"
          class="compact-date"
        />
        <span class="date-sep">—</span>
        <DatePicker
          v-model="filters.endDate"
          dateFormat="dd/mm"
          placeholder="Fin"
          class="compact-date"
        />
        <Select
          v-model="filters.branchId"
          :options="sedeOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Sede"
          class="compact-select"
        />
        <Button
          icon="pi pi-refresh"
          @click="handleSearch"
          :loading="loadingReportes"
          v-tooltip.top="'Actualizar'"
          text
          rounded
        />
      </div>
    </header>

    <section class="admin-viewport">
      <Transition name="fade-slide" mode="out-in">
        <div :key="activeTab" class="view-wrapper">
          <div v-if="activeTab === 'overview'" class="view-content">
            <AdminStats :kpis="kpis" />
            <div class="charts-card">
              <AdminCharts :salesData="salesChartData" :branchData="branchChartData" />
            </div>
          </div>

          <div v-else-if="activeTab === 'charts'" class="view-content">
            <AdminCharts :salesData="salesChartData" :branchData="branchChartData" />
          </div>

          <div v-else-if="activeTab === 'table'" class="view-content">
            <AdminTable :data="reportes" :loading="loadingReportes" @ver-detalle="verDetalle" />
          </div>
        </div>
      </Transition>
    </section>
    <CierreDetailModal v-model:visible="isDetailVisible" :data="selectedCierre" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSucursal } from '@/composables/admin/useSucursal'
import { useAdmin } from '@/composables/admin/useAdmin'
import { useToast } from 'primevue/usetoast'
import { store } from '@/store'

import AdminTable from '@/components/admin/AdminTable.vue'
import AdminStats from '@/components/admin/AdminStats.vue'
import AdminCharts from '@/components/admin/AdminCharts.vue'
import CierreDetailModal from '@/components/admin/modals/CierreDetailModal.vue'

const router = useRouter()
const toast = useToast()
const { sucursales } = useSucursal()
const { reportes, loadingReportes, buscarCuadres, kpis, salesChartData, branchChartData } =
  useAdmin()

const activeTab = ref('overview')
const isDetailVisible = ref(false)
const selectedCierre = ref(null)

const tabs = [
  { id: 'overview', label: 'Resumen', icon: 'pi pi-th-large' },
  { id: 'charts', label: 'Análisis', icon: 'pi pi-chart-line' },
  { id: 'table', label: 'Cierres', icon: 'pi pi-history' },
]

const filters = ref({
  startDate: new Date(),
  endDate: new Date(),
  branchId: '',
})

const sedeOptions = computed(() => [
  { label: 'Todas las sedes', value: '' },
  ...sucursales.value.map((s) => ({ label: s.nombre, value: s.id })),
])

const handleSearch = () => buscarCuadres(filters.value)

const verDetalle = (data) => {
  selectedCierre.value = data
  isDetailVisible.value = true
}

/**
 * TODO: Al montar, verificar, comparando con el backend
 * si el admin tiene un PIN por defecto (ej. '1234')
 * y forzar a cambiarlo antes de acceder.
 * Esto es crucial para la seguridad, ya que muchos podrían
 * olvidar cambiar su PIN después de crear su cuenta.
 * - Si el PIN es por defecto, mostrar un toast de advertencia y redirigir al perfil para cambiarlo.
 * - Si el PIN es seguro, cargar los datos normalmente.
 */

onMounted(() => {
  if (store.userProfile?.adminPin === '1234') {
    toast.add({
      severity: 'warn',
      summary: 'Acción Requerida',
      detail: 'Por seguridad, debes cambiar tu PIN antes de administrar.',
      life: 6000,
    })
    router.push('/admin/profile')
    return
  }
  handleSearch()
})
</script>

<style scoped>
.admin-view-container {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── Toolbar ── */
.admin-toolbar {
  height: 64px;
  background: var(--bg-app);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  gap: 1rem;
  flex-shrink: 0;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

/* ── Filtros en píldora ── */
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 3px 6px 3px 10px;
  transition:
    border-color 0.2s,
    background 0.2s;
  flex-shrink: 0;
}

.toolbar-right:hover {
  border-color: var(--color-primary-mid);
  background: var(--bg-app);
}

.date-sep {
  color: var(--color-border);
  font-size: 0.75rem;
  user-select: none;
  padding: 0 2px;
}

/* Datepicker compacto */
.compact-date :deep(.p-inputtext) {
  background: transparent;
  border: none;
  box-shadow: none;
  color: var(--color-primary-mid);
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.4rem 0.25rem;
  width: 68px;
  text-align: center;
}

.compact-date :deep(.p-inputtext:focus) {
  color: var(--color-primary);
}

/* Select compacto */
.compact-select :deep(.p-select) {
  background: transparent;
  border: none;
  border-left: 1px solid var(--color-border);
  border-radius: 0;
  box-shadow: none;
}

.compact-select :deep(.p-select-label) {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-primary-mid);
  padding: 0.25rem 0.5rem;
}

.compact-select :deep(.p-select-dropdown) {
  width: 1.5rem;
  color: var(--color-text-muted);
}

/* Botón refresh */
.toolbar-right :deep(.p-button.p-button-icon-only) {
  width: 30px;
  height: 30px;
  color: var(--color-text-muted);
  border-radius: var(--radius-xl);
}

.toolbar-right :deep(.p-button:hover) {
  background: var(--color-border);
  color: var(--color-primary);
}

/* ── Viewport ── */
.admin-viewport {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 1.5rem;
}

.view-wrapper {
  height: 100%;
}

.view-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Card contenedor para los charts en overview */
.charts-card {
  background: var(--bg-app);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 1.5rem;
  box-shadow: var(--shadow-card);
}

/* Transición entre tabs */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
