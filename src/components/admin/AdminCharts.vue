<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
    
    <Card class="col-span-1 lg:col-span-2 shadow-sm">
      <template #title>Evolución de Ventas</template>
      <template #content>
        <div class="h-[300px] w-full relative">
          <Line :data="salesData" :options="lineOptions" />
        </div>
      </template>
    </Card>

    <Card class="shadow-sm">
      <template #title>Ventas por Sede</template>
      <template #content>
        <div class="h-[300px] w-full relative flex items-center justify-center">
          <Doughnut :data="branchData" :options="doughnutOptions" />
        </div>
      </template>
    </Card>

  </div>
</template>

<script setup>
import Card from 'primevue/card';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Doughnut } from 'vue-chartjs';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

defineProps({
  salesData: {
    type: Object,
    required: true
  },
  branchData: {
    type: Object,
    required: true
  }
});

// Opciones para el gráfico de líneas (Elegante y limpio)
const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      mode: 'index',
      intersect: false,
      callbacks: {
        label: (context) => ` S/ ${context.raw.toFixed(2)}`
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: '#f3f4f6' },
      ticks: { callback: (value) => `S/ ${value}` }
    },
    x: {
      grid: { display: false }
    }
  },
  interaction: {
    mode: 'nearest',
    axis: 'x',
    intersect: false
  }
};

// Opciones para el gráfico de dona
const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' }
  }
};
</script>