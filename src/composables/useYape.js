import { ref } from 'vue';
import { db } from '../firebaseConfig';
import { 
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    doc,
    updateDoc,
    serverTimestamp 
} from "firebase/firestore";
import { store } from '../store';

/**
 * Composable para manejar las transacciones de Yape
 * Logica de autoasignacion cuando el numero de sucursales es 1
 * @returns {Object} Propiedades y métodos del composable
 */
export function useYape() {
    const yapesPendientes = ref([]);
    const loading = ref(false);
    const error = ref(null);

    let unsubPendientes = null;

    /**
     * Reclama una transacción pendiente (Método base).
     * @param {string} yapeId - ID del documento
     * @param {string} nombreSucursal - Nombre de la sede destino
     * @returns {Promise<boolean>}
     */
    const reclamarYape = async (yapeId, movementId) => {
        const currentShift = store.currentShift;
        const sucursalId = store.sucursalActual;

        if (!currentShift?.id) {
            console.warn("Advertencia: Se está registrando una venta sin sesión de caja activa.");
        }
        
        const sucursalObj = store.sucursales.find(s => s.id === sucursalId);
        const nombreSucursal = sucursalObj ? sucursalObj.nombre : 'Sucursal Desconocida';

        try {
            const yapeRef = doc(db, "yape_notifications", yapeId);
            await updateDoc(yapeRef, {
                status: "PROCESSED",
                claimedAt: serverTimestamp(),
                branchId: sucursalId,
                branchName: nombreSucursal,
                sessionId: currentShift.id,
                movementId: movementId,
                cashierName: currentShift.cajero || 'Cajero no registrado'
            });
            return true;
        } catch (e) {
            console.error("Error reclamando Yape:", e);
            throw e;
        }
    };

    /**
     * Escucha las transacciones pendientes para el admin dado
     * @param {string} emailAdmin
     */
    const escucharPendientes = (emailAdmin) => {
        if (!emailAdmin) return;

        loading.value = true;
        const q = query(
            collection(db, "yape_notifications"),
            where("userEmail", "==", emailAdmin),
            where("status", "==", "pending"),
            orderBy("timestamp", "desc")
        );

        if (unsubPendientes) unsubPendientes();

        unsubPendientes = onSnapshot(q, (snapshot) => {
            yapesPendientes.value = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            loading.value = false;
        }, (err) => {
            console.error("Error feed Yape:", err);
            error.value = err.message;
        });
    };

    /**
     * Detiene todas las escuchas activas
     */
    const detenerTodo = () => {
        if (unsubPendientes) unsubPendientes();
        yapesPendientes.value = [];
    };

    /**
     * Retorna las propiedades y métodos del composable
     */
    return {
        yapesPendientes,
        loading,
        error,
        escucharPendientes,
        reclamarYape,
        detenerTodo
    };
}