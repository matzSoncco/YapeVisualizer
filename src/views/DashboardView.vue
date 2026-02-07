<template>
  <div class="dashboard">
    <Toast />
    <ConfirmDialog />
    <Dialog 
      v-model:visible="showCierreModal" 
      modal 
      header="🔒 Cerrar Turno" 
      :style="{ width: '25rem' }"
    >
        <div class="flex flex-col gap-2 mb-4">
            <label class="font-bold">Monto en Efectivo</label>
            <InputNumber 
                v-model="efectivoInput" 
                inputId="currency-pe" 
                mode="currency" 
                currency="PEN" 
                locale="es-PE" 
                placeholder="Deja vacío si no recibiste efectivo"
                class="w-full"
            />
            <small class="text-surface-500">Nota: Si no ingresas nada, el sistema asumirá que el total de tu turno fue únicamente por Yape. No afectará tu historial de ventas.</small>
        </div>

        <template #footer>
            <Button label="Cancelar" text severity="secondary" @click="showCierreModal = false" />
            <Button 
                label="Cerrar Caja" 
                icon="pi pi-lock" 
                severity="danger" 
                @click="procesarCierre" 
                :loading="loadingCierre"
            />
        </template>
    </Dialog>

    <Dialog 
      v-model:visible="showResumenCierreModal" 
      modal 
      header="🧾 Resumen de Turno" 
      :style="{ width: '25rem' }"
      :closable="false"
      :closeOnEscape="false"
    >
        <div v-if="resumenData" class="flex flex-col gap-4 text-center pt-2">
            <i class="pi pi-check-circle text-5xl text-green-500 mb-2"></i>
            <h3 class="font-bold text-xl">¡Turno Finalizado!</h3>
            
            <div class="bg-surface-100 dark:bg-surface-800 p-4 rounded-lg flex flex-col gap-2">
                <div class="flex justify-between">
                    <span>Ventas Yape ({{ resumenData.cantidadYape }}):</span>
                    <span class="font-bold text-primary">S/ {{ resumenData.totalYape.toFixed(2) }}</span>
                </div>
                <div class="flex justify-between">
                    <span>Efectivo Declarado:</span>
                    <span class="font-bold text-surface-900 dark:text-white">S/ {{ resumenData.totalEfectivo.toFixed(2) }}</span>
                </div>
                <div class="divider my-1 border-t border-surface-300"></div>
                <div class="flex justify-between text-lg">
                    <span class="font-bold">Total Recaudado:</span>
                    <span class="font-bold text-green-600">S/ {{ resumenData.totalIngresos.toFixed(2) }}</span>
                </div>
            </div>

            <Button label="Entendido" class="w-full mt-2" @click="finalizarTurno" />
        </div>
    </Dialog>
    <div v-if="!sucursalActual">
      <SucursalSelector />
    </div>

    <div v-else class="dashboard-layout">

      <div v-if="loadingCaja" class="caja-loading-state">
        <i class="pi pi-spin pi-spinner"></i>
        <p>Verificando turno...</p>
      </div>

      <template v-else>
        <Dialog 
          v-model:visible="showAperturaModal" 
          modal 
          :header="`👋 Iniciar Turno en ${nombreSucursalActual}`" 
          :style="{ width: '420px' }"
          :closable="false"
          :closeOnEscape="false"
          :draggable="false"
        >
          <div class="apertura-modal-content">
            <p class="apertura-instructions">
              Para comenzar a recibir pagos, registra quién será el responsable de la caja.
            </p>

            <div class="apertura-form-group">
              <label for="cajero">Nombre del Cajero</label>
              <InputText 
                id="cajero" 
                v-model="nombreCajero" 
                placeholder="Ej. Juan Pérez" 
                class="w-full"
                autofocus
              />
            </div>

            <div class="apertura-actions">
              <Button 
                label="Cambiar Sede" 
                icon="pi pi-arrow-left" 
                text 
                severity="secondary"
                @click="cambiarSucursal" 
            />
              <Button 
                label="Abrir Caja" 
                icon="pi pi-check" 
                @click="handleAbrirCaja" 
                :loading="loadingApertura"
                :disabled="!nombreCajero.trim()"
              />
            </div>
          </div>
        </Dialog>

        <div v-if="isSessionOpened">
          <header class="dashboard-header">
            <div class="dashboard-header-content">
              <div class="dashboard-title-section">
                <h1>Monitor Yape</h1>
                <p class="dashboard-subtitle">
                  Tienda: <strong>{{ nombreSucursalActual }}</strong>
                </p>
              </div>
              
              <div class="dashboard-actions">
                <Button 
                  label="Simular Yape" 
                  icon="pi pi-play"
                  @click="handleSimulacion"
                  outlined
                />
                <div class="divider-vertical"></div>
                <Button 
                  label="Cambiar" 
                  icon="pi pi-refresh"
                  @click="cambiarSucursal"
                  text
                />
                <Button
                  label="Cerrar caja"
                  icon="pi pi-lock"
                  @click="solicitarCierre"
                  severity="warning"
                  text
                />
                <Button 
                  label="Salir" 
                  icon="pi pi-sign-out"
                  @click="handleLogout"
                  severity="danger"
                  text
                />
              </div>
            </div>
          </header>

          <main class="dashboard-content">
            <section v-if="!unaSucursal" class="grid-col-pending">
              <PendingList 
                :yapes="yapesPendientes" 
                @pescar="handlePesca" 
              />
            </section>

            <section class="grid-col-history" :class="{ 'full-width': unaSucursal }">
              <SalesHistory 
                :ventas="misVentas" 
              />
            </section>
          </main>
        </div>

        <div v-else class="caja-closed-state">
          <i class="pi pi-lock"></i>
          <h2>Caja Cerrada</h2>
          <p>Debes iniciar turno para ver el panel.</p>
          <Button label="Abrir Turno" @click="showAperturaModal = true" />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter } from 'vue-router';

import SucursalSelector from '../components/SucursalSelector.vue';
import PendingList from '../components/PendingList.vue';
import SalesHistory from '../components/SalesHistory.vue';
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm';
import '../assets/dashboard.css';

import { useAuth } from '../composables/useAuth';
import { useYape } from '../composables/useYape';
import { useSucursal } from '../composables/useSucursal';
import { useCaja } from '@/composables/useCaja';
import { simularDatos } from '@/utils/devSimulator';

/**
 * Composables y variables reactivas
 */
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();

const { user, logOut } = useAuth();
const { sucursalActual, sucursales, limpiarSucursal, nombreSucursalActual } = useSucursal();
const { 
  escucharPendientes, 
  escucharMisVentas, 
  reclamarYape, 
  detenerTodo,
  yapesPendientes, 
  misVentas 
} = useYape();
const { verificarCajaAbierta, abrirCaja, cerrarCaja, isSessionOpened } = useCaja();

const showAperturaModal = ref(false);
const nombreCajero = ref('');
const loadingApertura = ref(false);
const loadingCaja = ref(true);

const showCierreModal = ref(false);
const showResumenCierreModal = ref(false);
const efectivoInput = ref(null);
const resumenData = ref(null);
const loadingCierre = ref(false);

const unaSucursal = computed(() => sucursales.value.length === 1);

/**
 * Método encargado de la apertura de modal en la vista
 */
const handleAbrirCaja = async () => {
  if (!nombreCajero.value.trim()) return;

  loadingApertura.value = true;
  try {
    await abrirCaja(nombreCajero.value);
    await Promise.all([
        escucharPendientes(user.value.email),
        escucharMisVentas(user.value.email, sucursalActual.value)
    ]);
    showAperturaModal.value = false;
    toast.add({ severity: 'success', summary: 'Turno Iniciado', detail: `Caja abierta por ${nombreCajero.value}`, life: 3000 });
  } catch (error) {
    console.error(error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo abrir la caja' });
  } finally {
    loadingApertura.value = false;
  }
};

/**
 * Método encargado de iniciar el proceso de cierre de caja
 */
const solicitarCierre = () => {
    efectivoInput.value = null;
    showCierreModal.value = true;
};

/**
 * Método encargado de procesar cierre de caja
 * TODO: Mover lógica a useCaja.js
 */
const procesarCierre = async () => {
    loadingCierre.value = true;
    try {
        const sucursalObj = sucursales.value.find(s => s.id === sucursalActual.value);
        const nombreSede = sucursalObj ? sucursalObj.nombre : 'Sede Principal';

        const resultado = await cerrarCaja(efectivoInput.value, nombreSede);
        
        resumenData.value = resultado;
        
        showCierreModal.value = false;
        showResumenCierreModal.value = true;
        
        toast.add({ severity: 'success', summary: 'Turno Cerrado Correctamente' });
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cerrar el turno' });
        console.error(e);
    } finally {
        loadingCierre.value = false;
    }
};

/**
 * Finalización del turno y recarga de la app
 * TODO: Mover lógica a useCaja.js
 */
const finalizarTurno = () => {
    showResumenCierreModal.value = false;
    window.location.reload();
};

/**
 * Manejo de pesca de Yape
 * @param {Object} yape - Objeto Yape pendiente
 * TODO: Mover a useYape.js
 */
const handlePesca = async (yape) => {
  confirm.require({
    message: `¿Confirmas que recibiste S/. ${yape.amount} de ${yape.senderName}?`,
    header: 'Confirmar venta',
    icon: 'pi pi-check-triangle',
    rejectProps: { label: 'Cancelar', severity: 'secondary', outlined: true },
    acceptProps: { label: 'Confirmar', severity: 'success' },
    accept: async () => {
      try {
        await reclamarYape(yape.id, sucursalActual.value, nombreSucursalActual.value);
        toast.add({ severity: 'success', summary: 'Venta confirmada', detail: 'El monto se agregó a tu caja', life: 3000 });
      } catch (error) {
        console.error("Error al confirmar la venta:", error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo confirmar la venta', life: 3000 });
      }
    }
  })
}

/**
 * Manejo de simulación de datos
 * TODO: Mover al utilitario de simulación
 */
const handleSimulacion = () => {
  if (user.value?.email) {
    simularDatos(user.value.email);
    toast.add({ severity: 'info', detail: 'Simulando...', life: 3000 });
  } else {
    console.error("No hay usuario logueado para simular");
  }
}

/**
 * Cierre de sesión
 */
const handleLogout = async () => { 
    detenerTodo(); 
    limpiarSucursal(); 
    await logOut(); 
    router.push('/');
};

/**
 * Cambio de sucursal y cierre de sesión
 */
const cambiarSucursal = () => { 
    detenerTodo(); 
    limpiarSucursal(); 
};

/**
 * Iniciar listeners de Yape
 */
const iniciarLogicaSucursal = async () => {
  if(!user.value || !sucursalActual.value) return;

  if (sucursalActual.value === 'ADMIN') {
    loadingCaja.value = false;
    router.push('/admin');
    return;
  }

  loadingCaja.value = true;
  misVentas.value = [];

  try {
      await verificarCajaAbierta();
      
      if (!isSessionOpened.value) {
        showAperturaModal.value = true;
      } else {
        showAperturaModal.value = false;
        await Promise.all([
          escucharPendientes(user.value.email),
          escucharMisVentas(user.value.email, sucursalActual.value)
        ]);
      }
  } catch (e) {
      console.error("Error cargando sucursal:", e);
  } finally {
    loadingCaja.value = false;
  }
}

/**
 * Watchers y hooks
 */
watch([user, sucursalActual], () => {
    iniciarLogicaSucursal();
});

onMounted(() => {
    iniciarLogicaSucursal();
});
</script>