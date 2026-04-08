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
        />
        <Button icon="pi pi-minus-circle" severity="secondary" @click="prodName = ''" />
      </div>

      <div class="input-level details-row">
        <div class="detail-field qty-group">
          <label>Cant. ({{ unidadActual }})</label>
          <InputNumber
            v-model="prodQty"
            :min="1"
            class="compact-qty"
            inputClass="qty-field-inner"
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
          />
        </div>

        <Button
          icon="pi pi-cart-plus"
          @click="agregarAlCarrito"
          :disabled="!puedeAgregar"
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

      <div class="payment-grid">
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

    <Dialog v-model:visible="showUnknownBarcodeWizard" :modal="true" :style="{width: '450px'}" header="Código Detectado" class="p-fluid">
      
      <div v-if="wizardMode === 'CHOOSE'" class="text-center py-4">
        <i class="pi pi-question-circle text-5xl text-orange-500 mb-4 block"></i>
        <p class="mb-5 text-lg">El código <strong>{{ scannedUnknownBarcode }}</strong> no está en tu inventario. ¿Qué deseas hacer?</p>
        <div class="flex flex-col gap-3">
          <Button label="Enlazar a producto existente" icon="pi pi-link" outlined @click="wizardMode = 'LINK'" />
          <Button label="Crear producto nuevo" icon="pi pi-plus" severity="success" @click="wizardMode = 'CREATE'" />
        </div>
      </div>

      <div v-else-if="wizardMode === 'LINK'">
        <p class="mb-4 text-sm text-slate-600">Busca el producto de tu inventario al cual le guardaremos el código permanente <strong>{{ scannedUnknownBarcode }}</strong>.</p>
        <div class="field mb-5">
          <label class="font-bold block mb-2">Buscar Producto Físico</label>
          <AutoComplete 
            v-model="linkTarget" 
            :suggestions="suggestions" 
            @complete="search" 
            optionLabel="name" 
            placeholder="Escribe su nombre..." 
            class="w-full"
            autofocus
          />
        </div>
        <div class="flex justify-between gap-2 mt-4">
          <Button label="Atrás" icon="pi pi-arrow-left" text severity="secondary" @click="wizardMode = 'CHOOSE'" />
          <Button label="Vincular y Cobrar" icon="pi pi-check" :disabled="!linkTarget || !linkTarget.id" @click="confirmarVinculacion" />
        </div>
      </div>

      <div v-else-if="wizardMode === 'CREATE'">
        <p class="mb-4 text-sm text-slate-600">Este producto quedará guardado para siempre en tu inventario y saltará directamente al carrito.</p>
        
        <div class="field mb-3">
          <label class="font-bold block mb-1">Nombre</label>
          <InputText v-model="newProdName" autofocus placeholder="Ej. Galletas Soda" class="w-full" />
        </div>
        
        <div style="display: flex; gap: 1rem; margin-bottom: 1rem; width: 100%;">
          <div style="flex: 1;">
            <label class="font-bold block mb-1">Precio Unitario</label>
            <InputNumber v-model="newProdPrice" mode="currency" currency="PEN" locale="es-PE" placeholder="0.00" style="width: 100%;" />
          </div>
          <div style="flex: 1;">
            <label class="font-bold block mb-1">Medida</label>
            <Select 
              v-model="newProdUnidad" 
              :options="PRODUCT_UNITS" 
              optionLabel="label" 
              optionValue="value" 
              style="width: 100%;" 
            />
          </div>
        </div>

        <div class="flex justify-between gap-2 mt-4">
          <Button label="Atrás" icon="pi pi-arrow-left" text severity="secondary" @click="wizardMode = 'CHOOSE'" />
          <Button label="Guardar y Cobrar" icon="pi pi-check" severity="success" :disabled="!newProdName || newProdPrice === null" @click="confirmarCreacion" />
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
import Select from 'primevue/select'
import { PRODUCT_UNITS } from '@/utils/constants'
import '@/assets/pospanel.css'

const { suggestions, buscarProductos, buscarPorCodigoBarras, actualizarProducto, crearProducto } = useProducts()
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

  return tieneItems || tieneMontoManual
})

// VARIABLE CALCULADA PARA MOSTRAR LA UNIDAD DINÁMICAMENTE
const unidadActual = computed(() => {
  if (typeof prodName.value === 'object' && prodName.value.unidad) {
    return prodName.value.unidad;
  }
  return 'UNI'; // Valor por defecto
});

const search = (e) => buscarProductos(e.query)
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