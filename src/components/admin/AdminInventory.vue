<template>
  <div class="admin-inventory-container">
    <div class="header-actions">
      <h3 class="m-0">Catálogo de Productos</h3>
      
      <div class="search-and-actions">
        <Button 
          label="Nuevo Producto" 
          icon="pi pi-plus" 
          severity="success" 
          @click="openNew" 
          class="p-button-sm font-bold shadow-sm btn-new" 
        />
        
        <IconField iconPosition="left">
          <InputIcon class="pi pi-search text-slate-400" />
          <InputText 
            ref="searchInput" 
            v-model="globalFilter" 
            @keyup.enter="onSearchEnter" 
            placeholder="Buscar o escanear..." 
            class="p-inputtext-sm search-input-custom" 
          />
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

      <Column header="Logo" style="width: 70px">
        <template #body="slotProps">
          <div class="product-logo">
            <img 
              v-if="slotProps.data.logo" 
              :src="slotProps.data.logo" 
              class="logo-image"
              :alt="slotProps.data.name"
            />
            <div v-else class="product-icon-placeholder">
              <i class="pi pi-image text-slate-300"></i>
            </div>
          </div>
        </template>
      </Column>

      <Column field="name" header="Producto" :sortable="true" class="font-bold"></Column>
      
      <Column field="lastPrice" header="Precio Unitario" :sortable="true">
        <template #body="slotProps">
          <span class="font-semibold text-slate-700">S/ {{ (slotProps.data.lastPrice || 0).toFixed(2) }}</span>
        </template>
      </Column>

      <Column field="codEAN" header="Cód. Barras" :sortable="true">
        <template #body="slotProps">
          <code class="text-xs bg-slate-100 px-2 py-1 rounded">{{ slotProps.data.codEAN || '---' }}</code>
        </template>
      </Column>

      <Column header="Stock Real" :sortable="true">
        <template #body="slotProps">
          <Badge 
            :value="`${slotProps.data.stock || 0} ${slotProps.data.unidad || 'UNI'}`" 
            :severity="getStockSeverity(slotProps.data.stock)" 
            class="stock-badge-custom"
          />
        </template>
      </Column>

      <Column header="Acciones" :exportable="false" style="width: 5rem">
        <template #body="slotProps">
          <Button icon="pi pi-pencil" text rounded severity="success" @click="editProduct(slotProps.data)" />
        </template>
      </Column>
    </DataTable>

    <Dialog 
      v-model:visible="productDialog" 
      :style="{width: '560px'}" 
      :header="product.id ? 'Editar Producto' : 'Crear Nuevo Producto'" 
      :modal="true" 
      class="p-fluid inventory-modal-custom"
      :closable="true"
    >
      <div class="dialog-content">
        <!-- Selección de Logo -->
        <div class="field">
          <label class="font-bold block mb-2 text-slate-600">
            <i class="pi pi-image mr-2 text-slate-400"></i>
            Logo del Producto (Opcional)
          </label>
          
          <div class="logo-selector">
            <div 
              v-for="logo in PREDEFINED_LOGOS" 
              :key="logo.value"
              class="logo-option"
              :class="{ 'logo-option-selected': product.logo === logo.value }"
              @click="product.logo = logo.value"
            >
              <img :src="logo.value" :alt="logo.label" class="logo-option-img" />
              <span class="logo-option-label">{{ logo.label }}</span>
            </div>
            <div 
              class="logo-option logo-option-clear"
              :class="{ 'logo-option-selected': !product.logo }"
              @click="product.logo = null"
            >
              <i class="pi pi-times-circle text-slate-400 text-xl"></i>
              <span class="logo-option-label">Sin logo</span>
            </div>
          </div>
        </div>

        <div class="field">
          <label for="name" class="font-bold block mb-2 text-slate-600">
            <i class="pi pi-tag mr-2 text-slate-400"></i>
            Nombre del Producto
          </label>
          <InputText 
            id="name" 
            v-model.trim="product.name" 
            required="true" 
            autofocus 
            :invalid="submitted && !product.name" 
            placeholder="Ej: ACEITE PRIMOR 1L" 
            class="w-full"
          />
          <small class="p-error" v-if="submitted && !product.name">El nombre es requerido.</small>
        </div>
        
        <div class="form-row">
          <div class="field flex-1">
            <label for="price" class="font-bold block mb-2 text-slate-600">
              <i class="pi pi-currency-sol mr-2 text-slate-400"></i>
              Precio Venta
            </label>
            <InputNumber 
              id="price" 
              v-model="product.lastPrice" 
              mode="currency" 
              currency="PEN" 
              locale="es-PE" 
              class="w-full" 
            />
          </div>
          <div class="field flex-1">
            <label for="stock" class="font-bold block mb-2 text-slate-600">
              <i class="pi pi-box mr-2 text-slate-400"></i>
              Stock Inicial
            </label>
            <InputNumber 
              id="stock" 
              v-model="product.stock" 
              showButtons 
              :min="0" 
              class="w-full" 
            />
          </div>
        </div>

        <div class="form-row">
          <div class="field flex-1">
            <label for="unidad" class="font-bold block mb-2 text-slate-600">
              <i class="pi pi-cog mr-2 text-slate-400"></i>
              Unidad de Medida
            </label>
            <Select 
              id="unidad" 
              v-model="product.unidad" 
              :options="PRODUCT_UNITS" 
              optionLabel="label" 
              optionValue="value" 
              class="w-full" 
            />
          </div>
          <div class="field flex-1">
            <label for="barcode" class="font-bold block mb-2 text-slate-600">
              <i class="pi pi-barcode mr-2 text-slate-400"></i>
              Código EAN / Barras
            </label>
            <InputText 
              id="barcode" 
              v-model.trim="product.codEAN" 
              placeholder="Opcional" 
              class="w-full"
            />
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <Button label="Cancelar" icon="pi pi-times" text severity="danger" @click="hideDialog" class="p-button-text" />
          <Button 
            label="Guardar Producto" 
            icon="pi pi-check" 
            severity="success" 
            @click="saveProduct" 
            class="px-6"
            :disabled="!hasChanges"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useProducts } from '@/composables/operations/useProducts';
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
import Select from 'primevue/select'; 
import { PRODUCT_UNITS } from '@/utils/constants';

const { obtenerTodosLosProductos, actualizarProducto, crearProducto } = useProducts();
const toast = useToast();

// Logos predefinidos (puedes cambiar las rutas por las que necesites)
const PREDEFINED_LOGOS = [
  { label: 'Abarrotes', value: '/logos/bowl-rice_1.svg' },
  { label: 'Bebidas', value: '/logos/bottle-water_1.svg' },
  { label: 'Carnes', value: '/logos/meat_1.svg' },
  { label: 'Lácteos', value: '/logos/milk_1.svg' },
  { label: 'Panadería', value: '/logos/bread_1.svg' },
  { label: 'Snacks', value: '/logos/candy_2.svg' },
];

const productos = ref([]);
const loading = ref(true);
const globalFilter = ref('');
const searchInput = ref(null);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const productDialog = ref(false);
const product = ref({});
const originalProduct = ref({}); // Guardar estado original para detectar cambios
const submitted = ref(false);

// Computed para detectar si hubo cambios
const hasChanges = computed(() => {
  if (!product.value && !originalProduct.value) return false;
  
  // Para nuevo producto (sin id)
  if (!originalProduct.value.id) {
    // Si es nuevo y tiene nombre o algún campo lleno, permitir guardar
    return !!(product.value.name?.trim());
  }
  
  // Para edición, comparar campos relevantes
  const current = product.value;
  const original = originalProduct.value;
  
  return (
    current.name !== original.name ||
    current.lastPrice !== original.lastPrice ||
    current.stock !== original.stock ||
    current.unidad !== original.unidad ||
    current.codEAN !== original.codEAN ||
    current.logo !== original.logo
  );
});

const loadData = async () => {
    loading.value = true;
    productos.value = await obtenerTodosLosProductos();
    loading.value = false;
};

const getStockSeverity = (stock) => {
  if (!stock || stock <= 0) return 'danger';
  if (stock <= 10) return 'warn';
  return 'success';
};

watch(globalFilter, (val) => {
    filters.value.global.value = val;
});

const openNew = () => {
    product.value = { unidad: 'UNI', stock: 0, lastPrice: 0, logo: null };
    originalProduct.value = { ...product.value };
    submitted.value = false;
    productDialog.value = true;
};

const editProduct = (prod) => {
    product.value = { ...prod };
    if (!product.value.unidad) product.value.unidad = 'UNI';
    if (!product.value.logo) product.value.logo = null;
    originalProduct.value = { ...product.value };
    productDialog.value = true;
    submitted.value = false;
};

const hideDialog = () => {
    productDialog.value = false;
    submitted.value = false;
    product.value = {};
    originalProduct.value = {};
};

const saveProduct = async () => {
    if (!hasChanges.value) {
        toast.add({ severity: 'info', summary: 'Sin cambios', detail: 'No se detectaron modificaciones', life: 2000 });
        return;
    }
    
    submitted.value = true;
    if (product.value.name?.trim()) {
        const newData = {
            name: product.value.name.toUpperCase(),
            lastPrice: product.value.lastPrice || 0,
            codEAN: product.value.codEAN || "",
            stock: product.value.stock || 0,
            unidad: product.value.unidad || 'UNI',
            logo: product.value.logo || null
        };

        let exito = false;
        if (product.value.id) {
            exito = await actualizarProducto(product.value.id, newData);
        } else {
            const res = await crearProducto(newData);
            exito = !!res;
        }

        if (exito) {
            toast.add({ severity: 'success', summary: 'Completado', detail: 'Inventario actualizado', life: 3000 });
            await loadData();
            hideDialog();
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar', life: 3000 });
        }
    }
};

const onSearchEnter = () => {
    const text = globalFilter.value.trim();
    if (!text) return;
    const exists = productos.value.some(p => p.codEAN === text || p.name.toUpperCase().includes(text.toUpperCase()));
    if (!exists) {
        openNew();
        if (/^\d{4,}$/.test(text)) product.value.codEAN = text;
        else product.value.name = text;
        globalFilter.value = ''; 
    }
};

onMounted(loadData);
</script>

<style scoped>
.admin-inventory-container {
    background: #ffffff;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 4px 25px rgba(0,0,0,0.04);
}

.header-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 1.5rem;
    margin-bottom: 2rem;
    border-bottom: 1px solid #f1f5f9;
    padding-bottom: 1.5rem;
}

.header-actions h3 {
    margin: 0;
    color: #1e293b;
    font-size: 1.4rem;
    font-weight: 800;
}

.search-and-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.btn-new {
    white-space: nowrap;
}

.search-input-custom {
    width: 280px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    transition: all 0.2s;
    padding: 0.5rem 1rem;
}

.search-input-custom:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.product-logo {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.logo-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 6px;
}

.product-icon-placeholder {
    width: 36px;
    height: 36px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Logo Selector Styles */
.logo-selector {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
    gap: 0.75rem;
    margin-top: 0.5rem;
}

.logo-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 0.5rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    background: white;
}

.logo-option:hover {
    border-color: #10b981;
    background: #f0fdf4;
    transform: translateY(-2px);
}

.logo-option-selected {
    border-color: #10b981;
    background: #f0fdf4;
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
}

.logo-option-clear {
    border-style: dashed;
}

.logo-option-img {
    width: 40px;
    height: 40px;
    object-fit: contain;
}

.logo-option-label {
    font-size: 0.7rem;
    font-weight: 500;
    color: #64748b;
    text-align: center;
}

/* Dialog Styles */
:deep(.p-dialog-header) {
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    padding: 1.5rem 1.75rem;
}

:deep(.p-dialog-header .p-dialog-title) {
    font-size: 1.2rem;
    font-weight: 700;
    color: #1e293b;
}

:deep(.p-dialog-content) {
    padding: 1.75rem;
}

:deep(.p-dialog-footer) {
    border-top: 1px solid #e2e8f0;
    padding: 1.25rem 1.75rem;
    background: #fafbfc;
}

.dialog-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.field {
    margin-bottom: 0;
}

.field label {
    font-size: 0.85rem;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #475569;
}

.form-row {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
}

.form-row .flex-1 {
    flex: 1;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
}

:deep(.p-inputtext),
:deep(.p-inputnumber),
:deep(.p-dropdown) {
    width: 100%;
}

:deep(.p-button-success:disabled) {
    opacity: 0.5;
    cursor: not-allowed;
}

@media (max-width: 640px) {
    .admin-inventory-container {
        padding: 1rem;
    }
    
    .header-actions {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
    }
    
    .search-and-actions {
        width: 100%;
        flex-direction: column;
    }
    
    .btn-new {
        width: 100%;
    }
    
    .search-input-custom {
        width: 100%;
    }
    
    .form-row {
        flex-direction: column;
        gap: 1rem;
    }
    
    .logo-selector {
        grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
    }
    
    :deep(.p-dialog) {
        width: 90% !important;
        margin: 1rem;
    }
}
</style>