<template>
  <div class="flex flex-col items-center justify-center min-h-[70vh] p-4 bg-slate-50">
    
    <div class="mb-6 text-center">
      <div class="bg-blue-600 text-white p-4 rounded-full inline-block mb-4 shadow-lg">
        <i class="pi pi-lock-open" style="font-size: 2.5rem"></i>
      </div>
      <h1 class="text-3xl font-bold text-slate-800">Apertura de Caja</h1>
      <p class="text-slate-500 mt-2">Inicia un nuevo turno para comenzar a vender.</p>
    </div>

    <Card class="w-full max-w-md shadow-2xl border-t-4 border-blue-600">
      <template #content>
        <div class="flex flex-col gap-6 pt-4">
          
          <div class="flex flex-col gap-2">
            <label for="cajero" class="font-semibold text-slate-700">Responsable del Turno</label>
            <InputText 
              id="cajero" 
              v-model="nombreCajero" 
              placeholder="Ej. Juan Pérez" 
              class="w-full p-inputtext-lg"
              :class="{'p-invalid': error && !nombreCajero}"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label for="monto" class="font-semibold text-slate-700">Fondo Inicial de Caja</label>
            <InputNumber 
              id="monto" 
              v-model="montoInicial" 
              mode="currency" 
              currency="PEN" 
              locale="es-PE" 
              placeholder="S/ 0.00"
              class="w-full input-lg-currency"
              :min="0"
              inputClass="text-right text-xl font-bold text-blue-700"
            />
            <small class="text-slate-400">Dinero base en el cajón antes de la primera venta.</small>
          </div>

          <Button
            label="VOLVER" 
            icon="pi pi-arrow-left" 
            text 
            severity="secondary"
            class="w-full mt-2 p-button-lg" 
            @click="handleVolver"
            :loading="loading"
        />

          <Button 
            label="ABRIR TURNO" 
            icon="pi pi-check-circle" 
            class="w-full mt-2 p-button-lg" 
            @click="handleAbrirTurno" 
            :loading="loading"
          />

        </div>
      </template>
    </Card>

    <div class="mt-8 text-center text-sm text-slate-400">
      <p>Sistema de Control de Caja v2.0</p>
      <p>Asegúrate de contar el efectivo físico antes de abrir.</p>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useShift } from '@/composables/useShift';
import { useAuth } from '@/composables/useAuth';
import { useToast } from 'primevue/usetoast';
import { useSucursal } from '@/composables/useSucursal';

const { abrirTurno } = useShift();
const { user } = useAuth();
const { limpiarSucursal } = useSucursal();
const toast = useToast();

const nombreCajero = ref('');
const montoInicial = ref(0);
const loading = ref(false);
const error = ref(false);

/**
 * Maneja la apertura del turno al hacer clic en "ABRIR TURNO"
 */
const handleAbrirTurno = async () => {
  if (!nombreCajero.value.trim()) {
    error.value = true;
    toast.add({ severity: 'warn', summary: 'Falta información', detail: 'Ingresa el nombre del responsable', life: 3000 });
    return;
  }

  loading.value = true;
  try {
    const monto = montoInicial.value || 0;
    await abrirTurno(monto, nombreCajero.value);
    
    toast.add({ severity: 'success', summary: 'Turno Abierto', detail: 'Ya puedes registrar ventas', life: 3000 });
  } catch (e) {
    console.error(e);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo abrir el turno. Revisa tu conexión.', life: 5000 });
  } finally {
    loading.value = false;
  }
};

/**
 * Maneja el clic en "VOLVER" para regresar a la selección de sucursal
 */
const handleVolver = () => {
    limpiarSucursal();
}
</script>