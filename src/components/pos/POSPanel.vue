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
          label="ADD"
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
.pos-main-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-app);
}

/* HEADER: LAYOUT COMPACTO */
.pos-input-area {
  padding: 1rem;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

:deep(.full-width-search), :deep(.full-width-search .p-autocomplete-input) {
  width: 100% !important;
  height: 40px !important;
  border-radius: 8px !important;
  font-weight: 600 !important;
}

/* ESTADO VACÍO: LAYOUT DIVIDIDO (Tipo Apertura de Caja) */
.cart-empty-state {
  height: 100%;
  display: flex;
  align-items: center; /* Centrado vertical */
  justify-content: center;
  padding: 1.5rem;
  gap: 2rem; /* Espacio entre el icono y el form */
  background-color: var(--bg-app);
}

.empty-info {
  flex: 0 0 auto;
  text-align: center;
  color: var(--color-text-muted);
  opacity: 0.3;
}

.empty-info i {
  font-size: 3rem;
  margin-bottom: 0.5rem;
  display: block;
}

.empty-info p {
  font-weight: 800;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}

.quick-access {
  flex: 1; /* El form toma el resto del espacio */
  max-width: 220px;
  padding: 1.25rem;
  background: var(--bg-surface);
  border-left: 2px solid var(--color-accent); /* Línea de acento a la izquierda */
  border-radius: 4px 12px 12px 4px;
}

.quick-label {
  display: block;
  font-size: 0.65rem;
  font-weight: 800;
  color: var(--color-text-muted);
  text-transform: uppercase;
  margin-bottom: 0.75rem;
}

.quick-row {
  display: flex;
  flex-direction: column; /* En columna se ve más limpio en este layout */
  gap: 0.5rem;
}

/* Ajuste de inputs para que calcen en la columna */
:deep(.quick-row .p-inputnumber),
:deep(.quick-row .p-inputnumber-input) {
  width: 100% !important;
  height: 38px !important;
  font-weight: 800 !important;
  font-size: 1rem !important;
  border-radius: 6px !important;
}

:deep(.quick-row .p-button) {
  width: 100% !important; /* Botón ancho para confirmar rápido */
  height: 38px !important;
  border-radius: 6px !important;
}

.details-row {
  display: flex;
  gap: 0.75rem;
  align-items: flex-end;
}

.detail-field label {
  font-size: 0.65rem;
  font-weight: 800;
  color: var(--color-text-muted);
  text-transform: uppercase;
  margin-bottom: 0.25rem;
  display: block;
}

.qty-group { flex: 0 0 100px; }
.price-group { flex: 1; }

:deep(.compact-qty), :deep(.compact-qty .p-inputnumber-input) {
  height: 36px !important;
  width: 100% !important;
  text-align: center !important;
}

.price-input-wrapper {
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 0 0.5rem;
  height: 36px;
}

.currency { font-weight: 700; color: var(--color-text-muted); font-size: 0.8rem; margin-right: 4px; }

:deep(.price-field-inner) {
  border: none !important;
  font-weight: 800 !important;
  width: 100% !important;
  padding: 0 !important;
  box-shadow: none !important;
}

.btn-add-line {
  height: 36px !important;
  background: var(--color-primary) !important;
  border: none !important;
  font-weight: 800 !important;
  padding: 0 1rem !important;
}

/* CARRITO: ESTILOS RECUPERADOS */
.pos-cart-area {
  flex: 1;
  overflow-y: auto;
  background: white;
}

.cart-table {
  width: 100%;
  border-collapse: collapse;
}

.cart-table thead th {
  text-align: left;
  padding: 0.75rem 1rem;
  background: var(--bg-surface);
  color: var(--color-text-muted);
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  border-bottom: 1px solid var(--color-border);
}

.cart-item-row {
  border-bottom: 1px solid var(--bg-surface);
  transition: all 0.2s;
}

.cart-item-row:hover {
  background: var(--bg-surface);
}

.td-qty {
  padding: 1rem;
  font-weight: 800;
  color: var(--color-primary);
  text-align: center;
  width: 50px;
}

.td-desc {
  padding: 0.5rem 0;
  display: flex;
  flex-direction: column;
}

.item-name {
  font-weight: 700;
  color: var(--color-primary);
  font-size: 0.9rem;
}

.item-unit {
  font-size: 0.7rem;
  color: var(--color-text-muted);
}

.td-total {
  padding: 1rem;
  font-weight: 800;
  text-align: right;
  width: 100px;
}

.td-action {
  padding: 0.5rem 1rem;
  text-align: center;
  width: 60px;
}

:deep(.btn-remove-item) {
  width: 32px !important;
  height: 32px !important;
}

/* FOOTER REFINADO Y NO INVASIVO */
.pos-footer-area {
  padding: 1rem 1.25rem;
  background: white; /* Cambiamos el fondo oscuro por blanco */
  border-top: 1px solid var(--color-border);
  flex-shrink: 0;
}

.summary-line {
  display: flex;
  justify-content: space-between;
  align-items: center; /* Alineado al centro para reducir altura */
  margin-bottom: 1rem;
}

.summary-lbl {
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--color-text-muted);
  letter-spacing: 0.05em;
}

.summary-val {
  font-size: 1.75rem; /* Reducimos de 2.25rem a 1.75rem */
  font-weight: 900;
  color: var(--color-primary);
  letter-spacing: -0.02em;
}

.payment-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.pay-btn-custom {
  border: 1px solid var(--color-border); /* Borde fino en lugar de bloque sólido */
  height: 44px; /* Reducimos altura de 54px a 44px */
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem; /* Icono y texto al lado, no uno sobre otro */
  font-weight: 700;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
  color: var(--color-primary);
  position: relative;
}

/* Estilo para Efectivo: Sutil pero claro */
.cash-bg {
  border-color: #22c55e;
  color: #15803d;
}
.cash-bg:hover:not(:disabled) {
  background: #f0fdf4;
}

/* Estilo para Yape: Sutil pero claro */
.yape-bg {
  border-color: #7c3aed;
  color: #6d28d9;
}
.yape-bg:hover:not(:disabled) {
  background: #f5f3ff;
}

/* Estados activos/esperando */
.yape-bg i.pi-spin {
  color: #7c3aed;
}

.pay-btn-custom:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  border-color: var(--color-border);
  color: var(--color-text-muted);
}

.pay-btn-custom i {
  font-size: 1rem;
}

.lock-badge {
  position: absolute;
  top: -8px;
  right: -8px;
}

/* Sección de desvinculación más discreta */
.unlock-footer {
  text-align: center;
  margin-top: 0.75rem;
}
</style>