import { reactive, computed } from 'vue';

/**
 * Store reactivo simple para manejar el estado global de sucursales
 */
export const store = reactive({
    sucursales: [],
    sucursalActual: localStorage.getItem('sucursalActual') || null,
    loading: false,
    currentShift: null,
    isAdminAuthenticated: false,

    userProfile: {
        role: 'user',
        adminPin: null,
        subscription: {
            isActive: false,
            planName: 'Cargando...',
            limitSucursales: 0,
            status: 'loading',
            nextBillingDate: null,
            trialEndDate: null
        }
    }
});

/**
 * Helper computado para usar en templates
 * Reemplaza la necesidad de un booleano manual
 */
export const isShiftOpen = computed(() => store.currentShift !== null);

/**
 * Actualiza la lista de sucursales en el store
 * @param {*} data - Arreglo de sucursales
 */
export const setSucursales = (data) => {
    store.sucursales = data;
};

/**
 * Establece la sucursal actual en el store y en localStorage
 * @param {string} id - UID de la sucursal actual o 'ADMIN'
 */
export const setSucursalActual = (id) => {
    store.sucursalActual = id;

    if (id && id !== 'ADMIN') {
        localStorage.setItem('sucursalActual', id);
    } else {
        localStorage.removeItem('sucursalActual');
        store.currentShift = null;
    }
};

/**
 * Establece el estado de carga en el store
 * @param {*} estado - Booleano de estado de carga
 */
export const setLoading = (estado) => {
    store.loading = estado;
};

/**
 * Actualiza los datos del perfil y suscripción
 * @param {Object} data - Objeto con role y subscription
 */
export const setUserProfile = (data) => {
    if (!data || Object.keys(data).length === 0) {
        store.userProfile = {
            role: 'user',
            adminPin: null,
            subscription: {
                isActive: false,
                planName: '',
                limitSucursales: 0,
                status: 'loading'
            }
        };
        return;
    }
    Object.assign(store.userProfile, {
        ...data,
        adminPin: data.adminPin 
    });
};

/**
 * Establece los datos de la sesión de caja en el store
 * @param {Object} data - Datos de la sesión de caja
 */
export const setCurrentShift = (data) => {
    store.currentShift = data;
}

/**
 * Establece si el usuario está autenticado como administrador
 * @param {boolean} value - Valor booleano que indica si el usuario está autenticado como administrador
 */
export const setAdminAuth = (value) => {
    store.isAdminAuthenticated = value;
};

/**
 * Llave dinámica para la persistencia del carrito basada en la sucursal actual
 * Retorna null si no hay sucursal seleccionada o es admin global
 */
export const cartStorageKey = computed (() =>{
    const sId = store.sucursalActual;
    if (!sId || !sId === "ADMIN") return null;
    return `post_cart_${sId}`;
})