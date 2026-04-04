<template>
  <Card class="profile-card subscription-card">
    <template #header>
      <div class="card-header">
        <div class="card-header-title">
          <i class="pi pi-sparkles" />
          <h3>Tu Plan</h3>
        </div>
        <Tag
          :value="status.isActive ? 'ACTIVO' : 'INACTIVO'"
          :severity="status.isActive ? 'success' : 'danger'"
          rounded
        />
      </div>
    </template>

    <template #content>
      <div class="subscription-body">

        <div class="plan-badge">
          <span class="plan-label">Plan actual</span>
          <span class="plan-name">{{ status.planName }}</span>
        </div>

        <div class="usage-block">
          <div class="usage-header">
            <span class="usage-label">
              <i class="pi pi-building" />
              Sedes utilizadas
            </span>
            <span class="usage-count" :class="{ 'is-full': isFull }">
              {{ count }} / {{ status.limitSucursales }}
            </span>
          </div>

          <div class="usage-track">
            <div
              class="usage-fill"
              :style="{ width: `${usagePercent}%` }"
              :class="usageFillClass"
            />
          </div>

          <p v-if="isFull" class="usage-warning">
            <i class="pi pi-exclamation-triangle" />
            Límite alcanzado — actualiza tu plan para agregar más sedes.
          </p>
        </div>

      </div>
    </template>
  </Card>
</template>

<script setup>
import { computed } from 'vue'
import Card from 'primevue/card'
import Tag from 'primevue/tag'

const props = defineProps({
  status: {
    type: Object,
    default: () => ({ isActive: false, planName: '—', limitSucursales: 1 })
  },
  count: {
    type: Number,
    default: 0
  }
})

const usagePercent = computed(() =>
  Math.min((props.count / props.status.limitSucursales) * 100, 100)
)

const isFull = computed(() => props.count >= props.status.limitSucursales)

const usageFillClass = computed(() => {
  if (isFull.value) return 'fill-danger'
  if (usagePercent.value >= 75) return 'fill-warning'
  return 'fill-ok'
})
</script>

<style scoped>
/* -- Header -- */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
}

.card-header-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-main);
}

.card-header-title i {
  color: var(--color-accent);
  font-size: 1rem;
}

.card-header-title h3 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 700;
}

/* -- Body -- */
.subscription-body {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 0.25rem 0;
}

/* -- Plan Badge -- */
.plan-badge {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.75rem 1rem;
  background: var(--bg-surface-alt);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--color-accent);
}

.plan-label {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}

.plan-name {
  font-size: 1rem;
  font-weight: 800;
  color: var(--color-primary);
}

/* -- Usage Block -- */
.usage-block {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.usage-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.usage-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.usage-label i {
  font-size: 0.8rem;
}

.usage-count {
  font-weight: 700;
  color: var(--color-text-main);
}

.usage-count.is-full {
  color: var(--color-error);
}

/* -- Progress Track custom (reemplaza ProgressBar de PrimeVue) -- */
.usage-track {
  width: 100%;
  height: 6px;
  background: var(--color-border);
  border-radius: 99px;
  overflow: hidden;
}

.usage-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.fill-ok      { background: var(--color-success); }
.fill-warning { background: var(--color-warning); }
.fill-danger  { background: var(--color-error); }

/* -- Warning -- */
.usage-warning {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-error-dark);
  padding: 0.5rem 0.75rem;
  background: var(--color-error-soft);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-error-border);
}

.usage-warning i {
  font-size: 0.85rem;
  flex-shrink: 0;
}
</style>