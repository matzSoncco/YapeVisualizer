import { reactive, computed } from 'vue'

/**
 * Global store to manage user profile, business info, branches, etc
 */
export const store = reactive({
  loading: false,
  isAdminAuthenticated: false,

  userProfile: null,
  negocio: {
    nombre: '',
    ruc: '',
    logoUrl: '',
  },

  sucursales: [],
  sucursalActual: localStorage.getItem('sucursalActual') || null,
  currentShift: null,
})

// Getters
export const isShiftOpen = computed(() => store.currentShift !== null)
export const userRole = computed(() => store.userProfile?.role || 'user')

// Mutations
export const setLoading = (estado) => (store.loading = estado)
export const setAdminAuth = (value) => (store.isAdminAuthenticated = value)
export const setBranches = (data) => (store.sucursales = data)

/**
 * Writes the current shift data to the store
 */
export const setCurrentShift = (data) => (store.currentShift = data)

/**
 * Sets the current branch in the store and persists it in localStorage if it is not 'ADMIN
 * @param {Object} id - The ID of the branch to set as current
 */
export const setCurrentBranch = (id) => {
  store.sucursalActual = id
  if (id && id !== 'ADMIN') {
    localStorage.setItem('sucursalActual', id)
  } else {
    localStorage.removeItem('sucursalActual')
  }
}

/**
 * Saves the user profile data to the store, role and subscription info included
 * @param {Object} data - An object with the user profile data
 */
export const setUserProfile = (data) => {
  if (!data) {
    store.userProfile = null
    store.negocio = { nombre: '', ruc: '', logoUrl: '' }
    return
  }

  store.userProfile = {
    uid: data.uid,
    email: data.email,
    displayName: data.displayName,
    role: data.role,
    isConfigured: data.isConfigured,
    subscription: data.subscription,
  }

  if (data.sucursales) {
    store.sucursales = data.sucursales
  }

  if (data.negocio) {
    Object.assign(store.negocio, data.negocio)
  }
}

/**
 * Generates a unique localStorage key for the cart based on the current branch
 */
export const cartStorageKey = computed(() => {
  const sId = store.sucursalActual
  if (!sId || sId === 'ADMIN') return null
  return `pos_cart_${sId}`
})

/**
 * Clears all user-related data from the store and localStorage
 */
export const clearStore = () => {
  store.userProfile = null
  store.currentShift = null
  store.isAdminAuthenticated = false
  store.sucursalActual = null
  localStorage.removeItem('sucursalActual')
}
