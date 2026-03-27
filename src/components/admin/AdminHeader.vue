<template>
  <header class="admin-toolbar">
    <div class="toolbar-left">
      <slot name="left">
        <h1 v-if="title" class="header-title">{{ title }}</h1>
      </slot>
    </div>

    <div class="toolbar-right" v-if="$slots.filters || $slots.actions">
      <div v-if="$slots.filters" class="toolbar-filters">
        <slot name="filters"></slot>
      </div>

      <div v-if="$slots.filters && $slots.actions" class="toolbar-divider"></div>

      <div v-if="$slots.actions" class="toolbar-actions">
        <slot name="actions"></slot>
      </div>
    </div>
  </header>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: '',
  },
})
</script>

<style scoped>
/* ── Estructura Base ── */
.admin-toolbar {
  height: 64px;
  background: var(--bg-app);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  flex-shrink: 0;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--color-text-main, #e2e8f0);
  margin: 0;
  letter-spacing: -0.01em;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* ── Contenedor de Filtros ── */
.toolbar-filters {
  display: flex;
  align-items: center;
  gap: 0.5rem; /* Separación limpia entre cada filtro */
}

/* 1. Estilos generales para inputs y selects */
.toolbar-filters :deep(.p-inputtext),
.toolbar-filters :deep(.p-select) {
  height: 36px;
  border-radius: var(--radius-md, 6px);
  background: var(--bg-surface, transparent);
  border: 1px solid var(--color-border, #334155);
  font-size: 0.85rem;
  color: var(--color-text-main, #e2e8f0);
  box-shadow: none;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
  display: flex;
  align-items: center;
}

/* Hover y Focus universales */
.toolbar-filters :deep(.p-inputtext:hover),
.toolbar-filters :deep(.p-select:hover) {
  border-color: var(--color-primary-mid, #64748b);
}

.toolbar-filters :deep(.p-inputtext:focus),
.toolbar-filters :deep(.p-select.p-focus) {
  border-color: var(--color-primary, #3b82f6);
  box-shadow: 0 0 0 1px var(--color-primary, #3b82f6);
}

/* 2. Ajustes específicos para el DatePicker */
.toolbar-filters :deep(.p-datepicker .p-inputtext) {
  width: 105px;
  text-align: center;
  padding: 0 0.5rem;
}

/* Texto separador entre fechas */
.toolbar-filters :deep(.date-sep) {
  color: var(--color-text-muted);
  font-size: 0.85rem;
  user-select: none;
  margin: 0 0.25rem;
}

/* 3. Ajustes específicos para el Select (Dropdown) */
.toolbar-filters :deep(.p-select) {
  min-width: 150px;
}

.toolbar-filters :deep(.p-select .p-select-label) {
  padding: 0 0.75rem;
  line-height: 34px;
}

/* 4. Botones icónicos (ej: Buscar, Refrescar) */
.toolbar-filters :deep(.p-button.p-button-icon-only),
.toolbar-filters :deep(.p-button.p-button-text) {
  height: 36px;
  width: 36px;
  padding: 0;
  color: var(--color-text-muted, #94a3b8);
  border-radius: var(--radius-md, 6px);
}

.toolbar-filters :deep(.p-button.p-button-text:hover) {
  background: var(--bg-surface-hover, rgba(255, 255, 255, 0.05));
  color: var(--color-primary, #3b82f6);
}

/* ── Separador Vertical ── */
.toolbar-divider {
  width: 1px;
  height: 24px;
  background-color: var(--color-border, #334155);
  margin: 0 0.25rem;
}

/* ── Acciones principales ── */
.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.toolbar-actions :deep(.p-button) {
  height: 36px;
  padding: 0 1rem;
  font-size: 0.85rem;
  font-weight: 600;
}
</style>
