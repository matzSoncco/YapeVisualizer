<template>
  <div class="h-full flex flex-col bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
    <div class="bg-slate-50 p-3 border-b border-slate-200">
         <div class="flex gap-2 mb-2">
            <AutoComplete v-model="prodName" :suggestions="suggestions" @complete="search" @item-select="onProductSelect" optionLabel="name" placeholder="Buscar..." class="w-full input-sh" inputClass="w-full" ref="mainInput" />
            <InputNumber v-model="prodQty" :min="1" showButtons buttonLayout="horizontal" inputClass="w-12 text-center" />
         </div>
         <div class="flex gap-2">
             <div class="flex-grow relative">
                <span class="absolute left-3 top-2 text-slate-400 font-bold">S/</span>
                <InputNumber v-model="prodPrice" mode="currency" currency="PEN" locale="es-PE" placeholder="Precio" class="w-full" inputClass="pl-8 font-bold text-slate-700" :min="0" @keyup.enter="agregarAlCarrito" />
             </div>
             <Button icon="pi pi-plus" class="w-12" @click="agregarAlCarrito" :disabled="!puedeAgregar" />
         </div>
    </div>

    <div class="flex-grow overflow-y-auto bg-white custom-scrollbar relative">
        <div v-if="cart.length === 0" class="h-full flex flex-col items-center justify-center text-center p-4">
            <div class="text-slate-300 mb-4"><i class="pi pi-shopping-cart text-5xl"></i><p class="text-sm mt-2">Carrito vacío</p></div>
            <div class="w-full border-t border-slate-100 pt-4 mt-2">
                <p class="text-xs text-slate-400 mb-2 uppercase font-bold">Venta Rápida</p>
                <div class="flex gap-2">
                    <InputNumber v-model="quickAmount" mode="currency" currency="PEN" locale="es-PE" placeholder="Monto Total" class="w-full" inputClass="text-center bg-yellow-50 border-yellow-200" />
                    <Button icon="pi pi-check" severity="warning" :disabled="!quickAmount || quickAmount <= 0" @click="procesarVentaRapida" />
                </div>
            </div>
        </div>
        <table v-else class="w-full text-sm text-left">
             <tbody>
                <tr v-for="(item, index) in cart" :key="index" class="border-b border-slate-50">
                    <td class="p-2 text-center text-blue-600 font-bold">{{ item.qty }}</td>
                    <td class="p-2"><div>{{ item.name }}</div><div class="text-[10px] text-slate-400">{{ item.price.toFixed(2) }}</div></td>
                    <td class="p-2 text-right font-bold">{{ item.subtotal.toFixed(2) }}</td>
                    <td class="p-2 text-center"><i class="pi pi-times text-red-300 cursor-pointer" @click="removerItem(index)"></i></td>
                </tr>
             </tbody>
        </table>
    </div>

    <div class="bg-slate-900 text-white p-4 shadow-inner-top">
      <div class="flex justify-between items-end mb-4 border-b border-slate-700 pb-2">
        <span class="text-slate-400 text-xs uppercase tracking-wider">Total a Pagar</span>
        <span class="text-3xl font-bold text-green-400 tracking-tight">S/ {{ totalGeneral.toFixed(2) }}</span>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <Button severity="success" class="h-12 text-lg" :disabled="totalGeneral <= 0" :loading="loading" @click="procesarPago('CASH', null)">
            <i class="pi pi-money-bill mr-2"></i> EFECTIVO
        </Button>
        
        <Button 
            severity="help" 
            class="h-12 text-lg relative" 
            :disabled="totalGeneral <= 0" 
            :loading="loading" 
            @click="iniciarFlujoYape"
        >
            <i :class="matcherState.isListening ? 'pi pi-spin pi-spinner' : 'pi pi-qrcode'" class="mr-2"></i> 
            {{ matcherState.isListening ? 'ESPERANDO...' : 'YAPE' }}
        </Button>
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

// Composables
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