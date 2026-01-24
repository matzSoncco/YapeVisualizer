import { reactive } from 'vue';

/**
 * Store reactivo simple para manejar el estado global de sucursales
 */
export const store = reactive({
    sucursales: [],
    sucursalActual: localStorage.getItem('sucursalActual') || null,
    loading: false
});

/**
 * Actualiza la lista de sucursales en el store
 * @param {*} data - Arreglo de sucursales
 */
export const setSucursales = (data) => {
    store.sucursales = data;
};

/**
 * Establece la sucursal actual en el store y en localStorage
 * @param {*} id - UID de la sucursal actual
 */
export const setSucursalActual = (id) => {
    store.sucursalActual = id;
    if (id) localStorage.setItem('sucursalActual', id);
    else localStorage.removeItem('sucursalActual');
};

/**
 * Establece el estado de carga en el store
 * @param {*} estado - Booleano de estado de carga
 */
export const setLoading = (estado) => {
    store.loading = estado;
};