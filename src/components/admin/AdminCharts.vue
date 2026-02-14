<template>
  <div class="charts-grid">
    
    <Card class="chart-card evolution-chart">
      <template #title>
        <div class="chart-header">
          <i class="pi pi-chart-line"></i>
          <span>Evolución de Ventas</span>
        </div>
      </template>
      <template #content>
        <div class="chart-container">
          <Line :data="salesData" :options="lineOptions" />
        </div>
      </template>
    </Card>

    <Card class="chart-card distribution-chart">
      <template #title>
        <div class="chart-header">
          <i class="pi pi-map-marker"></i>
          <span>Ventas por Sede</span>
        </div>
      </template>
      <template #content>
        <div class="chart-container doughnut-wrapper">
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
      backgroundColor: '#0f172a', // Slate 900
      titleFont: { size: 14, weight: 'bold' },
      padding: 12,
      cornerRadius: 10,
      callbacks: { label: (context) => ` S/ ${context.raw.toFixed(2)}` }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: '#f1f5f9', drawBorder: false },
      ticks: { color: '#94a3b8', font: { weight: '600' }, callback: (value) => `S/ ${value}` }
    },
    x: {
      grid: { display: false },
      ticks: { color: '#94a3b8', font: { weight: '600' } }
    }
  }
};

// Opciones para el gráfico de dona
const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { 
      position: 'bottom',
      labels: { usePointStyle: true, padding: 20, font: { weight: '700', size: 11 } }
    }
  },
  cutout: '70%' // Hace que la dona sea más elegante/delgada
};
</script>