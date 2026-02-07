<template>
  <Card class="data-card">
    <template #content>
      <DataTable
        :value="data"
        :loading="loading"
        stripedRows
        :paginator="data.length > 10"
        :rows="10"
        responsiveLayout="scroll"
      >
        <Column field="fecha" header="Fecha">
          <template #body="slotProps">
            {{ formatearFecha(slotProps.data.fecha) }}
          </template>
        </Column>

        <Column field="sedeNombre" header="Sede">
          <template #body="slotProps">
            <strong>{{ slotProps.data.sedeNombre }}</strong>
          </template>
        </Column>

        <Column field="montoYape" header="Total Yape">
          <template #body="slotProps">
            <span class="text-green-600 font-medium">
              S/ {{ Number(slotProps.data.montoYape).toFixed(2) }}
            </span>
          </template>
        </Column>

        <Column field="montoEfectivo" header="Total Efectivo">
          <template #body="slotProps">
            S/ {{ Number(slotProps.data.montoEfectivo).toFixed(2) }}
          </template>
        </Column>

        <Column field="diferencia" header="Diferencia">
          <template #body="slotProps">
            <span :class="slotProps.data.diferencia < 0 ? 'text-red-500 font-bold' : 'text-green-600'">
              S/ {{ Number(slotProps.data.diferencia).toFixed(2) }}
            </span>
          </template>
        </Column>

        <Column field="estado" header="Estado">
          <template #body="slotProps">
            <Tag 
              :value="slotProps.data.estado"
              :severity="slotProps.data.estado === 'Cuadrado' ? 'success' : 'warning'"
            />
          </template>
        </Column>

        <Column header="Acciones">
          <template #body>
            <Button
              icon="pi pi-eye"
              text
              rounded
              severity="secondary"
              @click="$emit('ver-detalle')"
            />
          </template>
        </Column>

        <template #empty>
          <div class="flex flex-col items-center justify-center p-8 text-surface-500">
            <i class="pi pi-inbox" style="font-size: 3rem; opacity: 0.5;"></i>
            <p class="mt-2">No se encontraron reportes con los filtros seleccionados.</p>
          </div>
        </template>
      </DataTable>
    </template>
  </Card>
</template>

<script setup>
import { formatearFecha } from '@/utils/dates';

/**
 * Componente AdminTable
 * - Recibe un array de datos y un estado de carga
 */
defineProps({
  data: {
    type: Array,
    required: true,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
});

/**
 * Emite un evento 'ver-detalle' cuando se hace clic en el botón de acción
 * TODO: Implementar la lógica para mostrar el detalle del cierre seleccionado en una vista o modal aparte
 */
defineEmits(['ver-detalle']);
</script>