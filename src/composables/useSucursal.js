import { computed } from 'vue';
import { db } from "../firebaseConfig";
import { collection, doc, setDoc, deleteDoc } from "firebase/firestore";
import { useAuth } from './useAuth';
import { store, setSucursalActual } from '../store'; 

/**
 * Composable para manejar sucursales
 * @returns {Object} Funciones y propiedades relacionadas con sucursales
 */
export function useSucursal() {
    const { user } = useAuth();

    /**
     * Agrega una nueva sucursal a la subcolección del usuario actual en Firestore.
     * @param {Object} data - Datos de la sucursal (ej: { nombre: string, icono: string })
     * @param {string} data.nombre - Nombre identificador de la sede.
     * @param {string} [data.icono] - Emoji o identificador visual opcional.
     * @returns {Promise<void>} Promesa que se resuelve cuando la operación en la BD finaliza.
     */
    const addSucursal = async (data) => {
        if(!user.value?.uid) return;
        const newRef = doc(collection(db, 'users', user.value.uid, 'sucursales'));
        await setDoc(newRef, {
            ...data,
            activa: true,
            createdAt: new Date().toISOString()
        });
    };

    /**
     * Elimina una sucursal de la subcolección del usuario actual en Firestore
     * @param {String} id - UID de la sucursal a eliminar
     * @returns {Promise<void>} Promesa que se resuelve cuando la operación en la BD finaliza.
     */
    const deleteSucursal = async (id) => {
        if (!user.value?.uid) return;
        await deleteDoc(doc(db, 'users', user.value.uid, 'sucursales', id));
    };

    const seleccionar = (nombreId) => {
        if (nombreId === 'ADMIN') {
             const pin = prompt("🔐 PIN Admin:");
             if (pin !== "1234") return false;
             // TODO: Mejorar seguridad para el ingreso a la vista de administrador
        }
        setSucursalActual(nombreId);
        return true;
    };

    /**
     * Limpia la sucursal actual seleccionada
     */
    const limpiarSucursal = () => {
        setSucursalActual(null);
    };

    /**
     * Lista de sucursales desde el store reactivo
     */
    const sucursales = computed(() => {
        return store.sucursales;
    })

    return {
        sucursales,
        sucursalActual: computed(() => store.sucursalActual),
        loading: computed(() => store.loading),
        esAdmin: computed(() => store.sucursalActual === 'ADMIN'),
        
        addSucursal,
        deleteSucursal,
        seleccionar,
        limpiarSucursal
    };
}