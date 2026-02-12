<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    
    <Card class="kpi-card border-l-4 border-green-500 shadow-sm">
      <template #content>
        <div class="flex justify-between items-start">
          <div>
            <span class="text-slate-500 font-medium text-sm">Ventas Totales</span>
            <div class="text-2xl font-bold text-slate-800 mt-1">
              S/ {{ formatMoney(kpis.totalVentas) }}
            </div>
          </div>
          <div class="bg-green-100 p-2 rounded-full">
            <i class="pi pi-dollar text-green-600 text-xl"></i>
          </div>
        </div>
        <div class="mt-2 text-xs text-slate-400">
          En el periodo seleccionado
        </div>
      </template>
    </Card>

    <Card class="kpi-card border-l-4 border-purple-500 shadow-sm">
      <template #content>
        <div class="flex justify-between items-start">
          <div>
            <span class="text-slate-500 font-medium text-sm">Digitalización (Yape)</span>
            <div class="text-2xl font-bold text-slate-800 mt-1">
              {{ kpis.porcentajeDigital.toFixed(1) }}%
            </div>
          </div>
          <div class="bg-purple-100 p-2 rounded-full">
            <i class="pi pi-mobile text-purple-600 text-xl"></i>
          </div>
        </div>
        <div class="mt-2 text-xs">
          <span class="font-bold text-purple-600">S/ {{ formatMoney(kpis.totalYape) }}</span> 
          <span class="text-slate-400"> recibidos por Yape</span>
        </div>
      </template>
    </Card>

    <Card class="kpi-card border-l-4 border-blue-500 shadow-sm">
      <template #content>
        <div class="flex justify-between items-start">
          <div>
            <span class="text-slate-500 font-medium text-sm">Ticket Promedio</span>
            <div class="text-2xl font-bold text-slate-800 mt-1">
              S/ {{ formatMoney(kpis.ticketPromedio) }}
            </div>
          </div>
          <div class="bg-blue-100 p-2 rounded-full">
            <i class="pi pi-shopping-cart text-blue-600 text-xl"></i>
          </div>
        </div>
        <div class="mt-2 text-xs text-slate-400">
          Promedio por cierre de caja
        </div>
      </template>
    </Card>

    <Card class="kpi-card border-l-4 shadow-sm" :class="kpis.diferenciaNeta < 0 ? 'border-red-500' : 'border-emerald-500'">
      <template #content>
        <div class="flex justify-between items-start">
          <div>
            <span class="text-slate-500 font-medium text-sm">Balance de Auditoría</span>
            <div class="text-2xl font-bold mt-1" :class="kpis.diferenciaNeta < 0 ? 'text-red-600' : 'text-emerald-600'">
              {{ kpis.diferenciaNeta > 0 ? '+' : '' }}S/ {{ formatMoney(kpis.diferenciaNeta) }}
            </div>
          </div>
          <div class="p-2 rounded-full" :class="kpis.diferenciaNeta < 0 ? 'bg-red-100' : 'bg-emerald-100'">
            <i class="pi text-xl" :class="kpis.diferenciaNeta < 0 ? 'pi-exclamation-triangle text-red-600' : 'pi-check-circle text-emerald-600'"></i>
          </div>
        </div>
        <div class="mt-2 text-xs text-slate-400">
          Acumulado de sobrantes/faltantes
        </div>
      </template>
    </Card>

  </div>
</template>

<script setup>
import Card from 'primevue/card';

const props = defineProps({
  kpis: {
    type: Object,
    required: true,
    default: () => ({
      totalVentas: 0,
      porcentajeDigital: 0,
      totalYape: 0,
      ticketPromedio: 0,
      diferenciaNeta: 0
    })
  }
});

const formatMoney = (value) => {
  return Number(value || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
</script>

<style scoped>
.kpi-card {
  transition: transform 0.2s;
}
.kpi-card:hover {
  transform: translateY(-2px);
}
</style>