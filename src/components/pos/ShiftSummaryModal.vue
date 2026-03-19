<template>
  <Dialog
    v-model:visible="arqueoState.summaryVisible"
    header="Resumen de Cierre de Caja"
    modal
    :style="{ width: '90vw', maxWidth: '450px' }"
    :closable="false"
  >
    <div v-if="arqueoState.summaryData" class="resumen-content">
      <div class="text-center mb-4">
        <i :class="statusIconClass" style="font-size: 3rem"></i>
        <h2 class="m-0 mt-2" :class="statusTextClass">{{ statusMessage }}</h2>
        <small class="text-gray-500">Turno finalizado en el sistema</small>
      </div>

      <div class="stats-box">
        <div class="stat-item main">
          <span class="label">EFECTIVO DECLARADO (Contado)</span>
          <span class="value">S/ {{ arqueoState.summaryData.audit.declaredCash.toFixed(2) }}</span>

          <span class="text-sm text-gray-500 mt-1">
            Incluye base inicial de: S/ {{ arqueoState.summaryData.audit.fund.toFixed(2) }}
          </span>

          <div class="mt-3 text-sm font-bold p-2 border-round" :class="differenceBoxClass">
            <span v-if="diff === 0">
              <i class="pi pi-check-circle mr-1"></i> Exacto (Sin diferencia)
            </span>
            <span v-else-if="diff < 0">
              <i class="pi pi-arrow-down mr-1"></i> Faltante: S/ {{ Math.abs(diff).toFixed(2) }}
            </span>
            <span v-else>
              <i class="pi pi-arrow-up mr-1"></i> Sobrante: S/ {{ diff.toFixed(2) }}
            </span>
          </div>
        </div>

        <div class="grid mt-3">
          <div class="col-6">
            <div class="stat-item secondary">
              <span class="label">YAPE/PLIN</span>
              <span class="value-sm">S/ {{ arqueoState.summaryData.totalDigital.toFixed(2) }}</span>
            </div>
          </div>
          <div class="col-6">
            <div class="stat-item secondary">
              <span class="label">TOTAL INGRESOS</span>
              <span class="value-sm"
                >S/ {{ arqueoState.summaryData.totalIngresosDia.toFixed(2) }}</span
              >
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-column gap-2 mt-4">
        <Button label="Entendido, Salir" icon="pi pi-sign-out" class="w-full" @click="cerrarTodo" />
      </div>
    </div>
  </Dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useShift } from '@/composables/useShift'

const { arqueoState, finalizarCierrePorCompleto } = useShift()

const diff = computed(() => arqueoState.summaryData?.audit?.difference || 0)

const statusMessage = computed(() => {
  if (diff.value === 0) return 'Caja Cuadrada'
  if (diff.value < 0) return 'Caja con Faltante'
  return 'Caja con Sobrante'
})

const statusIconClass = computed(() => {
  if (diff.value === 0) return 'pi pi-check-circle text-green-500'
  if (diff.value < 0) return 'pi pi-times-circle text-red-500'
  return 'pi pi-exclamation-triangle text-yellow-500'
})

const statusTextClass = computed(() => {
  if (diff.value === 0) return 'text-green-600'
  if (diff.value < 0) return 'text-red-600'
  return 'text-yellow-600'
})

const differenceBoxClass = computed(() => {
  if (diff.value === 0) return 'bg-green-100 text-green-700 border-1 border-green-200'
  if (diff.value < 0) return 'bg-red-100 text-red-700 border-1 border-red-200'
  return 'bg-yellow-100 text-yellow-700 border-1 border-yellow-200'
})

const cerrarTodo = () => {
  arqueoState.summaryVisible = false
  finalizarCierrePorCompleto()
}
</script>

<style scoped>
.stats-box {
  background: #f8fafc;
  padding: 1.5rem;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
}
.stat-item {
  display: flex;
  flex-direction: column;
}
.stat-item.main .label {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: bold;
}
.stat-item.main .value {
  font-size: 2.2rem;
  font-weight: 800;
  color: #1e293b;
}
.value-sm {
  font-size: 1.2rem;
  font-weight: 700;
  color: #334155;
}
.label {
  font-size: 0.7rem;
  color: #64748b;
  text-transform: uppercase;
}
</style>
