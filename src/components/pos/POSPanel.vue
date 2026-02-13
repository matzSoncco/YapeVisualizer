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
            <span class="currency">S/</span>
            <InputNumber 
              v-model="prodPrice" 
              mode="decimal" 
              :minFractionDigits="2" 
              placeholder="0.00" 
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
          <span class="quick-label">Venta Directa</span>
          <div class="quick-row">
            <InputNumber v-model="quickAmount" mode="currency" currency="PEN" placeholder="Monto" class="flex-1" />
            <Button icon="pi pi-bolt" severity="warning" @click="procesarVentaRapida" :disabled="!quickAmount" />
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
        <button class="pay-btn-custom cash-bg" @click="procesarPago('CASH', null)" :disabled="totalGeneral <= 0 || matcherState.isLocked">
          <i class="pi pi-money-bill"></i>
          <span>EFECTIVO</span>
        </button>
        <button class="pay-btn-custom yape-bg" @click="iniciarFlujoYape" :disabled="totalGeneral <= 0">
          <i :class="matcherState.isListening ? 'pi pi-spin pi-spinner' : 'pi pi-qrcode'"></i>
          <span>YAPE / PLIN</span>
          <Badge v-if="matcherState.isLocked" value="!" severity="warning" class="lock-badge" />
        </button>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useProducts } from '@/composables/useProducts';
import { useMovements } from '@/composables/useMovements';
import { useYape } from '@/composables/useYape';
import { useYapeMatcher } from '@/composables/useYapeMatcher';
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

/**
 * Persistencia de datos en localStorage
 * Watch para guardar el carrito cada vez que cambie
 */
onMounted(() => {
    const backup = localStorage.getItem('pos_cart_backup');
    if (backup) {
        try { cart.value = JSON.parse(backup); } catch (e) { localStorage.removeItem('pos_cart_backup'); }
    }
});

watch(cart, (val) => {
    localStorage.setItem('pos_cart_backup', JSON.stringify(val));
    if (val.length > 0) quickAmount.value = null;
}, { deep: true });

/**
 * Valores calculados para la UI
 */
const totalGeneral = computed(() => {
    if (cart.value.length > 0) {
        return cart.value.reduce((acc, item) => acc + item.subtotal, 0);
    }
    return quickAmount.value || 0;
});

/**
 * Método para determinar si el botón de agregar al carrito debe estar activo
 */
const puedeAgregar = computed(() => {
    const val = typeof prodName.value === 'object' ? prodName.value.name : prodName.value;
    return val && val.length > 0 && prodPrice.value >= 0;
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
const procesarVentaRapida = () => { if (!quickAmount.value) return; toast.add({ severity: 'info', summary: 'Modo Rápido', detail: 'Seleccione método de pago abajo' }); };

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
            itemsFinales = [{ name: "VENTA GENERAL", qty: 1, price: quickAmount.value, subtotal: quickAmount.value }];
            esVentaRapida = true;
        } else {
            return;
        }

        const payments = [{ 
            method, 
            amount: totalGeneral.value, 
            refId: method === 'YAPE' && yapeConfirmado ? yapeConfirmado.id : null 
        }];

        let nombreCliente = 'Cliente Eventual';
        if (method === 'YAPE' && yapeConfirmado) {
            nombreCliente = yapeConfirmado.senderName;
        }

        const movId = await registrarVenta({
            items: itemsFinales,
            payments,
            total: totalGeneral.value,
            clientName: nombreCliente,
            metadata: { isQuickSale: esVentaRapida }
        });

        if (method === 'YAPE' && yapeConfirmado) {
            await reclamarYape(yapeConfirmado.id, movId);
        }

        cart.value = [];
        quickAmount.value = null;
        localStorage.removeItem('pos_cart_backup');
        
        toast.add({ severity: 'success', summary: 'Venta Registrada', life: 2000 });

    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: e.message });
    } finally {
        loading.value = false;
    }
};

defineExpose({ 
    finalizarVentaYapeConfirmada,
    prellenarCarrito,
    totalGeneral
});
</script>