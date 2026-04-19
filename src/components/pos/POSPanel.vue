<template>
  <div class="pos-main-container">
    <header class="pos-input-area">
      <div class="input-level main-search">
        <AutoComplete
          v-model="prodName"
          :suggestions="suggestions"
          @complete="search"
          @item-select="onProductSelect"
          @keyup.enter="onEnterBusqueda"
          optionLabel="name"
          placeholder="Buscar producto o escanear código..."
          class="full-width-search"
          ref="mainInput"
          :disabled="isPaymentMode"
        >
          <template #option="slotProps">
            <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
              <span>{{ slotProps.option.name }}</span>
            </div>
          </template>
        </AutoComplete>
        <Button icon="pi pi-minus-circle" severity="secondary" @click="limpiarBusqueda" :disabled="isPaymentMode" />
        <Button 
          v-if="scannedUnknownBarcode" 
          icon="pi pi-exclamation-triangle" 
          severity="warning" 
          @click="abrirModalEnlace" 
          v-tooltip.top="'Enlazar código desconocido'"
          :disabled="isPaymentMode"
        />
      </div>

      <div class="input-level details-row">
        <div class="detail-field qty-group">
          <label>Cant. ({{ unidadActual }})</label>
          <InputNumber
            v-model="prodQty"
            :min="0"
            :min-fraction-digits="unidadActual !== 'UNI' ? 2 : 0"
            :max-fraction-digits="unidadActual !== 'UNI' ? 3 : 0"
            class="compact-qty"
            inputClass="qty-field-inner"
            :disabled="isPaymentMode"
          />
        </div>

        <div class="detail-field price-group">
          <label>Precio unitario</label>
          <InputNumber
            v-model="prodPrice"
            mode="currency"
            currency="PEN"
            locale="es-PE"
            placeholder="Monto"
            class="compact-price"
            inputClass="price-field-inner"
            @keyup.enter="agregarAlCarrito"
            readonly
            :disabled="isPaymentMode"
          />
        </div>

        <Button
          icon="pi pi-cart-plus"
          @click="agregarAlCarrito"
          :disabled="!puedeAgregar || isPaymentMode"
          class="btn-add-line"
        />
      </div>
    </header>

    <main class="pos-cart-area">
      <div v-if="cart.length === 0" class="cart-empty-state">
        <div class="empty-info">
          <i class="pi pi-shopping-cart"></i>
          <p>Carrito vacío</p>
        </div>
        <div class="quick-access">
          <span class="quick-label">Venta manual</span>
          <div class="quick-row">
            <InputNumber
              v-model="quickAmount"
              mode="currency"
              currency="PEN"
              locale="es-PE"
              placeholder="Monto"
              :min-fraction-digits="2"
              :disabled="isPaymentMode"
            />
            <Button
              v-if="quickAmount"
              icon="pi pi-times"
              severity="secondary"
              @click="quickAmount = null"
              :disabled="isPaymentMode"
            />
          </div>
        </div>
      </div>

      <table v-else class="cart-table">
        <thead>
          <tr>
            <th class="th-qty">#</th>
            <th class="th-desc">Producto</th>
            <th class="th-total">Subtotal</th>
            <th class="th-action"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in cart" :key="index" class="cart-item-row">
            <td class="td-qty">{{ item.qty }}</td>
            <td class="td-desc">
              <span class="item-name">{{ item.name }}</span>
              <span class="item-unit">S/ {{ (item.price ?? 0).toFixed(2) }} x {{ item.unidad || 'UNI' }}</span>
            </td>
            <td class="td-total">S/ {{ (item.subtotal ?? 0).toFixed(2) }}</td>
            <td class="td-action">
              <Button
                icon="pi pi-trash"
                severity="danger"
                text
                rounded
                class="btn-remove-item"
                @click="removerItem(index)"
                :disabled="isPaymentMode"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </main>

    <footer class="pos-footer-area">
      <div class="summary-line">
        <span class="summary-lbl">Total a cobrar</span>
        <span class="summary-val">
          <span class="summary-currency">S/</span>
          {{ totalGeneral.toFixed(2) }}
        </span>
      </div>

      <div v-if="!isPaymentMode" class="payment-action-single">
        <button 
          class="pay-btn-custom checkout-btn" 
          @click="isPaymentMode = true"
          :disabled="!puedeProcederAlPago || matcherState.isLocked"
        >
          <i class="pi pi-check-circle"></i>
          <span>Cobrar</span>
        </button>
      </div>

      <div v-else class="payment-grid">
        <button 
          class="pay-btn-custom back-btn" 
          @click="isPaymentMode = false"
          title="Regresar"
        >
          <i class="pi pi-times"></i>
        </button>
        <button
          class="pay-btn-custom cash-btn"
          @click="procesarPago('CASH', null)"
          :disabled="!puedeProcederAlPago || matcherState.isLocked"
        >
          <i :class="loading ? 'pi pi-spin pi-spinner' : 'pi pi-money-bill'"></i>
          <span>{{ loading ? 'Procesando...' : 'Efectivo' }}</span>
        </button>
        <button
          class="pay-btn-custom yape-btn"
          @click="iniciarFlujo"
          :disabled="!puedeProcederAlPago || loading"
        >
          <i :class="matcherState.isListening || loading ? 'pi pi-spin pi-spinner' : 'pi pi-qrcode'"></i>
          <span>{{ loading ? 'Registrando...' : 'Yape / Plin' }}</span>
          <Badge v-if="matcherState.isLocked" value="!" severity="warning" class="lock-badge" />
        </button>
      </div>
    </footer>

<Dialog 
      v-model:visible="showUnknownBarcodeWizard" 
      :modal="true" 
      :style="{width: '480px'}" 
      header="Código no registrado" 
      class="custom-inventory-dialog"
      :draggable="false"
    >
      <div class="modal-form-content">
        
        <div v-if="wizardMode === 'LINK'" class="link-container">
          <div class="barcode-chip">
            <i class="pi pi-barcode"></i>
            <span>{{ scannedUnknownBarcode }}</span>
          </div>

          <div class="form-field">
            <label>Buscar producto</label>
            <AutoComplete 
              v-model="linkTarget" 
              :suggestions="suggestions" 
              @complete="searchForLink" 
              optionLabel="name" 
              placeholder="Escribe el nombre..." 
              class="w-full"
              inputClass="form-input-control"
              autofocus
            >
              <template #option="slotProps">
                <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                  <span>{{ slotProps.option.name }}</span>
                  <i v-if="slotProps.option.codEAN" class="pi pi-exclamation-triangle" style="color: var(--color-warning);" v-tooltip.left="'Este producto ya tiene un código enlazado'"></i>
                </div>
              </template>
            </AutoComplete>
            <small class="field-hint">Busca el producto al que deseas enlazar este código</small>
          </div>

          <div class="modal-footer-actions">
            <button class="btn-back" @click="showUnknownBarcodeWizard = false">
              <i class="pi pi-times"></i>
              Cancelar
            </button>
            <button 
              class="btn-confirm" 
              :disabled="!linkTarget || !linkTarget.id" 
              @click="confirmarVinculacion"
            >
              <i class="pi pi-check"></i>
              Vincular código
            </button>
          </div>
        </div>

        <div v-else-if="wizardMode === 'CONFIRM_REPLACE'" class="confirm-container">
          <div style="text-align: center; margin-bottom: 1rem;">
            <i class="pi pi-exclamation-triangle" style="font-size: 3rem; color: var(--color-warning); margin-bottom: 1rem; display: block;"></i>
            <p style="font-size: 0.9rem; margin-bottom: 1rem; color: var(--color-text-main);">
              El producto <strong>{{ linkTarget?.name }}</strong> ya tiene un código asignado. ¿Deseas reemplazarlo medir con el nuevo?
            </p>
            <div style="display: flex; gap: 1rem; justify-content: center; background: var(--bg-surface-alt); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--color-border);">
               <div style="display: flex; flex-direction: column;">
                 <span style="font-size: 0.7rem; color: var(--color-text-muted); font-weight: bold; text-transform: uppercase;">Anterior</span>
                 <span style="font-family: monospace; color: var(--color-error); text-decoration: line-through;">{{ linkTarget?.codEAN }}</span>
               </div>
               <i class="pi pi-arrow-right" style="color: var(--color-text-muted); align-self: center;"></i>
               <div style="display: flex; flex-direction: column;">
                 <span style="font-size: 0.7rem; color: var(--color-text-muted); font-weight: bold; text-transform: uppercase;">Nuevo</span>
                 <span style="font-family: monospace; color: var(--color-success); font-weight: bold;">{{ scannedUnknownBarcode }}</span>
               </div>
            </div>
          </div>

          <div class="modal-footer-actions">
            <button class="btn-back" @click="wizardMode = 'LINK'">
              <i class="pi pi-arrow-left"></i>
              Atrás
            </button>
            <button 
              class="btn-confirm"
              @click="ejecutarVinculacion"
            >
              <i class="pi pi-check"></i>
              Sí, reemplazar
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useProducts } from '@/composables/operations/useProducts'
import { useMovements } from '@/composables/operations/useMovements'
import { useDigitalPayments } from '@/composables/operations/useDigitalPayments'
import { useMatcher } from '@/composables/operations/useMatcher'
import { cartStorageKey } from '@/store'
import AutoComplete from 'primevue/autocomplete'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Badge from 'primevue/badge'
import '@/assets/pospanel.css'

const { suggestions, buscarProductos, buscarPorCodigoBarras, actualizarProducto } = useProducts()
const { registrarVenta } = useMovements()
const { reclamarPagoDigital } = useDigitalPayments()
const { iniciarEspera, cancelarEspera, matcherState } = useMatcher()
const toast = useToast()

const cart = ref([])
const quickAmount = ref(null)
const loading = ref(false)
const prodName = ref('')
const prodQty = ref(1)
const prodPrice = ref(null)
const emit = defineEmits(['transaction-completed'])

const isPaymentMode = ref(false);
const showUnknownBarcodeWizard = ref(false);
const wizardMode = ref('LINK');
const scannedUnknownBarcode = ref('');
const linkTarget = ref(null);

watch(prodName, (newVal) => {
  if (scannedUnknownBarcode.value && typeof newVal === 'string' && newVal !== scannedUnknownBarcode.value) {
    scannedUnknownBarcode.value = '';
  }
});

const limpiarBusqueda = () => {
  prodName.value = '';
  scannedUnknownBarcode.value = '';
}

const abrirModalEnlace = () => {
  wizardMode.value = 'LINK';
  linkTarget.value = null;
  showUnknownBarcodeWizard.value = true;
}

watch(
  cartStorageKey,
  (newKey) => {
    cart.value = []
    if (!newKey) return

    const backup = localStorage.getItem(newKey)
    if (backup) {
      try {
        cart.value = JSON.parse(backup)
      } catch (e) {
        console.error('Error recuperando carrito:', e)
        localStorage.removeItem(newKey)
      }
    }
  },
  { immediate: true },
)

watch(() => cart.value.length, (newLen) => {
  if (newLen === 0) {
    isPaymentMode.value = false;
  }
});

watch(
  cart,
  (newVal) => {
    const key = cartStorageKey.value
    if (key) {
      if (newVal.length > 0) {
        localStorage.setItem(key, JSON.stringify(newVal))
        quickAmount.value = null
      } else {
        localStorage.removeItem(key)
      }
    }
  },
  { deep: true },
)

const totalGeneral = computed(() => {
  const subtotalCart = cart.value.reduce((acc, item) => acc + item.subtotal, 0)
  return subtotalCart > 0 ? subtotalCart : quickAmount.value || 0
})

const puedeAgregar = computed(() => {
  const val = typeof prodName.value === 'object' ? prodName.value.name : prodName.value
  return val && val.length > 0 && prodPrice.value !== null && prodPrice.value >= 0
})

const puedeProcederAlPago = computed(() => {
  const tieneItems = cart.value.length > 0
  const tieneMontoManual = quickAmount.value !== null && quickAmount.value > 0

  return tieneItems || tieneMontoManual
})

// VARIABLE CALCULADA PARA MOSTRAR LA UNIDAD DINÁMICAMENTE
const unidadActual = computed(() => {
  if (typeof prodName.value === 'object' && prodName.value.unidad) {
    return prodName.value.unidad;
  }
  return 'UNI'; 
});

const search = async (e) => await buscarProductos(e.query)

const searchForLink = async (e) => {
  await buscarProductos(e.query);
}

const onProductSelect = (e) => {
  prodPrice.value = e.value.lastPrice
}

const onEnterBusqueda = async () => {
  const text = typeof prodName.value === 'string' ? prodName.value.trim() : '';
  
  if (text.length > 0) {
    const productByEAN = await buscarPorCodigoBarras(text);
    if (productByEAN) {
      prodName.value = productByEAN; 
      prodPrice.value = productByEAN.lastPrice;
      agregarAlCarrito();
      toast.add({ severity: 'success', summary: 'Escaneado', detail: productByEAN.name, life: 2000 });
      return;
    } else if (/^\d{4,}$/.test(text)) {
      scannedUnknownBarcode.value = text;
      toast.add({ severity: 'warn', summary: 'Código no encontrado', detail: 'Haz clic en el botón de alerta ⚠️ para enlazarlo.', life: 4000 });
      return;
    }
  }

  if (typeof prodName.value === 'object' && puedeAgregar.value) {
    agregarAlCarrito();
  }
};

const confirmarVinculacion = async () => {
    if (!linkTarget.value || !linkTarget.value.id) return;
    
    if (linkTarget.value.codEAN && linkTarget.value.codEAN !== scannedUnknownBarcode.value) {
        wizardMode.value = 'CONFIRM_REPLACE';
        return;
    }

    await ejecutarVinculacion();
};

const ejecutarVinculacion = async () => {
    await actualizarProducto(linkTarget.value.id, { codEAN: scannedUnknownBarcode.value });
    
    prodName.value = linkTarget.value; 
    prodPrice.value = linkTarget.value.lastPrice;
    agregarAlCarrito();

    toast.add({ severity: 'success', summary: 'Código Vinculado', detail: `El código se guardó en ${linkTarget.value.name}`, life: 3000 });
    showUnknownBarcodeWizard.value = false;
    wizardMode.value = 'LINK';
    scannedUnknownBarcode.value = '';
};


const agregarAlCarrito = () => {
  if (!puedeAgregar.value) return

  const isObject = typeof prodName.value === 'object'
  const nameStr = isObject ? prodName.value.name : prodName.value.toUpperCase()
  
  const prodId = isObject ? prodName.value.id : null
  const prodUnidad = isObject ? (prodName.value.unidad || 'UNI') : 'UNI'

  cart.value.push({
    id: prodId,
    name: nameStr,
    qty: prodQty.value,
    price: prodPrice.value,
    subtotal: prodQty.value * prodPrice.value,
    unidad: prodUnidad
  })

  prodName.value = ''
  prodQty.value = 1
  prodPrice.value = null
}

const removerItem = (idx) => cart.value.splice(idx, 1)

const iniciarFlujo = () => {
  if (matcherState.isListening) {
    cancelarEspera()
    toast.add({ severity: 'info', summary: 'Escucha cancelada', life: 3000 })
  } else {
    const exito = iniciarEspera(totalGeneral.value)

    if (exito) {
      toast.add({
        severity: 'info',
        summary: 'Esperando Pago Digital...',
        detail: `Monitoreando ingresos por S/ ${totalGeneral.value.toFixed(2)}`,
        life: 3000,
      })
    } else {
      toast.add({
        severity: 'warn',
        summary: 'Carrito vacío',
        detail: 'Agrega productos antes de esperar un pago.',
        life: 3000,
      })
    }
  }
}

const finalizarVentaDigitalConfirmada = async (candidato) => {
  await procesarPago('DIGITAL', candidato)
}

const prellenarCarrito = (monto) => {
  if (cart.value.length === 0) {
    quickAmount.value = monto
  }
}

const procesarPago = async (method, pagoDigitalConfirmado = null) => {
  if (loading.value) return
  loading.value = true

  try {
    let itemsFinales = []
    let esVentaRapida = false

    if (method === 'DIGITAL' && pagoDigitalConfirmado) {
      const montoValidado = Number(pagoDigitalConfirmado.amount) || 0
      itemsFinales = [
        {
          name: 'VENTA DIGITAL DIRECTA',
          qty: 1,
          price: montoValidado,
          subtotal: montoValidado,
        },
      ]
    } else if (cart.value.length > 0) {
      itemsFinales = cart.value
    } else if (quickAmount.value > 0) {
      itemsFinales = [
        {
          name: 'VENTA GENERAL',
          qty: 1,
          price: Number(quickAmount.value),
          subtotal: Number(quickAmount.value),
        },
      ]
      esVentaRapida = true
    } else {
      return
    }

    const totalReal = itemsFinales.reduce((acc, item) => acc + item.subtotal, 0)

    const payments = [
      {
        method,
        amount: totalReal,
        refId: method === 'DIGITAL' && pagoDigitalConfirmado ? pagoDigitalConfirmado.id : null,
        wallet:
          method === 'DIGITAL' && pagoDigitalConfirmado
            ? pagoDigitalConfirmado.wallet
            : method === 'DIGITAL'
              ? 'YAPE'
              : null,
      },
    ]

    let nombreCliente = 'Cliente Eventual'
    if (method === 'DIGITAL' && pagoDigitalConfirmado) {
      nombreCliente = pagoDigitalConfirmado.senderName
    }

    const resultadoVenta = await registrarVenta({
      items: itemsFinales,
      payments,
      total: totalReal,
      clientName:
        method === 'DIGITAL' && pagoDigitalConfirmado
          ? pagoDigitalConfirmado.senderName
          : 'Cliente Eventual',
      metadata: {
        isQuickSale: esVentaRapida,
        walletUsed:
          method === 'DIGITAL' && pagoDigitalConfirmado ? pagoDigitalConfirmado.wallet : null,
      },
    })

    const movId = resultadoVenta.id

    if (method === 'DIGITAL' && pagoDigitalConfirmado) {
      await reclamarPagoDigital(pagoDigitalConfirmado.id, movId)
    }

    cart.value = []
    quickAmount.value = null
    prodName.value = ''
    toast.add({ severity: 'success', summary: 'Venta exitosa', life: 3000 })

    emit('transaction-completed')
  } catch (e) {
    console.error('Error en el flujo de pago:', e)
    throw e
  } finally {
    loading.value = false
  }
}

defineExpose({
  finalizarVentaDigitalConfirmada,
  prellenarCarrito,
  cart,
  totalGeneral,
})
</script>

<style scoped>
.custom-inventory-dialog :deep(.p-dialog-header) {
  padding: 1.25rem 1.5rem;
  background: var(--bg-app);
  border-bottom: 1px solid var(--color-border);
  font-weight: 800;
  font-size: 1.1rem;
  color: var(--color-text-main);
}

.custom-inventory-dialog :deep(.p-dialog-content) {
  padding: 1.5rem;
}

.modal-form-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* ========== CHOOSE MODE ========== */
.choose-container {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.barcode-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: var(--bg-surface-alt);
  padding: 1rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}

.barcode-icon {
  width: 48px;
  height: 48px;
  background: var(--color-primary-soft);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.barcode-icon i {
  font-size: 1.5rem;
  color: var(--color-primary);
}

.barcode-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.barcode-label {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--color-text-muted);
  letter-spacing: 0.5px;
}

.barcode-value {
  font-size: 1rem;
  font-family: monospace;
  color: var(--color-text-main);
  word-break: break-all;
}

.divider {
  height: 1px;
  background: var(--color-border);
  margin: 0.25rem 0;
}

.info-text {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  text-align: center;
  margin: 0;
  padding: 0 0.5rem;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.action-link,
.action-create {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--bg-app);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease;
  width: 100%;
}

.action-link i,
.action-create i {
  font-size: 1.1rem;
}

.action-link {
  color: var(--color-text-main);
}

.action-link:hover {
  border-color: var(--color-primary);
  background: var(--bg-surface-alt);
}

.action-create {
  background: var(--color-primary);
  color: var(--color-accent);
  border-color: var(--color-primary);
}

.action-create:hover {
  background: var(--color-primary-hover);
}

/* ========== LINK & CREATE MODES ========== */
.link-container,
.create-container {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.barcode-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--bg-surface-alt);
  border: 1px solid var(--color-border);
  border-radius: 99px;
  font-size: 0.8rem;
  font-family: monospace;
  width: fit-content;
}

.barcode-chip i {
  font-size: 0.9rem;
  color: var(--color-primary);
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-text-main);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-field small.field-hint {
  font-size: 0.7rem;
  color: var(--color-text-muted);
}

.form-row-2cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  align-items: flex-start;
}

.uppercase-input {
  text-transform: uppercase;
}

/* INPUTS CONSISTENTES - Esto arregla el tamaño desigual */
:deep(.form-input-control),
:deep(.form-select-control) {
  width: 100%;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--bg-surface-alt);
  transition: all 0.2s ease;
  height: 42px; /* Forzamos la misma altura para ambos */
  box-shadow: none;
}

:deep(.form-input-control) {
  padding: 0.6rem 0.75rem;
}

:deep(.form-select-control .p-select-label) {
  padding: 0.6rem 0.75rem;
  display: flex;
  align-items: center;
}

:deep(.form-input-control:focus),
:deep(.form-select-control.p-focus) {
  border-color: var(--color-primary);
  outline: none;
  box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.08);
}

/* ========== FOOTER ACTIONS - TUS BOTONES ORIGINALES ========== */
.modal-footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.btn-back {
  padding: 0.5rem 1rem;
  background: transparent;
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  height: 40px;
}

.btn-back:hover {
  background: var(--color-error-soft);
  border-color: var(--color-error);
  color: var(--color-error-dark);
}

.btn-confirm {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: var(--color-primary);
  color: var(--color-accent);
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.2s ease;
  height: 40px;
}

.btn-confirm:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 520px) {
  .form-row-2cols {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .modal-footer-actions {
    flex-direction: column-reverse;
  }
  
  .btn-back,
  .btn-confirm {
    width: 100%;
    justify-content: center;
  }
}
</style>