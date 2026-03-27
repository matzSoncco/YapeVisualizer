<template>
  <div class="admin-view-container">
    <AdminHeader>
      <template #left>
        <div class="admin-tabs">
          <Button
            v-for="tab in tabs"
            :key="tab.id"
            :label="tab.label"
            :icon="tab.icon"
            :severity="activeTab === tab.id ? 'primary' : 'secondary'"
            :outlined="activeTab !== tab.id"
            @click="activeTab = tab.id"
            size="small"
            class="tab-btn"
          />
        </div>
      </template>

      <template #filters>
        <DatePicker
          v-model="filters.dateRange"
          selectionMode="range"
          dateFormat="dd/mm"
          panelClass="compact-calendar-panel"
          :manualInput="false"
        />
        <Select
          v-model="filters.branchId"
          :options="sedeOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Todas las sedes"
          class="modern-select"
          panelClass="compact-select-panel"
        />
        <Button
          icon="pi pi-refresh"
          @click="handleSearch"
          :loading="loadingReportes"
          v-tooltip.top="'Actualizar'"
          severity="secondary"
          outlined
          class="refresh-btn"
        />
      </template>
    </AdminHeader>

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
            <div class="charts-card">
              <AdminCharts :salesData="salesChartData" :branchData="branchChartData" />
            </div>
          </div>

          <div v-else-if="activeTab === 'table'" class="view-content">
            <div class="table-card">
              <AdminTable :data="reportes" :loading="loadingReportes" @ver-detalle="verDetalle" />
            </div>
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

import AdminHeader from '@/components/admin/AdminHeader.vue'
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
  dateRange: [new Date(), new Date()],
  branchId: '',
})

const sedeOptions = computed(() => [
  { label: 'Todas las sedes', value: '' },
  ...sucursales.value.map((s) => ({ label: s.nombre, value: s.id })),
])

/**
 * Función para manejar la búsqueda de cuadres según los filtros seleccionados
 */
const handleSearch = () => {
  const [start, end] = filters.value.dateRange

  buscarCuadres({
    startDate: start,
    endDate: end || start,
    branchId: filters.value.branchId,
  })
}

const verDetalle = (data) => {
  selectedCierre.value = data
  isDetailVisible.value = true
}

// TODO: Esto es solo un recordatorio para implementar
// una verificación real del PIN en el futuro
// no es seguro dejarlo así en producción.
// Mover la logica al backend y forzar a cambiar el PIN si es el default
onMounted(() => {
  if (store.userProfile?.adminPin === '1234') {
    toast.add({
      severity: 'warn',
      summary: 'Acción Requerida',
      detail: 'Por seguridad, debes cambiar tu PIN antes de administrar.',
      life: 6000,
    })
    router.push('/admin/perfil')
    return
  }
  handleSearch()
})
</script>

<style scoped>
.admin-view-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(
    --bg-ground,
    #f8fafc
  );
}

.admin-tabs {
  display: flex;
  gap: 0.5rem;
  background: var(--bg-surface, rgba(0, 0, 0, 0.03));
  padding: 0.25rem;
  border-radius: var(--radius-lg, 8px);
}

.tab-btn {
  border: none !important;
  box-shadow: none !important;
  font-weight: 600;
}

.admin-viewport {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.view-wrapper {
  min-height: 100%;
}

.view-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* ── Tarjetas para Gráficos y Tablas ── */
.charts-card,
.table-card {
  background: var(--bg-app, #ffffff);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: var(--radius-xl, 12px);
  padding: 1.5rem;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 2px 4px -2px rgba(0, 0, 0, 0.025);
}

.table-card {
  padding: 0;
  overflow: hidden;
}

/* ── Transición ── */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>

<style>
/* ── DatePicker Compacto (Calendario) ── */
.compact-calendar-panel {
  min-width: 280px !important;
  font-size: 0.85rem !important;
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -4px rgba(0, 0, 0, 0.1) !important;
  border-radius: 8px !important;
  border: 1px solid var(--color-border, #e2e8f0) !important;
}

/* Achicar el header del calendario (Mes y Año) */
.compact-calendar-panel .p-datepicker-header {
  padding: 0.5rem !important;
}

.compact-calendar-panel .p-datepicker-title {
  gap: 0.5rem !important;
}

/* Achicar las celdas de los días */
.compact-calendar-panel table {
  margin: 0.25rem 0 !important;
}

.compact-calendar-panel table th {
  padding: 0.25rem !important;
  font-size: 0.75rem !important;
}

.compact-calendar-panel table td {
  padding: 0.1rem !important;
}

/* Achicar el botón redondo de cada número */
.compact-calendar-panel table td span {
  width: 2rem !important;
  height: 2rem !important;
}

/* ── Select Compacto (Dropdown de Sedes) ── */
.compact-select-panel {
  font-size: 0.85rem !important;
  border-radius: 8px !important;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
}

.compact-select-panel .p-select-item {
  padding: 0.5rem 0.75rem !important;
}
</style>
