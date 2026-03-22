<template>
  <div class="admin-inventory-container">
    <div class="header-actions">
      <h3>Catálogo de Productos</h3>
      <div class="flex flex-wrap items-center gap-3">
        <Button label="Nuevo Producto" icon="pi pi-plus" severity="success" @click="openNew" class="p-button-sm" />
        <IconField iconPosition="left">
          <InputIcon class="pi pi-search text-slate-400" />
          <InputText ref="searchInput" v-model="globalFilter" @keyup.enter="onSearchEnter" placeholder="Buscar producto o código..." class="p-inputtext-sm w-full sm:w-auto" />
        </IconField>
      </div>
    </div>
    
    <DataTable :value="productos" 
               :paginator="true" :rows="10" 
               :loading="loading"
               dataKey="id"
               :globalFilterFields="['name', 'codEAN']"
               v-model:filters="filters"
               filterDisplay="menu"
               responsiveLayout="scroll"
               class="p-datatable-sm custom-inventory-table">
               
      <template #empty>
        No se encontraron productos en el inventario.
      </template>

      <Column field="name" header="Producto" :sortable="true"></Column>
      <Column field="lastPrice" header="Precio Unitario" :sortable="true">
        <template #body="slotProps">
          S/ {{ (slotProps.data.lastPrice || 0).toFixed(2) }}
        </template>
      </Column>
      <Column field="codEAN" header="Cód. Barras (EAN)" :sortable="true">
        <template #body="slotProps">
          {{ slotProps.data.codEAN || '---' }}
        </template>
      </Column>
      <Column header="Stock Inicial" :sortable="true">
        <template #body="slotProps">
          {{ calcularStockInicial(slotProps.data) }}
        </template>
      </Column>
      <Column header="Vendidos Hoy" :sortable="true">
        <template #body="slotProps">
          <Badge :value="calcularVendidosHoy(slotProps.data)" severity="warn" />
        </template>
      </Column>
      <Column header="Stock Real" :sortable="true">
        <template #body="slotProps">
          <Badge :value="slotProps.data.stock || 0" :severity="(slotProps.data.stock || 0) > 0 ? 'success' : 'danger'" />
        </template>
      </Column>
      <Column header="Acciones" :exportable="false" style="min-width: 5rem">
        <template #body="slotProps">
          <Button icon="pi pi-pencil" text rounded severity="success" @click="editProduct(slotProps.data)" />
        </template>
      </Column>
    </DataTable>

    <Dialog v-model:visible="productDialog" :style="{width: '450px'}" :header="product.id ? 'Editar Producto' : 'Nuevo Producto'" :modal="true" class="p-fluid">
      <div class="field mb-3">
        <label for="name" class="font-bold block mb-1">Nombre</label>
        <InputText id="name" v-model.trim="product.name" required="true" autofocus :invalid="submitted && !product.name" />
        <small class="p-error" v-if="submitted && !product.name">El nombre es requerido.</small>
      </div>
      <div class="field mb-3 grid grid-cols-2 gap-3" style="display:flex; gap:1rem;">
        <div style="flex: 1;">
          <label for="price" class="font-bold block mb-1">Precio Unitario</label>
          <InputNumber id="price" v-model="product.lastPrice" mode="currency" currency="PEN" locale="es-PE" />
        </div>
        <div style="flex: 1;">
          <label for="stock" class="font-bold block mb-1">Stock Físico Real</label>
          <InputNumber id="stock" v-model="product.stock" showButtons :min="0" />
        </div>
      </div>
      <div class="field mb-3">
        <label for="barcode" class="font-bold block mb-1">Código de Barras (EAN)</label>
        <InputText id="barcode" v-model.trim="product.codEAN" placeholder="Opcional" />
      </div>
      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" text severity="secondary" @click="hideDialog"/>
        <Button label="Guardar Cambio" icon="pi pi-check" @click="saveProduct" />
      </template>
    </Dialog>

  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';
import { useProducts } from '@/composables/useProducts';
import { useToast } from 'primevue/usetoast';
import { FilterMatchMode } from '@primevue/core/api';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Badge from 'primevue/badge';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';

const { obtenerTodosLosProductos, actualizarProducto, crearProducto } = useProducts();
const toast = useToast();

const productos = ref([]);
const loading = ref(true);
const globalFilter = ref('');
const searchInput = ref(null);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const productDialog = ref(false);
const product = ref({});
const submitted = ref(false);

const loadData = async () => {
    loading.value = true;
    productos.value = await obtenerTodosLosProductos();
    loading.value = false;
};

// Funciones lógicas para cálculo de stock dinámico
const calcularVendidosHoy = (p) => {
    const hoy = new Date().toLocaleDateString('en-CA');
    return p.lastDateSold === hoy ? (p.soldToday || 0) : 0;
};

const calcularStockInicial = (p) => {
    return (p.stock || 0) + calcularVendidosHoy(p);
};

watch(globalFilter, (val) => {
    filters.value.global.value = val;
});

const openNew = () => {
    product.value = {};
    submitted.value = false;
    productDialog.value = true;
};

const editProduct = (prod) => {
    product.value = { ...prod }; // Clonar el objeto para no mutar directamente hasta guardar
    productDialog.value = true;
    submitted.value = false;
};

const hideDialog = () => {
    productDialog.value = false;
    submitted.value = false;
};

const saveProduct = async () => {
    submitted.value = true;

    if (product.value.name?.trim()) {
        const newData = {
            name: product.value.name.toUpperCase(),
            lastPrice: product.value.lastPrice || 0,
            codEAN: product.value.codEAN || "",
            stock: product.value.stock || 0
        };

        if (product.value.id) {
            // Modo Edición
            const index = productos.value.findIndex(p => p.id === product.value.id);
            const exito = await actualizarProducto(product.value.id, newData);

            if (exito) {
                if (index !== -1) {
                    productos.value[index] = { ...productos.value[index], ...newData };
                }
                toast.add({ severity: 'success', summary: 'Éxito', detail: 'Producto actualizado', life: 3000 });
            } else {
                toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el producto', life: 3000 });
            }
        } else {
            // Modo Creación
            const nuevoProdGuardado = await crearProducto(newData);
            if (nuevoProdGuardado) {
                productos.value.unshift(nuevoProdGuardado); // Agregar arriba en la tabla local
                toast.add({ severity: 'success', summary: 'Éxito', detail: 'Producto creado', life: 3000 });
            } else {
                toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el producto', life: 3000 });
            }
        }
        
        productDialog.value = false;
        product.value = {};
    }
};

const onSearchEnter = () => {
    const text = globalFilter.value.trim();
    if (!text) return;

    // Verificar si el texto ingresado coincide con algún código EAN o nombre de los productos listados
    const exactMatchEAN = productos.value.some(p => p.codEAN === text);
    const partialMatchName = productos.value.some(p => p.name.toUpperCase().includes(text.toUpperCase()));

    // Si no existe ni por EAN ni por nombre, lanzamos la creación
    if (!exactMatchEAN && !partialMatchName) {
        openNew();
        
        // Si el texto parece un código numérico (al menos 4 dígitos), lo ponemos en codEAN. 
        // Si no, asumimos que escribió un nombre (lo ponemos como nombre).
        if (/^\d{4,}$/.test(text)) {
            product.value.codEAN = text;
        } else {
            product.value.name = text;
        }
        
        toast.add({ severity: 'info', summary: 'No existe', detail: 'Vamos a agregar este producto nuevo', life: 3000 });
        globalFilter.value = ''; // Limpiar buscador
    } else {
        // En caso de que exista, la tabla ya está mostrando el resultado gracias al v-model="globalFilter". No hacer nada.
        toast.add({ severity: 'success', summary: 'Encontrado', detail: 'Mostrando producto(s) en la tabla', life: 1500 });
    }
};

onMounted(() => {
    loadData();
    nextTick(() => {
        if (searchInput.value) {
            const el = searchInput.value.$el || searchInput.value;
            if (el && el.focus) {
                el.focus();
            }
        }
    });
});
</script>

<style scoped>
.admin-inventory-container {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.05);
}
.header-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
}
.header-actions h3 {
    margin: 0;
    color: #334155;
    font-size: 1.25rem;
    font-weight: 600;
}
:deep(.p-datatable .p-datatable-header) {
    background: transparent;
    padding: 0 0 1rem 0;
    border: none;
}
</style>
