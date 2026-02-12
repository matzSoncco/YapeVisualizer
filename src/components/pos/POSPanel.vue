<template>
  <div class="pos-container">
    <div class="pos-header">
      <div class="search-section">
        <AutoComplete 
          v-model="prodName" 
          :suggestions="suggestions" 
          @complete="search" 
          @item-select="onProductSelect" 
          optionLabel="name" 
          placeholder="Buscar producto..." 
          class="product-search" 
          inputClass="product-search-input" 
          ref="mainInput" 
        />
        <InputNumber 
          v-model="prodQty" 
          :min="1" 
          showButtons 
          buttonLayout="horizontal" 
          inputClass="qty-input" 
          class="product-qty"
        />
      </div>
      <div class="price-section">
        <div class="price-input-wrapper">
          <span class="currency-symbol">S/</span>
          <InputNumber 
            v-model="prodPrice" 
            mode="currency" 
            currency="PEN" 
            locale="es-PE" 
            placeholder="Precio" 
            class="product-price" 
            inputClass="price-input" 
            :min="0" 
            @keyup.enter="agregarAlCarrito" 
          />
        </div>
        <Button 
          icon="pi pi-plus" 
          class="add-btn" 
          @click="agregarAlCarrito" 
          :disabled="!puedeAgregar" 
        />
      </div>
    </div>

    <div class="pos-cart">
      <div v-if="cart.length === 0" class="empty-cart">
        <div class="empty-icon">
          <i class="pi pi-shopping-cart"></i>
          <p>Carrito vacío</p>
        </div>
        <div class="quick-sale-section">
          <p class="quick-sale-title">Venta Rápida</p>
          <div class="quick-sale-input">
            <InputNumber 
              v-model="quickAmount" 
              mode="currency" 
              currency="PEN" 
              locale="es-PE" 
              placeholder="Monto Total" 
              class="quick-amount" 
              inputClass="quick-amount-input" 
            />
            <Button 
              icon="pi pi-check" 
              severity="warning" 
              :disabled="!quickAmount || quickAmount <= 0" 
              @click="procesarVentaRapida" 
            />
          </div>
        </div>
      </div>
      
      <table v-else class="cart-table">
        <tbody>
          <tr v-for="(item, index) in cart" :key="index" class="cart-item">
            <td class="item-qty">{{ item.qty }}</td>
            <td class="item-details">
              <div class="item-name">{{ item.name }}</div>
              <div class="item-price">{{ item.price.toFixed(2) }}</div>
            </td>
            <td class="item-subtotal">{{ item.subtotal.toFixed(2) }}</td>
            <td class="item-remove">
              <i class="pi pi-times" @click="removerItem(index)"></i>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pos-footer">
      <div class="total-section">
        <span class="total-label">Total a Pagar</span>
        <span class="total-amount">S/ {{ totalGeneral.toFixed(2) }}</span>
      </div>

      <div class="payment-buttons">
        <Button 
          severity="success" 
          class="payment-btn cash-btn" 
          :disabled="totalGeneral <= 0 || matcherState.isLocked" 
          :loading="loading" 
          @click="procesarPago('CASH', null)"
        >
          <i class="pi pi-money-bill"></i> 
          {{ matcherState.isLocked ? 'BLOQUEADO' : 'EFECTIVO' }}
        </Button>
        
        <Button 
          severity="help" 
          class="payment-btn yape-btn" 
          :disabled="totalGeneral <= 0" 
          :loading="loading" 
          @click="iniciarFlujoYape"
        >
          <i :class="matcherState.isListening ? 'pi pi-spin pi-spinner' : 'pi pi-qrcode'"></i> 
          {{ matcherState.isListening ? 'ESPERANDO...' : 'YAPE' }}
          <Badge v-if="matcherState.isLocked" value="!" severity="warning" class="yape-badge" />
        </Button>
      </div>
      
      <div v-if="matcherState.isLocked" class="unlock-section">
        <Button 
          label="Desvincular Yape para usar Efectivo" 
          icon="pi pi-times" 
          class="unlock-btn" 
          @click="cancelarEspera" 
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useProducts } from '@/composables/useProducts';
import { useMovements } from '@/composables/useMovements';
import { useYape } from '@/composables/useYape';
import { useYapeMatcher } from '@/composables/useYapeMatcher';
import '@/assets/pospanel.css';

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

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
.input-sh :deep(input) { padding-top: 0.5rem; padding-bottom: 0.5rem; }
.shadow-inner-top { box-shadow: inset 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
</style>