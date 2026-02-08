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

    <Dialog
      v-model:visible="showPinModal"
      modal
      header="Seguridad"
      :style="{ width: '420px' }"
      :draggable="false"
    >
    <div class="pin-modal-content">
        <p class="pin-instructions">Ingresa tu PIN de administrador</p>
        
        <div class="pin-input-wrapper">
            <InputOtp 
                v-model="pin" 
                integerOnly 
                :length="4" 
                mask 
                style="gap: 10px"
            />
        </div>

        <div class="pin-actions">
          <Button 
            type="button" 
            label="Cancelar" 
            severity="secondary" 
            @click="showPinModal = false" 
          ></Button>
          <Button 
            type="button" 
            label="Entrar" 
            @click="verificarPin" 
            :loading="loadingPin"
            :disabled="pin.length < 4"
          ></Button>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useSucursal } from '../../composables/useSucursal';
import { useToast } from 'primevue/usetoast';
import { setAdminAuth } from '@/store';

const router = useRouter();
const toast = useToast();
const { sucursales, seleccionar, loading } = useSucursal();

const showPinModal = ref(false);
const pin = ref('');
const loadingPin = ref(false);

/**
 * Maneja la selección de una sucursal
 * @param {String} valorSeleccionado - uid o 'ADMIN' seleccionado
 */
const handleSelect = (valorSeleccionado) => {
  if (valorSeleccionado === 'ADMIN') {
    pin.value = '';
    showPinModal.value = true;
    return;
  }

  const existe = sucursales.value.find(s => s.nombre === valorSeleccionado);
  if (existe) {
    seleccionar(existe.id);
  }
};

const verificarPin = async () => {
  if (pin.value.length < 4) return;

  loadingPin.value = true;

  await new Promise(r => setTimeout(r, 600));

  const exito = seleccionar('ADMIN', pin.value);

  if (exito) {
    setAdminAuth (true);
    showPinModal.value = false;
    toast.add({ severity: 'success', summary: 'Acceso Concedido', life: 2000 });
    router.push({ name: 'admin' });
  } else {
    toast.add({ severity: 'error', summary: 'Acceso Denegado', detail: 'PIN Incorrecto', life: 3000 });
    pin.value = '';
  }

  loadingPin.value = false;
}
</script>