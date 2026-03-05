<template>
  <Dialog
    v-model:visible="expenseState.isOpen"
    modal
    header="Registro de Gasto Operativo"
    :style="{ width: '380px' }"
    class="expense-dialog"
  >
    <div class="expense-form">
      <p class="expense-warning">
        <i class="pi pi-exclamation-triangle"></i>
        Este monto se restará del efectivo en caja.
      </p>

      <div class="field-group">
        <label>Descripción del Gasto</label>
        <InputText
          v-model="expenseState.description"
          placeholder="Ej. Pasajes, Almuerzo, Bolsas..."
          class="w-full p-inputtext-sm"
        />
      </div>

      <div class="field-group">
        <label>Monto a Retirar</label>
        <div class="price-input-wrapper expense-border">
          <span class="currency">S/</span>
          <InputNumber
            v-model="expenseState.amount"
            mode="decimal"
            :minFractionDigits="2"
            placeholder="0.00"
            class="w-full"
            inputClass="expense-input-inner"
          />
        </div>
      </div>

      <div class="expense-actions">
        <Button
          label="Cancelar"
          severity="secondary"
          text
          @click="expenseState.isOpen = false"
          class="flex-1"
        />
        <Button
          label="REGISTRAR SALIDA"
          severity="danger"
          icon="pi pi-sign-out"
          @click="handleGuardarGasto"
          :loading="expenseState.loading"
          :disabled="!expenseState.description || !expenseState.amount"
          class="flex-1 btn-expense"
        />
      </div>
    </div>
  </Dialog>
</template>

<script setup>
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import { useMovements } from '@/composables/useMovements'
import { useToast } from 'primevue/usetoast'

const toast = useToast()
const { expenseState, registrarGasto } = useMovements()

/**
 * Lógica para registrar el gasto y mostrar notificación
 */
const handleGuardarGasto = async () => {
  try {
    await registrarGasto()
    toast.add({
      severity: 'warn',
      summary: 'Gasto Registrado',
      detail: 'Actualizado en caja.',
      life: 3000,
    })
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: e.message,
      life: 5000,
    })
  }
}
</script>

<style scoped>
.expense-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding-top: 0.5rem;
}

.expense-warning {
  background: #fef2f2;
  color: #b91c1c;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field-group label {
  font-size: 0.7rem;
  font-weight: 800;
  color: var(--color-text-muted);
  text-transform: uppercase;
}

.expense-border {
  border: 2px solid #fee2e2 !important;
  transition: border-color 0.2s;
}

.expense-border:focus-within {
  border-color: #ef4444 !important;
}

.expense-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.price-input-wrapper.expense-border {
  display: flex;
  align-items: center;
  border: 2px solid #fee2e2 !important;
  border-radius: 8px;
  background: white;
  padding: 0 1rem;
  height: 50px;
  transition: all 0.2s ease;
}

.price-input-wrapper.expense-border:focus-within {
  border-color: #ef4444 !important;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
}

.price-input-wrapper.expense-border .currency {
  font-size: 1.2rem;
  font-weight: 700;
  color: #ef4444;
  margin-right: 0.5rem;
}

.price-input-wrapper .p-inputnumber-input {
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
  padding: 0 !important;
  margin: 0 !important;
  width: 100% !important;
}

.expense-input-inner {
  font-weight: 900 !important;
  font-size: 1.5rem !important;
  color: #b91c1c !important;
  text-align: right !important;
  height: 100% !important;
}

.btn-expense {
  background: #dc2626 !important;
  border: none !important;
  font-weight: 800 !important;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
}
</style>
