import { ref } from 'vue';

const sucursalActual = ref(localStorage.getItem('sucursalActual') || null);

export function useSucursal() {
    /**
     * Lista de sucursales disponibles (hardcodeado por el momento)
     * @type {Array<Object>}
     */
    const sucursales = [
        { id: 'melgar', nombre: 'Tienda Melgar', icono: '🏟️' },
        { id: 'centro', nombre: 'Tienda Centro', icono: '🏙️' },
        { id: 'yanahuara', nombre: 'Tienda Yanahuara', icono: '🌋' },
        { id: 'tienda4', nombre: 'Tienda 4', icono: '🏪' },

        //TODO: Llamar a las sucursales desde Firestore
    ];

    /**
     * Selecciona una sucursal y la guarda en localStorage
     * @param {*} nombre 
     * @returns {void}
     */
    const seleccionar = (nombre) => {
        if (nombre === 'ADMIN') {
            const pin = prompt("🔐 PIN Admin:");
            if (pin !== "1234") return alert("Incorrecto");
        }
        sucursalActual.value = nombre;
        localStorage.setItem('sucursalActual', nombre);
    };

    /**
     * Limpia la sucursal seleccionada
     */
    const limpiarSucursal = () => {
        sucursalActual.value = null;
        localStorage.removeItem('sucursalActual'); 
    };

    /**
     * Retorna las propiedades y métodos del composable
     */
    return {
        sucursalActual,
        sucursales,
        seleccionar,
        limpiarSucursal
    };
}