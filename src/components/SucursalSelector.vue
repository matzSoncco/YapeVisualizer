<template>
  <div class="selector-container">
    <Card class="selector-card">
      <template #content>
        <div class="selector-header">
          <div class="selector-icon">
            <i class="pi pi-map-marker"></i>
          </div>
          <h1 class="selector-title">¿Dónde estás trabajando hoy?</h1>
          <p class="selector-subtitle">Selecciona tu ubicación para filtrar las ventas</p>
        </div>

        <div v-if="loading" class="loading-state">
          <i class="pi pi-spin pi-spinner" style="font-size: 2rem; color: var(--antique-brass);"></i>
          <p>Cargando tiendas...</p>
        </div>

        <div v-else>
          <div class="branches-grid">
            <Card 
              v-for="tienda in sucursales" 
              :key="tienda.id" 
              class="branch-card"
              @click="handleSelect(tienda.nombre)"
            >
              <template #content>
                <div class="branch-icon">{{ tienda.icono }}</div>
                <div class="branch-name">{{ tienda.nombre }}</div>
              </template>
            </Card>

            <Card 
              class="branch-card branch-admin"
              @click="handleSelect('ADMIN')"
            >
              <template #content>
                <div class="branch-icon">🛡️</div>
                <div class="branch-name">ADMINISTRADOR</div>
              </template>
            </Card>
          </div>

          <p v-if="sucursales.length === 0" class="empty-message">
            No hay tiendas registradas. Ingresa como ADMIN para crear una.
          </p>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import Card from 'primevue/card';

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