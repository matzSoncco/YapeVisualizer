<template>
  <div class="admin-inventory-container">
    <div class="header-actions">
      <h3>Catálogo de Productos</h3>
      <div class="flex flex-wrap items-center gap-3">
        <Button label="Nuevo Producto" icon="pi pi-plus" severity="success" @click="openNew" class="p-button-sm" />
        <IconField iconPosition="left">
          <InputIcon class="pi pi-search text-slate-400" />
          <InputText v-model="globalFilter" placeholder="Buscar producto..." class="p-inputtext-sm w-full sm:w-auto" />
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
      <Column field="frequency" header="Vendidos" :sortable="true">
        <template #body="slotProps">
          <Badge :value="slotProps.data.frequency || 0" severity="info" />
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
      <div class="field mb-3">
        <label for="price" class="font-bold block mb-1">Precio Unitario</label>
        <InputNumber id="price" v-model="product.lastPrice" mode="currency" currency="PEN" locale="es-PE" />
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
import { ref, onMounted, watch } from 'vue';
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
            codEAN: product.value.codEAN || ""
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

onMounted(() => {
    loadData();
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
