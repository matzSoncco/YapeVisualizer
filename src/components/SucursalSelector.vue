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