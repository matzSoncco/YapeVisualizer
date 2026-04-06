<template>
  <div class="inventory-view-root">
    <main class="inventory-container">
      <div class="inventory-card">
        <div class="card-header">
          <div class="card-header-title">
            <i class="pi pi-box" />
            <h2>Catálogo de Productos</h2>
          </div>
          <button class="btn-new" @click="openNew">
            <i class="pi pi-plus" /> Nuevo producto
          </button>
        </div>

        <div class="card-body">
          <div class="search-bar">
            <IconField iconPosition="left">
              <InputIcon class="pi pi-search" />
              <InputText 
                v-model="globalFilter" 
                @keyup.enter="onSearchEnter" 
                placeholder="Buscar o escanear..." 
                class="search-input"
              />
            </IconField>
          </div>

          <DataTable :value="productos" 
                      :paginator="true" :rows="10" 
                      :loading="loading"
                      dataKey="id"
                      :globalFilterFields="['name', 'codEAN']"
                      v-model:filters="filters"
                      filterDisplay="menu"
                      responsiveLayout="scroll"
                      class="inventory-table">
                      
            <template #empty>
              <div class="empty-state">
                <div class="empty-icon">📦</div>
                <p class="empty-title">Sin productos aún</p>
                <p class="empty-sub">Agrega tu primer producto al inventario.</p>
                <button class="btn-new-empty" @click="openNew">
                  <i class="pi pi-plus" /> Crear primer producto
                </button>
              </div>
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
                    <i class="pi pi-image" />
                  </div>
                </div>
              </template>
            </Column>

            <Column field="name" header="Producto" :sortable="true"></Column>
            
            <Column field="lastPrice" header="Precio Unitario" :sortable="true">
              <template #body="slotProps">
                <span class="price-text">S/ {{ (slotProps.data.lastPrice || 0).toFixed(2) }}</span>
              </template>
            </Column>

            <Column field="codEAN" header="Cód. Barras" :sortable="true">
              <template #body="slotProps">
                <code class="barcode">{{ slotProps.data.codEAN || '---' }}</code>
              </template>
            </Column>

            <Column header="Stock Real" :sortable="true">
              <template #body="slotProps">
                <span 
                  class="stock-badge"
                  :class="getStockClass(slotProps.data.stock)"
                >
                  {{ slotProps.data.stock || 0 }} {{ slotProps.data.unidad || 'UNI' }}
                </span>
              </template>
            </Column>

            <Column header="Acciones" :exportable="false" style="width: 5rem">
              <template #body="slotProps">
                <button class="action-btn" @click="editProduct(slotProps.data)" title="Editar producto">
                  <i class="pi pi-pencil" />
                </button>
              </template>
            </Column>
          </DataTable>
        </div>
      </div>
    </main>

    <Dialog 
      v-model:visible="productDialog" 
      :style="{width: '450px'}" 
      :header="product.id ? 'Editar Producto' : 'Nuevo Producto'" 
      :modal="true" 
      class="custom-inventory-dialog"
      :draggable="false"
    >
      <div class="modal-form-content">
        <div class="form-group">
          <label class="field-label">Logo del Producto</label>
          <div class="logo-selector">
            <div 
              v-for="logo in PREDEFINED_LOGOS" 
              :key="logo.value"
              class="logo-option"
              :class="{ 'selected': product.logo === logo.value }"
              @click="product.logo = logo.value"
            >
              <img :src="logo.value" :alt="logo.label" />
            </div>
            <div 
              class="logo-option clear"
              :class="{ 'selected': !product.logo }"
              @click="product.logo = null"
            >
              <i class="pi pi-ban" />
            </div>
          </div>
        </div>

        <div class="form-group">
          <label for="name" class="field-label">Nombre del Producto *</label>
          <InputText 
            id="name"
            v-model.trim="product.name" 
            placeholder="Ej: ACEITE PRIMOR 1L"
            class="custom-input uppercase-input"
            autofocus
          />
          <small class="error-msg" v-if="submitted && !product.name">El nombre es requerido</small>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="price" class="field-label">Precio Venta</label>
            <InputNumber 
              id="price"
              v-model="product.lastPrice" 
              mode="currency" 
              currency="PEN" 
              locale="es-PE"
              class="custom-input-number"
            />
          </div>
          <div class="form-group">
            <label for="stock" class="field-label">Stock Inicial</label>
            <InputNumber 
              id="stock"
              v-model="product.stock" 
              :min="0"
              class="custom-input-number"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="unidad" class="field-label">Unidad de Medida</label>
            <Select 
              id="unidad"
              v-model="product.unidad" 
              :options="PRODUCT_UNITS" 
              optionLabel="label" 
              optionValue="value"
              class="custom-input"
            />
          </div>
          <div class="form-group">
            <label for="barcode" class="field-label">Cód. Barras</label>
            <InputText 
              id="barcode"
              v-model.trim="product.codEAN" 
              placeholder="Opcional"
              class="custom-input"
            />
          </div>
        </div>
      </div>

      <template #footer>
        <div class="modal-actions">
          <Button
            label="Cancelar"
            icon="pi pi-times"
            text
            @click="hideDialog"
            class="btn-cancel"
          />
          <Button
            label="Guardar"
            icon="pi pi-check"
            @click="saveProduct"
            :disabled="!hasChanges"
            class="btn-save"
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
import Dialog from 'primevue/dialog';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Select from 'primevue/select';
import Button from 'primevue/button';
import { PRODUCT_UNITS } from '@/utils/constants';

const { obtenerTodosLosProductos, actualizarProducto, crearProducto } = useProducts();
const toast = useToast();

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
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const productDialog = ref(false);
const product = ref({});
const originalProduct = ref({});
const submitted = ref(false);

const hasChanges = computed(() => {
  if (!product.value && !originalProduct.value) return false;
  if (!originalProduct.value.id) {
    return !!(product.value.name?.trim());
  }
  
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

const getStockClass = (stock) => {
  if (!stock || stock <= 0) return 'stock-danger';
  if (stock <= 10) return 'stock-warning';
  return 'stock-success';
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
/* ── CONTENEDOR PRINCIPAL DE VISTA ── */
.inventory-view-root {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.inventory-container {
  flex: 1;
  padding: 1.5rem; /* Ajustado el padding para que no se vea tan separado */
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  overflow-y: auto;
}

/* ── TARJETA Y HEADER ── */
.inventory-card {
  background: var(--bg-app);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.5);
}

.card-header-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.card-header-title i {
  font-size: 1.25rem;
  color: var(--color-text-muted);
}

.card-header-title h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--color-text-main);
}

/* ── BOTÓN NUEVO ── */
.btn-new {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  background: var(--color-primary);
  color: var(--color-accent);
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-new:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
}

/* ── BODY Y BÚSQUEDA ── */
.card-body {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.search-bar {
  max-width: 320px;
}

.search-input {
  width: 100%;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  padding: 0.5rem 1rem;
}

.search-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.08);
  outline: none;
}

/* ── TABLA DE PRODUCTOS ── */
.inventory-table {
  width: 100%;
}

:deep(.inventory-table .p-datatable-wrapper) {
  border-radius: var(--radius-md);
}

:deep(.inventory-table .p-datatable-thead > tr > th) {
  background: rgba(255, 255, 255, 0.5);
  border-bottom: 1px solid var(--color-border);
  padding: 1rem;
  font-weight: 700;
  color: var(--color-text-main);
}

:deep(.inventory-table .p-datatable-tbody > tr > td) {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border);
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
  background: var(--bg-surface-alt);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
}

.price-text {
  font-weight: 600;
  color: var(--color-text-main);
}

.barcode {
  font-size: 0.75rem;
  background: var(--bg-surface-alt);
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  font-family: monospace;
}

/* Badges de Stock */
.stock-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 600;
}
.stock-success { background: #d1fae5; color: #065f46; }
.stock-warning { background: #fed7aa; color: #92400e; }
.stock-danger { background: #fee2e2; color: #991b1b; }

.action-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: var(--bg-surface);
  color: var(--color-primary);
}

/* ── EMPTY STATE ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem 1rem;
  text-align: center;
}
.empty-icon { font-size: 3.5rem; opacity: 0.25; line-height: 1; }
.empty-title { margin: 0; font-size: 1.1rem; font-weight: 800; color: var(--color-text-main); }
.empty-sub { margin: 0; font-size: 0.9rem; color: var(--color-text-muted); }

.btn-new-empty {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 1rem;
  padding: 0.6rem 1.25rem;
  background: transparent;
  color: var(--color-primary);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-new-empty:hover {
  background: var(--color-primary);
  color: var(--color-accent);
  border-color: var(--color-primary);
}

/* ══════════════════════════════════════════════
   ESTILOS PREMIUM DEL MODAL
   ══════════════════════════════════════════════ */
.custom-inventory-dialog :deep(.p-dialog-header) {
  padding: 1.5rem;
  background: var(--bg-app);
  border-bottom: 1px solid var(--color-border);
  font-weight: 800;
  color: var(--color-text-main);
}

.custom-inventory-dialog :deep(.p-dialog-content) {
  padding: 1.5rem;
}

.custom-inventory-dialog :deep(.p-dialog-footer) {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-border);
  background: var(--bg-surface-alt);
}

/* ── CONTENEDOR DE FORMULARIO ── */
.modal-form-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding-top: 0.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

/* ── ETIQUETAS (LABELS) ── */
.field-label {
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
}

/* ── INPUTS GENÉRICOS Y SELECTS ── */
.custom-input,
:deep(.custom-input-number .p-inputtext),
:deep(.p-select.custom-input) {
  width: 100%;
  padding: 0.6rem 0.75rem;
  font-size: 0.9rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--bg-surface-alt);
  color: var(--color-text-main);
  transition: all 0.2s ease;
  box-shadow: none;
}

/* Arreglo para el padding interno del componente Select de PrimeVue */
:deep(.p-select.custom-input .p-select-label) {
  padding: 0;
}

.custom-input:hover,
:deep(.custom-input-number .p-inputtext:hover),
:deep(.p-select.custom-input:hover) {
  border-color: var(--color-primary-mid);
}

.custom-input:focus,
:deep(.custom-input-number .p-inputtext:focus),
:deep(.p-select.custom-input.p-focus) {
  border-color: var(--color-primary);
  background: var(--bg-input-focus);
  box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.08);
  outline: none;
}

.uppercase-input {
  text-transform: uppercase;
  font-weight: 600;
}

/* ── SELECTOR DE LOGOS ── */
.logo-selector {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.logo-option {
  width: 44px;
  height: 44px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--bg-app);
}

.logo-option:hover {
  border-color: var(--color-primary-mid);
  transform: translateY(-2px);
}

.logo-option.selected {
  border-color: var(--color-primary);
  background: var(--bg-input-focus);
  box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.08);
}

.logo-option img {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.logo-option.clear {
  border-style: dashed;
}
.logo-option.clear i {
  font-size: 1.2rem;
  color: var(--color-text-muted);
}

.error-msg {
  font-size: 0.75rem;
  color: var(--color-error);
  margin-top: 0.25rem;
}

/* ── ACCIONES FOOTER DEL MODAL ── */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn-cancel {
  color: var(--color-text-muted) !important;
  font-weight: 600 !important;
}

.btn-cancel:hover {
  background: var(--color-error-soft) !important;
  color: var(--color-error-dark) !important;
}

.btn-save {
  background: var(--color-primary) !important;
  border-color: var(--color-primary) !important;
  color: var(--color-accent) !important;
  font-weight: 700 !important;
  padding: 0.6rem 1.25rem !important;
  border-radius: var(--radius-md) !important;
  transition: all 0.2s ease !important;
}

.btn-save:hover:not(:disabled) {
  background: var(--color-primary-hover) !important;
  transform: translateY(-1px);
}

.btn-save:disabled {
  opacity: 0.5 !important;
  cursor: not-allowed !important;
}

/* ── RESPONSIVE ── */
@media (max-width: 768px) {
  .inventory-container { padding: 1rem; }
  .card-header { flex-direction: column; gap: 1rem; align-items: stretch; }
  .btn-new { width: 100%; justify-content: center; }
  .card-body { padding: 1rem; }
  .form-row { grid-template-columns: 1fr; gap: 1.25rem; }
  .custom-inventory-dialog :deep(.p-dialog) { width: 90% !important; margin: 1rem; }
}
</style>