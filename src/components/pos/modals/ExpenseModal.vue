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
      <header class="expense-header">
        <div class="expense-icon-circle">
          <i class="pi pi-receipt"></i>
        </div>
        <h3 class="expense-title">Salida de Caja</h3>
      </header>

      <div class="expense-warning">
        <i class="pi pi-info-circle"></i>
        <span>El monto se descontará del efectivo actual.</span>
      </div>

      <section class="form-body">
        <div class="field-group">
          <label for="desc">Descripción</label>
          <InputText
            id="desc"
            v-model="expenseState.description"
            placeholder="¿En qué se gastó?"
            class="custom-input"
            autofocus
          />
        </div>

        <div class="field-group">
          <label for="amount">Monto del Gasto</label>
          <div class="price-input-wrapper expense-theme">
            <span class="currency">S/</span>
            <InputNumber
              id="amount"
              v-model="expenseState.amount"
              mode="decimal"
              :minFractionDigits="2"
              placeholder="0.00"
              inputClass="expense-input-inner"
              @keyup.enter="handleGuardarGasto"
            />
          </div>
        </div>
      </section>

      <footer class="expense-actions">
        <Button 
          label="CANCELAR" 
          text 
          @click="expenseState.isOpen = false" 
          class="btn-cancel" 
        />
        <Button
          label="REGISTRAR"
          @click="handleGuardarGasto"
          :loading="expenseState.loading"
          :disabled="!expenseState.description || !expenseState.amount"
          class="btn-expense"
        />
      </footer>
    </div>
  </Dialog>
</template>

<script setup>
import { useMovements } from '@/composables/operations/useMovements'
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
/* Reset de Diálogo */
:deep(.p-dialog-content) {
  padding: 0;
  border-radius: var(--radius-xl);
  overflow: hidden;
  border: 1px solid var(--color-error-soft);
  background: var(--bg-app);
}

.expense-form {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Header de Operación */
.expense-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.expense-icon-circle {
  width: 42px;
  height: 42px;
  background: var(--color-error-soft);
  color: var(--color-error-dark);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  border: 1px solid var(--color-error-border);
}

.expense-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--color-primary);
  letter-spacing: -0.02em;
}

/* Nota de advertencia sutil */
.expense-warning {
  background: var(--bg-surface);
  padding: 0.6rem 0.8rem;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  gap: 0.6rem;
  border: 1px dashed var(--color-border);
}

.expense-warning i {
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.expense-warning span {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-weight: 600;
}

/* Cuerpo del Formulario */
.form-body {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-group label {
  font-size: 0.65rem;
  font-weight: 800;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* InputText Refactorizado */
:deep(.custom-input.p-inputtext) {
  width: 100%;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--bg-surface);
  font-weight: 600;
  font-size: 0.9rem;
  padding: 0.7rem 0.8rem;
  transition: all 0.2s ease;
}

:deep(.custom-input.p-inputtext:focus) {
  border-color: var(--color-error);
  background: var(--bg-app);
  box-shadow: 0 0 0 3px var(--color-error-soft);
}

/* Contenedor Hero de Monto */
.price-input-wrapper.expense-theme {
  display: flex;
  align-items: center;
  background: var(--color-error-soft);
  border: 1px solid var(--color-error-border);
  border-radius: var(--radius-lg);
  padding: 0 1rem;
  height: 56px;
  transition: all 0.2s ease;
}

.price-input-wrapper.expense-theme:focus-within {
  border-color: var(--color-error-dark);
  background: var(--bg-app);
  box-shadow: var(--shadow-card);
}

.currency {
  font-size: 1.3rem;
  font-weight: 900;
  color: var(--color-error-dark);
  margin-right: 0.5rem;
}

:deep(.p-inputnumber) {
  flex: 1;
  display: flex;
}

/* InputNumber Interno de PrimeVue */
:deep(.p-inputtext.expense-input-inner) {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 800;
  font-size: 1.6rem;
  color: var(--color-error-dark);
  text-align: right;
  background: transparent;
  border: none;
  padding: 0;
  width: 100%;
  box-shadow: none;
}

:deep(.p-inputtext.expense-input-inner:focus) {
  outline: none;
  border: none;
  box-shadow: none;
  background: transparent;
}

/* Botones de Acción */
.expense-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}

:deep(.btn-cancel.p-button) {
  flex: 1;
  font-weight: 700;
  color: var(--color-text-muted);
}

:deep(.btn-expense.p-button) {
  flex: 2;
  background: var(--color-primary);
  color: var(--color-accent);
  border: none;
  height: 48px;
  border-radius: var(--radius-md);
  font-weight: 800;
  transition: all 0.2s ease;
}

:deep(.btn-expense.p-button:not(:disabled):hover) {
  background: var(--color-primary-mid);
  transform: translateY(-1px);
}

:deep(.btn-expense.p-button:disabled) {
  opacity: 0.5;
  background: var(--color-text-muted);
}

/* Reset global de focus en el modal */
:deep(.p-component:focus) {
  outline: none;
  box-shadow: none;
}
</style>