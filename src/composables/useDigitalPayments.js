import { ref } from 'vue';
import { db } from '../firebaseConfig';
import { 
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    doc,
    getDoc,
    updateDoc,
    serverTimestamp 
} from "firebase/firestore";
import { store } from '../store';
import { useAuth } from './useAuth';

/**
 * Composable para manejar las transacciones de Yape
 * Logica de autoasignacion cuando el numero de sucursales es 1
 * @returns {Object} Propiedades y métodos del composable
 */
export function useDigitalPayments() {
    const { user } = useAuth();
    const pendientes = ref([]);
    const loading = ref(false);
    const error = ref(null);

    let unsubPendientes = null;

    /**
     * Reclama una transacción pendiente (Método base).
     * @param {string} yapeId - ID del documento
     * @param {string} nombreSucursal - Nombre de la sede destino
     * @returns {Promise<boolean>}
     */
    const reclamarPagoDigital = async (yapeId, movementId) => {
        const currentShift = store.currentShift;
        const sucursalId = store.sucursalActual;

        if (!currentShift?.id) {
            console.warn("Advertencia: Se está registrando una venta sin sesión de caja activa.");
        }

        if (!user.value?.uid) throw new Error("Usuario no autenticado");
        
        const sucursalObj = store.sucursales.find(s => s.id === sucursalId);
        const nombreSucursal = sucursalObj ? sucursalObj.nombre : 'Sucursal Desconocida';

        try {
            const digitalRef = doc(db, "users", user.value.uid, "yape_notifications", yapeId);
            const docSnap = await getDoc(digitalRef);
            if (docSnap.exists() && docSnap.data().status === 'PROCESSED') {
                throw new Error("Este pago ya fue reclamado previamente.");
            }
            await updateDoc(digitalRef, {
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
            console.error("Error procesando pago digital:", e);
            throw e;
        }
    };

    /**
     * Escucha las transacciones pendientes para el admin dado
     * @param {string} emailAdmin
     */
    const escucharPendientes = (emailAdmin) => {
        if (!emailAdmin || !user.value?.uid) return;

        loading.value = true;
        const notificationsRef = collection(db, "users", user.value.uid, "yape_notifications");
        const q = query(
            notificationsRef,
            where("status", "==", "pending"),
            orderBy("timestamp", "desc")
        );

        if (unsubPendientes) unsubPendientes();

        unsubPendientes = onSnapshot(q, (snapshot) => {
            pendientes.value = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    monto: Number(data.amount) || 0
                };
            });
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
        pendientes.value = [];
    };

    /**
     * Retorna las propiedades y métodos del composable
     */
    return {
        pendientes,
        loading,
        error,
        escucharPendientes,
        reclamarPagoDigital,
        detenerTodo
    };
}