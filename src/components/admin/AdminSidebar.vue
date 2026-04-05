<template>
  <aside class="admin-sidebar" :class="{ collapsed: !isExpanded }">
    <div
      class="sidebar-brand"
      @click="toggleSidebar"
      :title="isExpanded ? 'Colapsar menú' : 'Expandir menú'"
    >
      <div class="brand-content">
        <i class="pi pi-shield"></i>
        <span v-if="isExpanded">ADMIN</span>
      </div>
      <i
        class="brand-toggle-icon"
        :class="isExpanded ? 'pi pi-chevron-left' : 'pi pi-chevron-right'"
      ></i>
    </div>

    <nav class="sidebar-nav">
      <button
        v-for="item in mainNav"
        :key="item.path"
        :class="['nav-item', { active: isActive(item.path) }]"
        @click="navigateTo(item.path)"
        :title="!isExpanded ? item.label : ''"
      >
        <i :class="item.icon"></i>
        <span v-if="isExpanded">{{ item.label }}</span>
      </button>
    </nav>

    <div class="nav-section-label" v-if="isExpanded">Gestión</div>
    <div class="sidebar-sep" v-else />

    <button
      v-for="item in managementNav"
      :key="item.path"
      :class="['nav-item', { disabled: item.disabled }, { active: isActive(item.path) }]"
      :disabled="item.disabled"
      @click="navigateTo(item.path)"
      :title="!isExpanded ? item.label : ''"
    >
      <i :class="item.icon"></i>
      <span v-if="isExpanded">{{ item.label }}</span>
      <span v-if="isExpanded && item.disabled" class="coming-soon-badge">
        {{ item.label === 'Productos' || item.label === 'Sedes' ? 'En desarrollo' : 'Pronto' }}
      </span>
    </button>

    <nav class="sidebar-footer-nav">
      <div class="user-info" v-if="isExpanded">
        <div class="user-avatar-sm">{{ userInitial }}</div>
        <div class="user-details">
          <span class="user-name">{{ userName }}</span>
          <span class="user-role">Administrador</span>
        </div>
      </div>
      <div class="user-avatar-sm solo" v-else>{{ userInitial }}</div>

      <button
        v-for="item in footerNav"
        :key="item.id"
        :class="['nav-item', item.variant, { active: isActive(item.path) }]"
        @click="item.action ? item.action() : navigateTo(item.path)"
        :title="!isExpanded ? item.label : ''"
      >
        <i :class="item.icon"></i>
        <span v-if="isExpanded">{{ item.label }}</span>
      </button>
    </nav>
  </aside>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables/core/useAuth'
import { useSucursal } from '@/composables/admin/useSucursal'

const router = useRouter()
const route = useRoute()
const { user, logOut } = useAuth()
const { limpiarSucursal } = useSucursal()

const isExpanded = ref(true)

const mainNav = [{ label: 'Panel', icon: 'pi pi-th-large', path: '/admin' }]

// TODO: Habilitar estas rutas cuando estén listas
const managementNav = [
  { label: 'Productos', icon: 'pi pi-box', path: '/admin/productos'},
  { label: 'Cajeros', icon: 'pi pi-users', path: '/admin/cajeros', disabled: true },
  { label: 'Sedes', icon: 'pi pi-building', path: '/admin/sedes', disabled: true },
  { label: 'Exportar', icon: 'pi pi-file-export', path: '/admin/exportar', disabled: true },
]

const footerNav = computed(() => [
  { id: 'profile', label: 'Mi perfil', icon: 'pi pi-user', path: '/admin/perfil' },
  { id: 'monitor', label: 'Monitor POS', icon: 'pi pi-arrow-left', path: '/dashboard' },
  {
    id: 'logout',
    label: 'Cerrar sesión',
    icon: 'pi pi-sign-out',
    path: null,
    variant: 'danger',
    action: handleLogout,
  },
])

const userName = computed(() => user.value?.displayName || 'Administrador')
const userInitial = computed(() => userName.value.charAt(0).toUpperCase())

/**
 * Funcion para determinar si una ruta dada es la activa
 * @param path - Ruta a comparar con la ruta actual
 * @return boolean - true si la ruta es activa, false en caso contrario
 * Nota: Para la ruta raíz '/admin', se verifica una coincidencia exacta
 * Para otras rutas, se verifica si la ruta actual comienza con el path dado,
 * lo que permite marcar como activo tanto '/admin/productos' como '/admin/productos/123' o etc
 */
const isActive = (path) => {
  if (!path) return false
  if (path === '/admin') return route.path === '/admin'
  return route.path.startsWith(path)
}

/**
 * Función para alternar el estado del sidebar entre expandido y colapsado
 */
const toggleSidebar = () => {
  isExpanded.value = !isExpanded.value
}

/**
 * Función para navegar a una ruta dada, utilizando el router de Vue
 * @param path - Ruta a la que se desea navegar
 */
const navigateTo = (path) => {
  if (path) router.push(path)
}

/**
 * Función para manejar el cierre de sesión del usuario administrador
 */
const handleLogout = async () => {
  limpiarSucursal()
  await logOut()
  router.push('/')
}
</script>

<style scoped>
/* ── Contenedor ── */
.admin-sidebar {
  width: 240px;
  height: 100%;
  background: var(--color-primary);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  z-index: 50;
}

.admin-sidebar.collapsed {
  width: 72px;
}

/* ── Brand con toggle integrado ── */
.sidebar-brand {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  cursor: pointer;
  transition: background 0.15s ease;
  flex-shrink: 0;
  user-select: none;
}

.sidebar-brand:hover {
  background: rgba(255, 255, 255, 0.04);
}

.brand-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--color-accent, #facc15);
  letter-spacing: 0.1em;
}

.brand-toggle-icon {
  font-size: 0.75rem;
  color: var(--color-accent, #facc15);
  opacity: 0.5;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.sidebar-brand:hover .brand-toggle-icon {
  opacity: 1;
}

/* Cuando está colapsado, centramos el ícono del escudo y ocultamos la flecha (opcional) */
.admin-sidebar.collapsed .sidebar-brand {
  justify-content: center;
  padding: 0;
}

.admin-sidebar.collapsed .brand-toggle-icon {
  display: none;
}

/* ── Nav principal ── */
.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem;
  overflow-x: hidden;
  overflow-y: auto;
}

/* ── Separador ── */
.sidebar-sep {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 0 0.75rem;
  flex-shrink: 0;
}

/* Label de sección */
.nav-section-label {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #475569;
  padding: 0.75rem 0.75rem 0.25rem;
}

/* Ítems deshabilitados */
.nav-item.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

/* Badge de ítems deshabilitados */
.coming-soon-badge {
  margin-left: auto;
  font-size: 0.6rem;
  font-weight: 700;
  background: rgba(250, 204, 21, 0.15);
  color: var(--color-accent, #facc15);
  padding: 2px 6px;
  border-radius: 999px;
  letter-spacing: 0.05em;
}

/* ── Footer nav ── */
.sidebar-footer-nav {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem;
  flex-shrink: 0;
}

/* ── Info del usuario ── */
.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  margin-bottom: 0.25rem;
}

.user-avatar-sm {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(250, 204, 21, 0.15);
  border: 1.5px solid rgba(250, 204, 21, 0.3);
  color: var(--color-accent, #facc15);
  font-size: 0.8rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-avatar-sm.solo {
  margin: 0.5rem auto 0.75rem;
}

.user-details {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.user-name {
  font-size: 0.8rem;
  font-weight: 700;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 0.7rem;
  color: #64748b;
  white-space: nowrap;
}

/* ── Ítems de nav ── */
.nav-item {
  background: transparent;
  border: none;
  color: #94a3b8;
  padding: 0.7rem 0.75rem;
  border-radius: var(--radius-md, 6px);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.875rem;
  width: 100%;
  text-align: left;
  white-space: nowrap;
  transition:
    background 0.15s,
    color 0.15s;
  font-size: 0.875rem;
}

.admin-sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 0.7rem;
}

.nav-item i {
  font-size: 1rem;
  min-width: 18px;
  text-align: center;
  flex-shrink: 0;
}

.nav-item span {
  font-weight: 600;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.07);
  color: white;
}

.nav-item.active {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.nav-item.active i {
  color: var(--color-accent, #facc15);
}

/* Variante danger */
.nav-item.danger {
  color: #f87171;
}
.nav-item.danger i {
  color: #f87171;
}
.nav-item.danger:hover {
  background: rgba(239, 68, 68, 0.12);
  color: #fca5a5;
}
.nav-item.danger:hover i {
  color: inherit;
}
</style>
