<template>
  <div class="pos-main-container">
    
    <header class="pos-input-area">
      <div class="input-level main-search">
        <AutoComplete 
          v-model="prodName" 
          :suggestions="suggestions" 
          @complete="search" 
          @item-select="onProductSelect" 
          optionLabel="name" 
          placeholder="Buscar producto..." 
          class="full-width-search" 
          ref="mainInput" 
        />
        <Button 
          icon="pi pi-times"
          severity="secondary"
          @click="prodName = ''"
        />
      </div>

      <div class="input-level details-row">
        <div class="detail-field qty-group">
          <label>Cant.</label>
          <InputNumber 
            v-model="prodQty" 
            :min="1" 
            class="compact-qty"
            inputClass="qty-field-inner"
          />
        </div>

        <div class="detail-field price-group">
          <label>Precio Unitario</label>
          <div class="price-input-wrapper">
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
        </div>

        <Button 
          icon="pi pi-plus" 
          @click="agregarAlCarrito" 
          :disabled="!puedeAgregar" 
          class="btn-add-line"
        />
      </div>
    </header>

    <main class="pos-cart-area custom-scrollbar">
      <div v-if="cart.length === 0" class="cart-empty-state">
        <div class="empty-info">
          <i class="pi pi-shopping-cart"></i>
          <p>Carrito disponible</p>
        </div>
        <div class="quick-access">
          <span class="quick-label">Venta Manual</span>
          <div class="quick-row">
            <InputNumber
              v-model="quickAmount"
              mode="currency"
              currency="PEN"
              locale="es-PE"
              placeholder="Monto"
              class="flex-1"
              :min-fraction-digits="2"
              @input="(e) => quickAmount = e.value"
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

      <div v-else class="cart-table-wrapper">
        <table class="cart-table">
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
                <span class="item-unit">S/ {{ item.price.toFixed(2) }} u.</span>
              </td>
              <td class="td-total">S/ {{ item.subtotal.toFixed(2) }}</td>
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
      </div>
    </main>

    <footer class="pos-footer-area">
      <div class="summary-line">
        <span class="summary-lbl">TOTAL A COBRAR</span>
        <span class="summary-val">S/ {{ totalGeneral.toFixed(2) }}</span>
      </div>

      <div class="payment-grid">
        <button
        class="pay-btn-custom cash-bg"
        @click="procesarPago('CASH', null)"
        :disabled="!puedeProcederAlPago || matcherState.isLocked"
        >
          <i class="pi pi-money-bill"></i>
          <span>EFECTIVO</span>
        </button>
        <button
        class="pay-btn-custom yape-bg"
        @click="iniciarFlujoYape"
        :disabled="!puedeProcederAlPago"
        >
          <i :class="matcherState.isListening ? 'pi pi-spin pi-spinner' : 'pi pi-qrcode'"></i>
          <span>YAPE / PLIN</span>
          <Badge v-if="matcherState.isLocked" value="!" severity="warning" class="lock-badge" />
        </button>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useProducts } from '@/composables/useProducts';
import { useMovements } from '@/composables/useMovements';
import { useYape } from '@/composables/useYape';
import { useYapeMatcher } from '@/composables/useYapeMatcher';
import { cartStorageKey } from '@/store'
import "@/assets/pospanel.css";

const { suggestions, buscarProductos } = useProducts();
const { registrarVenta } = useMovements();
const { reclamarYape } = useYape();
const { iniciarEspera, cancelarEspera, matcherState } = useYapeMatcher();
const toast = useToast();

const cart = ref([]);
const quickAmount = ref(null);
const loading = ref(false);
const prodName = ref('');
const prodQty = ref(1);
const prodPrice = ref(null);
const emit = defineEmits(['transaction-completed']);

/**
 * 
 */
watch(cartStorageKey, (newKey) => {
  cart.value = [];
  if (!newKey) return;

  const backup = localStorage.getItem(newKey);
  if (backup) {
    try {
      cart.value = JSON.parse(backup);
    } catch (e) {
      console.error("Error recuperando carrito:", e);
      localStorage.removeItem(newKey);
    }
  }
}, { immediate: true });

/**
 * 
 */
watch(cart, (newVal) => {
  const key = cartStorageKey.value;
  if(key) {
    if (newVal.length > 0) {
      localStorage.setItem(key, JSON.stringify(newVal));
      quickAmount.value = null;
    } else {
      localStorage.removeItem(key);
    }
  }
}, { deep: true });

const puedeCobrar = computed(() => {
  return cart.value.length > 0 || (quickAmount.value && quickAmount.value > 0);
})

/**
 * Valores calculados para la UI
 */
const totalGeneral = computed(() => {
  const subtotalCart = cart.value.reduce((acc, item) => acc + item.subtotal, 0);
  return subtotalCart > 0 ? subtotalCart : (quickAmount.value || 0);
});

/**
 * Método para determinar si el botón de agregar al carrito debe estar activo
 */
const puedeAgregar = computed(() => {
  const val = typeof prodName.value === 'object' ? prodName.value.name : prodName.value;
  return val && val.length > 0 && prodPrice.value >= 0;
});

/**
 * Lógica de validación de pago reactiva
 * Se habilita si hay productos en el carrito O si hay un monto manual detectado
 */
const puedeProcederAlPago = computed(() => {
  const tieneItems = cart.value.length > 0;
  const tieneMontoManual = quickAmount.value !== null && quickAmount.value > 0;
  
  return tieneItems || tieneMontoManual;
});

const search = (e) => buscarProductos(e.query);
const onProductSelect = (e) => { prodPrice.value = e.value.lastPrice; };

const agregarAlCarrito = () => {
  if (!puedeAgregar.value) return;
  const nameStr = typeof prodName.value === 'object' ? prodName.value.name : prodName.value.toUpperCase();
  
  cart.value.push({
    name: nameStr,
    qty: prodQty.value,
    price: prodPrice.value,
    subtotal: prodQty.value * prodPrice.value
  });
  
  prodName.value = '';
  prodQty.value = 1;
  prodPrice.value = null;
};

const removerItem = (idx) => cart.value.splice(idx, 1);

/**
 * Iniciar el flujo de venta con Yape
 * El matcher evita que se inicie un nuevo proceso
 */
const iniciarFlujoYape = () => {
  if (matcherState.isListening) {
    cancelarEspera();
  } else {
    iniciarEspera(totalGeneral.value);
  }
};

/**
 * Método para finalizar la venta una vez que el matcher confirma el Yape
 * @param yape - Objeto de la transacción Yape confirmada por el matcher
 */
const finalizarVentaYapeConfirmada = async (yape) => {
  await procesarPago('YAPE', yape);
};

/**
 * Método helper para prellenar el carrito con un monto específico
 * @param monto - Obj
 */
const prellenarCarrito = (monto) => {
  if (cart.value.length === 0) {
    quickAmount.value = monto;
  }
};

/**
 * Método para determinar si un movimiento es un pago con Yape basado en su metadata
 * @param method - Método de pago del movimiento
 * @param yapeConfirmado - Objeto de la transacción Yape confirmada
 */
const procesarPago = async (method, yapeConfirmado = null) => {
  loading.value = true;
  try {
    let itemsFinales = [];
    let esVentaRapida = false;

    if (cart.value.length > 0) {
        itemsFinales = cart.value;
    } else if (quickAmount.value > 0) {
        itemsFinales = [{
          name: "VENTA GENERAL",
          qty: 1,
          price: quickAmount.value,
          subtotal: quickAmount.value
        }];
        esVentaRapida = true;
    } else if (method === 'YAPE' && yapeConfirmado) {
      const montoYape = Number(yapeConfirmado.amount);
      itemsFinales = [{
        name: "VENTA YAPE DIRECTA",
        qty: 1,
        price: montoYape,
        subtotal: montoYape
      }]
    } else {
      return;
    }

    const totalReal = itemsFinales.reduce((acc, item) => acc + item.subtotal, 0);

    const payments = [{ 
      method, 
      amount: totalReal, 
      refId: method === 'YAPE' && yapeConfirmado ? yapeConfirmado.id : null 
    }];

    let nombreCliente = 'Cliente Eventual';
    if (method === 'YAPE' && yapeConfirmado) {
      nombreCliente = yapeConfirmado.senderName;
    }

    const movId = await registrarVenta({
      items: itemsFinales,
      payments,
      total: totalReal,
      clientName: method === 'YAPE' && yapeConfirmado ? yapeConfirmado.senderName : 'Cliente Eventual',
      metadata: { isQuickSale: esVentaRapida }
    });

    if (method === 'YAPE' && yapeConfirmado) {
      await reclamarYape(yapeConfirmado.id, movId);
    }

    cart.value = [];
    quickAmount.value = null;
    
    toast.add({ severity: 'success', summary: 'Venta Registrada', life: 2000 });
    emit('transaction-completed');
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.message });
  } finally {
    loading.value = false;
  }
};

defineExpose({ 
  finalizarVentaYapeConfirmada,
  prellenarCarrito,
  cart,
  totalGeneral
});
</script>