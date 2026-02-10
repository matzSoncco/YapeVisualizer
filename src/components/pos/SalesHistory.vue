<template>
  <div class="history-section">
    <div class="section-header">
      <div class="section-title">
        <i class="pi pi-wallet" style="color: var(--antique-brass);"></i>
        <h3>Mis Ventas Confirmadas</h3>
      </div>
      <div class="total-badge">
        Total Hoy: <strong>S/ {{ total.toFixed(2) }}</strong>
      </div>
    </div>

    <div v-if="ventas.length === 0" class="empty-state">
      <i class="pi pi-shopping-cart" style="font-size: 3rem; color: var(--coffee); opacity: 0.3;"></i>
      <p>Aún no has validado ventas hoy.</p>
    </div>

    <Card v-else class="history-card">
      <template #content>
        <DataTable 
          :value="ventas" 
          :paginator="ventas.length > 10"
          :rows="10"
          stripedRows
          responsiveLayout="scroll"
        >
          <Column field="timestamp" header="Hora">
            <template #body="slotProps">
              <i class="pi pi-clock" style="margin-right: 0.5rem; color: var(--jet);"></i>
              {{ formatearHora(slotProps.data.timestamp) }}
            </template>
          </Column>
          
          <Column header="Cliente">
            <template #body="slotProps">
              <span v-if="slotProps.data.type === 'EXPENSE'" class="text-red-500 font-bold">
                  GASTO OPERATIVO
              </span>
              <span v-else class="client-name">
                  {{ slotProps.data.clientName || 'Cliente Eventual' }}
              </span>
            </template>
          </Column>
          
          <Column field="totalAmount" header="Monto">
            <template #body="slotProps">
              <span class="amount-cell" :class="{'text-red-500': slotProps.data.type === 'EXPENSE'}">
                S/ {{ Number(slotProps.data.totalAmount || slotProps.data.amount).toFixed(2) }}
              </span>
            </template>
          </Column>
          
          <Column header="Método">
            <template #body="slotProps">
               <Tag v-if="slotProps.data.type === 'EXPENSE'" value="Salida" severity="danger" icon="pi pi-minus-circle" />
               
               <div v-else>
                   <Tag 
                        v-if="esPagoYape(slotProps.data)" 
                        value="Yape" 
                        severity="help" 
                        icon="pi pi-qrcode" 
                    />
                   <Tag 
                        v-else 
                        value="Efectivo" 
                        severity="success" 
                        icon="pi pi-money-bill" 
                    />
               </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
  </div>
</template>

<script setup>
import Card from 'primevue/card';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import { computed } from 'vue';
import { formatearHora } from '@/utils/dates';

const props = defineProps({
  ventas: { type: Array, required: true }
});

/**
 * Cálculo del Total
 * TODO: Mover a un composable o utilitario si fuera necesario
 */
const total = computed(() => {
  return props.ventas.reduce((sum, item) => {
      const monto = Number(item.totalAmount || item.amount || 0);
      if (item.type === 'EXPENSE') {
          return sum - monto;
      }
      return sum + monto;
  }, 0);
});

/**
 * Identifica si es una venta por Yape o gasto operativo para estilos
 * @param data - Objeto de venta o gasto operativo
 */
const esPagoYape = (data) => {
    if (!data.payments) return false;
    return data.payments.some(p => p.method === 'YAPE');
};
</script>