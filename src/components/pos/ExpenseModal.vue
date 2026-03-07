<template>
  <Dialog
    v-model:visible="expenseState.isOpen"
    modal
    appendTo="body"
    :showHeader="false"
    :style="{ width: '400px', border: 'none' }"
    class="expense-dialog"
  >
    <div class="expense-form">
      <div class="expense-header">
        <div class="expense-icon-circle">
          <i class="pi pi-receipt"></i>
        </div>
        <h3>Salida de Caja</h3>
      </div>

      <div class="expense-warning">
        <i class="pi pi-info-circle"></i>
        <span>El monto se descontará del efectivo actual.</span>
      </div>

      <div class="form-body">
        <div class="field-group">
          <label>Descripción</label>
          <InputText
            v-model="expenseState.description"
            placeholder="¿En qué se gastó?"
            class="w-full custom-input"
            autofocus
          />
        </div>

        <div class="field-group">
          <label>Monto</label>
          <div class="price-input-wrapper expense-border">
            <span class="currency">S/</span>
            <InputNumber
              v-model="expenseState.amount"
              mode="decimal"
              :minFractionDigits="2"
              placeholder="0.00"
              inputClass="expense-input-inner"
              @keyup.enter="handleGuardarGasto"
            />
          </div>
        </div>
      </div>

      <div class="expense-actions">
        <Button label="CANCELAR" text @click="expenseState.isOpen = false" class="btn-cancel" />
        <Button
          label="REGISTRAR"
          icon="pi pi-check"
          @click="handleGuardarGasto"
          :loading="expenseState.loading"
          :disabled="!expenseState.description || !expenseState.amount"
          class="btn-expense"
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
:deep(.p-dialog-content) {
  padding: 0 !important;
  border-radius: 24px !important;
  overflow: hidden;
  border: 1px solid #fee2e2;
}

.expense-form {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  background: #ffffff;
}

/* Header Compacto */
.expense-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.expense-icon-circle {
  width: 42px;
  height: 42px;
  background: #fff1f2;
  color: #e11d48;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  border: 1px solid #ffe4e6;
}

.expense-header h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
}

/* Alerta sutil */
.expense-warning {
  background: #f8fafc;
  padding: 0.6rem 0.8rem;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px dashed #e2e8f0;
}

.expense-warning i {
  color: #94a3b8;
  font-size: 0.9rem;
}

.expense-warning span {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
}

/* Cuerpo del Formulario */
.form-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field-group label {
  font-size: 0.65rem;
  font-weight: 800;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

:deep(.p-inputnumber) {
  flex: 1; /* Esto le dice: "toma todo el espacio que dejó la moneda" */
  width: 100%;
}

/* Input de Texto Personalizado */
:deep(.custom-input) {
  border-radius: 10px !important;
  border: 2px solid #f1f5f9 !important;
  background: #f8fafc !important;
  font-weight: 600 !important;
  font-size: 0.9rem !important;
  padding: 0.6rem 0.8rem !important;
}

/* Quita el anillo de enfoque global en este componente */
:deep(*:focus) {
  outline: none !important;
  box-shadow: none !important; /* A veces PrimeVue aplica una sombra azul */
}

:deep(.custom-input:focus) {
  border-color: #fca5a5 !important;
  background: #ffffff !important;
  outline: none !important;
}

/* Visor de Monto Compacto */
.price-input-wrapper.expense-border {
  display: flex;
  align-items: center;
  background: #fff1f2;
  border: 2px solid #ffe4e6;
  border-radius: 12px;
  padding: 0 1rem;
  height: 54px;
  transition: all 0.2s ease;
  overflow: hidden;
}

.price-input-wrapper.expense-border:focus-within {
  border-color: #fb7185;
  background: #ffffff;
  box-shadow: 0 4px 12px rgba(225, 29, 72, 0.08);
}

.currency {
  font-size: 1.2rem;
  font-weight: 900;
  color: #e11d48;
  margin-right: 0.5rem;
}

:deep(.expense-input-inner) {
  font-family: 'JetBrains Mono', 'IBM Plex Mono', monospace !important; /* Fuente de ancho fijo */
  font-weight: 800 !important;
  font-size: 1.5rem !important; /* Bajamos un poco si sigue desbordando */
  color: #9f1239 !important;
  text-align: right !important;
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
  width: 100% !important;
  outline: none !important;
  min-width: 0; /* TRUCO CLAVE: permite que el flex-item se encoja */
}

/* Acciones Finales */
.expense-actions {
  display: flex;
  gap: 0.75rem;
  padding-top: 0.5rem;
}

.btn-cancel {
  flex: 1;
  font-weight: 700 !important;
  color: #94a3b8 !important;
  font-size: 0.8rem !important;
}

.btn-expense {
  flex: 2;
  background: #0f172a !important; /* Usamos Slate 900 para que se vea serio */
  border: none !important;
  font-weight: 800 !important;
  height: 48px !important;
  border-radius: 12px !important;
  font-size: 0.85rem !important;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15) !important;
}

.btn-expense:hover:not(:disabled) {
  background: #1e293b !important;
  transform: translateY(-1px);
}
</style>
