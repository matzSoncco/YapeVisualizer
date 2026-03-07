<template>
  <Dialog
    v-model:visible="isOpen"
    modal
    appendTo="body"
    :showHeader="false"
    :style="{ width: '420px' }"
    class="sale-detail-dialog"
  >
    <div v-if="sale" class="detail-container">
      <header class="op-header">
        <div class="op-id-group">
          <span class="op-label">
            {{ sale.type === 'EXPENSE' ? 'Egreso de Caja' : 'Nota de Venta' }}
          </span>
          <h2 class="op-number">
            {{ sale.ticketNumber || (sale.type === 'EXPENSE' ? 'Ref. Gasto' : 'Pendiente') }}
          </h2>
          <span class="db-id">ID: {{ sale.id?.substring(0, 10) }}</span>
        </div>
        <div class="op-status">
          <span class="op-date">{{ formatearFecha(sale.timestamp) }}</span>
        </div>
      </header>

      <div class="op-body">
        <div v-if="sale.type === 'EXPENSE'" class="expense-view">
          <label>DESCRIPCIÓN</label>
          <p>{{ sale.description || 'Sin descripción' }}</p>
        </div>

        <div v-else class="products-view">
          <div class="items-list custom-scrollbar">
            <div v-for="(item, i) in sale.items" :key="i" class="product-item">
              <span class="p-main">
                <span class="p-qty">{{ item.qty }}x</span>
                <span class="p-name">{{ item.name }}</span>
              </span>
              <span class="p-total">S/ {{ (item.price * item.qty).toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="op-summary">
        <div class="summary-item">
          <label>MÉTODO DE PAGO</label>
          <div class="method-tag" :class="obtenerClaseMetodo(sale)">
            <i :class="obtenerIconoMetodo(sale)"></i>
            <span>{{ obtenerNombreMetodo(sale) }}</span>
          </div>
        </div>
        <div class="summary-item text-right">
          <label>{{ sale.type === 'EXPENSE' ? 'MONTO RETIRADO' : 'TOTAL COBRADO' }}</label>
          <span class="total-value" :class="{ 'is-expense': sale.type === 'EXPENSE' }">
            S/ {{ (sale.totalAmount || sale.amount || 0).toFixed(2) }}
          </span>
        </div>
      </div>

      <div class="op-actions">
        <Button
          label="Cerrar"
          text
          severity="secondary"
          @click="isOpen = false"
          class="btn-cancel"
        />
        <Button
          v-if="sale.type !== 'EXPENSE'"
          label="Imprimir Nota"
          icon="pi pi-print"
          @click="imprimir"
          class="btn-print"
        />
      </div>
    </div>
  </Dialog>
</template>

<script setup>
import { ref } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import { formatearFecha } from '@/utils/dates'
import { useToast } from 'primevue/usetoast'

const isOpen = ref(false)
const sale = ref(null)
const toast = useToast()

/**
 * Abre el modal con los detalles del movimiento seleccionado
 * @param {Object} data - Objeto con la información de la venta o gasto
 */
const open = (data) => {
  sale.value = data
  isOpen.value = true
}

/**
 * Obtiene el nombre del método de pago o indica que es un gasto de caja
 * @param s - Objeto de venta o gasto
 * @returns {string} - Nombre del método o "CAJA" para gastos
 */
const obtenerNombreMetodo = (s) => {
  if (s.type === 'EXPENSE') return 'CAJA'
  const pay = s.payments?.[0]
  return (pay?.wallet || pay?.method || 'EFECTIVO').toUpperCase()
}

/**
 * Función para obtener el ícono CSS basado en el método de pago o tipo de movimiento
 * @param s - Objeto de venta o gasto
 * @returns {string} - Clase CSS del ícono correspondiente
 */
const obtenerIconoMetodo = (s) => {
  if (s.type === 'EXPENSE') return 'pi pi-wallet'
  return s.payments?.[0]?.method === 'CASH' ? 'pi pi-money-bill' : 'pi pi-mobile'
}

/**
 * Función para obtener la clase CSS basada en el método de pago o tipo de movimiento
 * @param s - Objeto de venta o gasto
 * @returns {string} - Clase CSS correspondiente
 */
const obtenerClaseMetodo = (s) => {
  if (s.type === 'EXPENSE') return 'method-expense'
  const wallet = s.payments?.[0]?.wallet?.toUpperCase() || s.payments?.[0]?.method
  if (wallet === 'YAPE') return 'method-yape'
  if (wallet === 'PLIN') return 'method-plin'
  if (wallet === 'CASH') return 'method-cash'
  return 'method-default'
}

/**
 * Función de impresión (placeholder) - Aquí iría la lógica para imprimir la nota de venta
 * Actualmente solo muestra un mensaje en toast
 * Se espera que se mueva a otro composable o utilitario relacionado con impresión
 */
const imprimir = () => {
  toast.add({
    severity: 'info',
    summary: 'Función de impresión',
    detail: 'Aquí se implementaría la lógica para imprimir la nota de venta.',
    life: 3000,
  })
}

defineExpose({ open })
</script>

<style scoped>
.detail-container {
  padding: 1rem 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Header */
.op-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 1rem;
}

.op-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
}
.op-number {
  font-size: 1.25rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0.1rem 0;
}
.db-id {
  font-size: 0.65rem;
  color: #cbd5e1;
  font-family: monospace;
}
.op-date {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
}

/* Cuerpo */
.product-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f8fafc;
  font-size: 0.9rem;
}

.p-qty {
  font-weight: 800;
  color: #334155;
  margin-right: 0.5rem;
}
.p-name {
  color: #64748b;
  text-transform: uppercase;
}
.p-total {
  font-weight: 700;
  color: #1e293b;
}

.expense-view label {
  font-size: 0.65rem;
  font-weight: 800;
  color: #94a3b8;
  display: block;
}
.expense-view p {
  font-weight: 600;
  color: #334155;
  margin-top: 0.25rem;
}

/* Resumen */
.op-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.summary-item label {
  font-size: 0.65rem;
  font-weight: 700;
  color: #94a3b8;
  display: block;
  margin-bottom: 0.4rem;
}

/* Botones con los colores que te gustan */
.method-tag {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 800;
  font-size: 0.75rem;
}

.method-yape {
  color: #7c3aed;
} /* Morado Yape */
.method-plin {
  color: #06b6d4;
} /* Cian Plin */
.method-cash {
  color: #16a34a;
} /* Verde Cash */

.total-value {
  font-size: 1.5rem;
  font-weight: 900;
  color: #0f172a;
}
.total-value.is-expense {
  color: #ef4444;
}

/* Acciones */
.op-actions {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}
.btn-cancel {
  flex: 1;
  font-weight: 700;
}
.btn-print {
  flex: 2;
  background: #1e293b !important;
  border: none !important;
  border-radius: 8px !important;
  font-weight: 800 !important;
}

.text-right {
  text-align: right;
}
</style>
