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
          :disabled="paymentModeActivo"
        />
        <Button icon="pi pi-trash" severity="danger" @click="confirmarLimpiarCarrito" :disabled="(cart.length === 0 && quickAmount === null) || partialPayments.some(p => p.method === 'DIGITAL')" v-tooltip.bottom="'Cancelar Venta y vaciar carrito'" />
      </div>

      <div class="input-level details-row">
        <div class="detail-field qty-group">
          <label>Cant. ({{ unidadActual }})</label>
          <InputNumber
            v-model="prodQty"
            :min="1"
            class="compact-qty"
            inputClass="qty-field-inner"
            :disabled="paymentModeActivo"
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
            :disabled="paymentModeActivo"
          />
        </div>

        <Button
          icon="pi pi-cart-plus"
          @click="agregarAlCarrito"
          :disabled="!puedeAgregar || paymentModeActivo"
          class="btn-add-line"
        />
      </div>
    </header>

    <main class="pos-cart-area">
      <div v-if="transactionCompletedMode" class="transaction-success-state" @click="completarYPonerSiguiente" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; cursor: pointer; text-align: center; animation: fadeIn 0.3s ease;">
        <i class="pi pi-check-circle success-icon text-primary" style="font-size: 4rem; margin-bottom: 1rem;"></i>
        <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem;">¡Venta Completada!</h2>
        <div class="vuelto-display" style="margin: 1.5rem 0; padding: 1.5rem; background: var(--bg-surface-alt); border-radius: var(--radius-lg); border: 2px dashed var(--color-border); min-width: 300px; text-align: center;">
          <span class="vuelto-label" style="display: block; color: var(--color-text-muted); font-size: 1rem; text-transform: uppercase; font-weight: 700; margin-bottom: 0.5rem; letter-spacing: 1px;">Vuelto a entregar</span>
          <span class="vuelto-amount" style="display: block; color: var(--color-primary); font-size: 3.5rem; font-weight: 800; line-height: 1;">S/ {{ vueltoGenerado.toFixed(2) }}</span>
        </div>
        <p class="next-action-hint" style="color: var(--color-text-muted); font-size: 1.1rem;">Presione <strong style="color: var(--color-text); background: var(--bg-surface-alt); padding: 0.2rem 0.5rem; border-radius: 4px; border: 1px solid var(--color-border);">ENTER</strong> (o haga clic) para la siguiente venta</p>
      </div>

      <div v-else-if="cart.length === 0" class="cart-empty-state">
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
            />
            <Button
              v-if="quickAmount"
              icon="pi pi-times"
              severity="secondary"
              @click="quickAmount = null"
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
                :disabled="paymentModeActivo"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </main>

    <footer class="pos-footer-area" v-if="!transactionCompletedMode">
      <div class="summary-line">
        <span class="summary-lbl">Total a cobrar</span>
        <div class="summary-val-wrap">
          <span class="summary-val">
            <span class="summary-currency">S/</span>
            {{ totalGeneral.toFixed(2) }}
          </span>
          <Button 
            v-if="cart.length > 0 || quickAmount > 0"
            :label="paymentModeActivo ? 'Cancelar' : 'Cobrar'" 
            :icon="paymentModeActivo ? 'pi pi-times' : 'pi pi-check'" 
            :class="paymentModeActivo ? 'p-button-danger ml-2' : 'gold-cobrar-btn ml-2'"
            @click="togglePaymentMode"
            size="small"
            :disabled="paymentModeActivo && partialPayments.some(p => p.method === 'DIGITAL')"
          />
        </div>
      </div>

      <div class="inline-payment-section" v-if="paymentModeActivo && (cart.length > 0 || quickAmount > 0)">
        <div class="partial-payments-list" v-if="partialPayments.length > 0">
          <div v-for="(pago, i) in partialPayments" :key="i" class="partial-payment-item">
            <span>{{ pago.method === 'CASH' ? 'Efectivo' : 'Yape/Plin' }}</span>
            <span>S/ {{ pago.amount.toFixed(2) }}</span>
          </div>
        </div>

        <div class="payment-action-row">
          <div class="saldo-pend-bloque">
            <label>{{ saldoPendiente >= 0 ? 'Saldo' : 'Vuelto' }}:</label>
            <span :class="saldoPendiente >= 0 ? 'text-primary' : 'text-success'">
              S/ {{ Math.abs(saldoPendiente).toFixed(2) }}
            </span>
          </div>

          <div class="input-monto-bloque">
            <InputNumber 
              v-model="paymentAmountToApply" 
              mode="currency" 
              currency="PEN" 
              locale="es-PE"
              class="cash-input-inline"
              placeholder="Monto exacto"
              :minFractionDigits="2"
            />
          </div>
        </div>
      </div>

      <div class="payment-grid mt-2" v-if="paymentModeActivo">
        <button
          class="pay-btn-custom cash-btn"
          @click="registrarPagoEfectivo"
          :disabled="!puedeProcederAlPago || matcherState.isLocked"
        >
          <i :class="loading ? 'pi pi-spin pi-spinner' : 'pi pi-money-bill'"></i>
          <span>{{ loading ? 'Proces...' : 'Efectivo' }}</span>
        </button>
        <button
          class="pay-btn-custom yape-btn"
          @click="iniciarFlujo"
          :disabled="!puedeProcederAlPago || loading"
        >
          <i :class="matcherState.isListening || loading ? 'pi pi-spin pi-spinner' : 'pi pi-qrcode'"></i>
          <span>{{ loading ? 'Registr...' : 'Yape / Plin' }}</span>
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
        
        <div v-if="wizardMode === 'CHOOSE'" class="choose-container">
          <div class="barcode-header">
            <div class="barcode-icon">
              <i class="pi pi-barcode"></i>
            </div>
            <div class="barcode-info">
              <span class="barcode-label">Código escaneado</span>
              <strong class="barcode-value">{{ scannedUnknownBarcode }}</strong>
            </div>
          </div>

          <div class="divider"></div>

          <p class="info-text">Este código no existe en tu inventario. ¿Qué deseas hacer?</p>
          
          <div class="action-buttons">
            <button class="action-link" @click="wizardMode = 'LINK'">
              <i class="pi pi-link"></i>
              <span>Enlazar a producto existente</span>
            </button>
            <button class="action-create" @click="wizardMode = 'CREATE'">
              <i class="pi pi-plus-circle"></i>
              <span>Crear producto nuevo</span>
            </button>
          </div>
        </div>

        <div v-else-if="wizardMode === 'LINK'" class="link-container">
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
            />
            <small class="field-hint">Solo muestra productos sin código de barras</small>
          </div>

          <div class="modal-footer-actions">
            <button class="btn-back" @click="wizardMode = 'CHOOSE'">
              <i class="pi pi-arrow-left"></i>
              Atrás
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

        <div v-else-if="wizardMode === 'CREATE'" class="create-container">
          <div class="barcode-chip">
            <i class="pi pi-barcode"></i>
            <span>{{ scannedUnknownBarcode }}</span>
          </div>

          <div class="form-field">
            <label>Nombre del producto *</label>
            <InputText 
              v-model="newProdName" 
              autofocus 
              placeholder="Ej. Galletas Soda" 
              class="uppercase-input form-input-control"
            />
          </div>
          
          <div class="form-row-2cols">
            <div class="form-field">
              <label>Precio *</label>
              <InputNumber 
                v-model="newProdPrice" 
                mode="currency" 
                currency="PEN" 
                locale="es-PE"
                inputClass="form-input-control"
              />
            </div>
            <div class="form-field">
              <label>Unidad de medida</label>
              <Select 
                v-model="newProdUnidad" 
                :options="PRODUCT_UNITS" 
                optionLabel="label" 
                optionValue="value"
                class="form-select-control"
              />
            </div>
          </div>

          <div class="modal-footer-actions">
            <button class="btn-back" @click="wizardMode = 'CHOOSE'">
              <i class="pi pi-arrow-left"></i>
              Atrás
            </button>
            <button 
              class="btn-confirm" 
              :disabled="!newProdName || newProdPrice === null" 
              @click="confirmarCreacion"
            >
              <i class="pi pi-save"></i>
              Guardar producto
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { useProducts } from '@/composables/operations/useProducts'
import { useMovements } from '@/composables/operations/useMovements'
import { useDigitalPayments } from '@/composables/operations/useDigitalPayments'
import { useMatcher } from '@/composables/operations/useMatcher'
import { cartStorageKey } from '@/store'
import Select from 'primevue/select'
import AutoComplete from 'primevue/autocomplete'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Badge from 'primevue/badge'
import { PRODUCT_UNITS } from '@/utils/constants'
import '@/assets/pospanel.css'

const { suggestions, buscarProductos, buscarPorCodigoBarras, actualizarProducto, crearProducto } = useProducts()
const { registrarVenta, registrarVentaCancelada } = useMovements()
const { reclamarPagoDigital } = useDigitalPayments()
const { iniciarEspera, cancelarEspera, matcherState } = useMatcher()
const toast = useToast()
const confirm = useConfirm()

const confirmarLimpiarCarrito = () => {
    confirm.require({
        message: '¿Estás seguro que deseas cancelar esta venta y vaciar el carrito por completo?',
        header: 'Confirmar Cancelación',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        rejectLabel: 'Volver',
        acceptLabel: 'Sí, cancelar venta',
        accept: async () => {
          if (partialPayments.value.length > 0) {
              await registrarVentaCancelada({
                  items: cart.value,
                  payments: partialPayments.value,
                  total: totalGeneral.value,
                  clientName: 'Cancelada por Cajero'
              })
              toast.add({ severity: 'info', summary: 'Venta Anulada', detail: 'La venta parcial en efectivo fue registrada como anulada.', life: 3000 })
          } else {
              toast.add({ severity: 'info', summary: 'Venta descartada', detail: 'El carrito se limpió por completo.', life: 3000 })
          }

          cart.value = []
          quickAmount.value = null
          prodName.value = ''
          partialPayments.value = []
          paymentAmountToApply.value = null
          paymentModeActivo.value = false
        }
    })
}

const cart = ref([])
const quickAmount = ref(null)
const loading = ref(false)
const prodName = ref('')
const prodQty = ref(1)
const prodPrice = ref(null)
const emit = defineEmits(['transaction-completed'])

const partialPayments = ref([])
const paymentAmountToApply = ref(null)
const paymentModeActivo = ref(false)
const transactionCompletedMode = ref(false)
const vueltoGenerado = ref(0)

const handleGlobalKeydown = (e) => {
  if (transactionCompletedMode.value && e.key === 'Enter') {
    e.preventDefault()
    completarYPonerSiguiente()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})

const completarYPonerSiguiente = () => {
    cart.value = []
    quickAmount.value = null
    prodName.value = ''
    partialPayments.value = []
    paymentAmountToApply.value = null
    paymentModeActivo.value = false
    transactionCompletedMode.value = false
    vueltoGenerado.value = 0
    emit('transaction-completed')
}

const togglePaymentMode = async () => {
    if (paymentModeActivo.value) {
        const tieneYapeo = partialPayments.value.some(p => p.method === 'DIGITAL')
        if (tieneYapeo) {
            toast.add({ severity: 'warn', summary: 'Acción bloqueada', detail: 'Ya existe un Yapeo registrado. Termine de cobrar.', life: 3000 })
            return
        }

        paymentModeActivo.value = false;
        partialPayments.value = [];
        paymentAmountToApply.value = null;
    } else {
        paymentModeActivo.value = true;
    }
}

const saldoPendiente = computed(() => {
  const sumPartials = partialPayments.value.reduce((acc, p) => acc + p.amount, 0)
  return totalGeneral.value - sumPartials
})

const showUnknownBarcodeWizard = ref(false);
const wizardMode = ref('CHOOSE');
const scannedUnknownBarcode = ref('');
const linkTarget = ref(null);
const newProdName = ref('');
const newProdPrice = ref(null);
const newProdUnidad = ref('UNI');

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

  return (tieneItems || tieneMontoManual) && saldoPendiente.value > 0
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
  suggestions.value = suggestions.value.filter(p => !p.codEAN || p.codEAN.trim() === '');
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
      wizardMode.value = 'CHOOSE';
      linkTarget.value = null;
      newProdName.value = '';
      newProdPrice.value = null;
      newProdUnidad.value = 'UNI';
      showUnknownBarcodeWizard.value = true;
      prodName.value = ''; 
      return;
    }
  }

  if (typeof prodName.value === 'object' && puedeAgregar.value) {
    agregarAlCarrito();
  }
};

const confirmarVinculacion = async () => {
    if (!linkTarget.value || !linkTarget.value.id) return;
    
    await actualizarProducto(linkTarget.value.id, { codEAN: scannedUnknownBarcode.value });
    
    prodName.value = linkTarget.value; 
    prodPrice.value = linkTarget.value.lastPrice;
    agregarAlCarrito();

    toast.add({ severity: 'success', summary: 'Código Vinculado', detail: `El código se guardó en ${linkTarget.value.name}`, life: 3000 });
    showUnknownBarcodeWizard.value = false;
};

const confirmarCreacion = async () => {
    if (!newProdName.value || newProdPrice.value === null) return;

    const savedProd = await crearProducto({
        name: newProdName.value.toUpperCase().trim(),
        lastPrice: newProdPrice.value,
        codEAN: scannedUnknownBarcode.value,
        stock: 0,
        unidad: newProdUnidad.value 
    });

    if (savedProd) {
        prodName.value = savedProd; 
        prodPrice.value = savedProd.lastPrice;
        agregarAlCarrito();
        toast.add({ severity: 'success', summary: 'Producto Creado', detail: savedProd.name, life: 3000 });
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el producto', life: 3000 });
    }
    
    showUnknownBarcodeWizard.value = false;
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
    const amountEsperado = paymentAmountToApply.value || saldoPendiente.value;
    const exito = iniciarEspera(amountEsperado)

    if (exito) {
      toast.add({
        severity: 'info',
        summary: 'Esperando Pago Digital...',
        detail: `Monitoreando ingresos por S/ ${amountEsperado.toFixed(2)}`,
        life: 3000,
      })
    } else {
      toast.add({
        severity: 'warn',
        summary: 'Carrito vacío o sin saldo pendiente',
        detail: 'Agrega productos antes de esperar un pago.',
        life: 3000,
      })
    }
  }
}

const registrarPagoEfectivo = () => {
    let amt = paymentAmountToApply.value || saldoPendiente.value;
    if (amt <= 0) return;
    
    let vueltoCalculado = amt - saldoPendiente.value;
    if(vueltoCalculado < 0) vueltoCalculado = 0;

    // Si paga de mas, solo guardamos lo que falta para el saldo para registrar la venta limpia
    const realApplied = Math.min(amt, saldoPendiente.value);

    partialPayments.value.push({ method: 'CASH', amount: realApplied });
    paymentAmountToApply.value = null; // reset
    
    evaluarCierreVenta(vueltoCalculado);
}

const finalizarVentaDigitalConfirmada = async (candidato) => {
    const validAmount = Number(candidato.amount);
    let vueltoCalculado = validAmount - saldoPendiente.value;
    if(vueltoCalculado < 0) vueltoCalculado = 0;

    const realApplied = Math.min(validAmount, saldoPendiente.value);
    
    partialPayments.value.push({
        method: 'DIGITAL',
        amount: realApplied,
        pagoDigitalInfo: candidato
    });
    
    paymentAmountToApply.value = null;
    evaluarCierreVenta(vueltoCalculado);
}

const evaluarCierreVenta = async (vueltoCalculado = 0) => {
    if (saldoPendiente.value <= 0) {
        await procesarVentaParciales(vueltoCalculado)
    }
}

const prellenarCarrito = (monto) => {
  if (cart.value.length === 0) {
    quickAmount.value = monto
  }
}

const procesarVentaParciales = async (vueltoCalculado = 0) => {
  if (loading.value) return
  loading.value = true

  try {
    let itemsFinales = []
    let esVentaRapida = false

    if (cart.value.length > 0) {
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
      if (partialPayments.value.length === 1 && partialPayments.value[0].method === 'DIGITAL') {
          itemsFinales = [{
              name: 'VENTA DIGITAL DIRECTA',
              qty: 1,
              price: partialPayments.value[0].amount,
              subtotal: partialPayments.value[0].amount
          }]
      } else {
          return
      }
    }

    const totalReal = itemsFinales.reduce((acc, item) => acc + item.subtotal, 0)
    
    // Convertir partialPayments a structure for registrarVenta
    const payments = partialPayments.value.map(p => {
        if (p.method === 'CASH') {
            return { method: 'CASH', amount: p.amount, refId: null, wallet: null }
        } else {
            return {
                method: 'DIGITAL',
                amount: p.amount,
                refId: p.pagoDigitalInfo ? p.pagoDigitalInfo.id : null,
                wallet: p.pagoDigitalInfo ? p.pagoDigitalInfo.wallet : 'YAPE'
            }
        }
    })

    let nombreCliente = 'Cliente Eventual'
    const digitalPayment = partialPayments.value.find(p => p.method === 'DIGITAL')
    if (digitalPayment && digitalPayment.pagoDigitalInfo) {
        nombreCliente = digitalPayment.pagoDigitalInfo.senderName
    }

    const resultadoVenta = await registrarVenta({
      items: itemsFinales,
      payments,
      total: totalReal,
      clientName: nombreCliente,
      metadata: {
        isQuickSale: esVentaRapida,
        walletUsed: digitalPayment && digitalPayment.pagoDigitalInfo ? digitalPayment.pagoDigitalInfo.wallet : null,
      },
    })

    const movId = resultadoVenta.id

    for (const p of partialPayments.value) {
        if (p.method === 'DIGITAL' && p.pagoDigitalInfo) {
            await reclamarPagoDigital(p.pagoDigitalInfo.id, movId)
        }
    }

    vueltoGenerado.value = vueltoCalculado;
    transactionCompletedMode.value = true;
    
    toast.add({ severity: 'success', summary: 'Venta exitosa', life: 3000 })
  } catch (e) {
    console.error('Error en el flujo de pago mixto:', e)
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
.summary-val-wrap {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.gold-cobrar-btn {
  background-color: #d4af37 !important;
  border-color: #d4af37 !important;
  color: #000 !important;
  font-weight: 800;
  transition: all 0.2s ease;
}

.gold-cobrar-btn:hover {
  background-color: #b5952f !important;
  border-color: #b5952f !important;
  transform: translateY(-1px);
}

.ml-2 { margin-left: 0.5rem; }

.inline-payment-section {
  background: var(--bg-surface-alt);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1rem;
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.partial-payments-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  border-bottom: 1px dashed var(--color-border);
  padding-bottom: 0.75rem;
  margin-bottom: 0.25rem;
}

.partial-payment-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-muted);
}

.payment-action-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.saldo-pend-bloque {
  display: flex;
  flex-direction: column;
}

.saldo-pend-bloque label {
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--color-text-muted);
  letter-spacing: 0.5px;
}

.saldo-pend-bloque span {
  font-size: 1.5rem;
  font-weight: 800;
}

.text-primary {
  color: var(--color-primary);
}

.text-success {
  color: #10b981; 
}

.input-monto-bloque {
  flex: 1;
  max-width: 140px;
}

.cash-input-inline :deep(.p-inputtext) {
  width: 100%;
  font-size: 1.1rem !important;
  font-weight: 700 !important;
  padding: 0.5rem 0.5rem !important;
  text-align: right;
  border-radius: var(--radius-md);
}

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