<template>
  <div class="selector-container">
    <div class="selector-content">
      <h1 class="selector-title">📍 ¿Dónde estás trabajando hoy?</h1>
      <p class="selector-subtitle">Selecciona tu ubicación para filtrar las ventas</p>
      
      <div v-if="loading" class="loading-state">
         Cargando tiendas...
      </div>

      <div v-else class="branches-grid">
        <div 
          v-for="tienda in sucursales" 
          :key="tienda.id" 
          class="branch-card"
          @click="handleSelect(tienda.nombre)"
        >
          <div class="branch-icon">{{ tienda.icono }}</div>
          <div class="branch-name">{{ tienda.nombre }}</div>
        </div>

        <div class="branch-card admin" @click="handleSelect('ADMIN')">
          <div class="branch-icon">🛡️</div>
          <div class="branch-name">ADMINISTRADOR</div>
        </div>
      </div>

      <p v-if="sucursales.length === 0 && !loading" style="margin-top: 20px; color: #666;">
        No hay tiendas registradas. Ingresa como ADMIN para crear una.
      </p>

    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useSucursal } from '../composables/useSucursal';

const router = useRouter();
const { sucursales, seleccionar, loading } = useSucursal();

/**
 * Maneja la selección de una sucursal
 * @param {String} nombre - nombre de la sucursal seleccionada
 */
const handleSelect = (nombre) => {
    const exito = seleccionar(nombre);

    if (exito) {
        if (nombre === 'ADMIN') {
            router.push('/admin');
        }
    }
};
</script>

<style scoped>
.selector-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.05);
}
.selector-content { text-align: center; }
.selector-title { font-size: 2rem; color: #1f2937; margin-bottom: 0.5rem; }
.selector-subtitle { color: #6b7280; margin-bottom: 3rem; }

.branches-grid {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

.branch-card {
  width: 160px;
  height: 160px;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.branch-card:hover {
  border-color: #667eea;
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.2);
}

.loading-state {
    padding: 2rem;
    color: #666;
    font-style: italic;
}

.branch-icon { font-size: 3rem; margin-bottom: 0.5rem; }
.branch-name { font-weight: 600; color: #374151; font-size: 0.9rem; }

.branch-card.admin { background: #1f2937; border-color: #1f2937; }
.branch-card.admin .branch-name { color: white; }
</style>