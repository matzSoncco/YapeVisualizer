import { ref } from 'vue';
import { db } from '../firebaseConfig';
import { 
    collection, query, where, orderBy, onSnapshot, doc, updateDoc, serverTimestamp 
} from "firebase/firestore";
import { store } from '../store';

/**
 * Composable para manejar las transacciones de Yape
 * Logica de autoasignacion cuando el numero de sucursales es 1
 * @returns {Object} Propiedades y métodos del composable
 */
export function useYape() {
    const yapesPendientes = ref([]);
    const misVentas = ref([]);
    const loading = ref(false);
    const error = ref(null);

    let unsubPendientes = null;
    let unsubMisVentas = null;

    /**
     * Reclama una transacción pendiente (Método base).
     * @param {string} yapeId - ID del documento
     * @param {string} nombreSucursal - Nombre de la sede destino
     * @returns {Promise<boolean>}
     */
    const reclamarYape = async (yapeId, nombreSucursal) => {
        try {
            const yapeRef = doc(db, "yape_notifications", yapeId);
            await updateDoc(yapeRef, {
                status: "claimed",
                branchName: nombreSucursal,
                claimedAt: serverTimestamp()
            });
            return true;
        } catch (e) {
            console.error(e);
            throw e;
        }
    };

    /**
     * Lógica interna: Verifica si se debe auto-asignar el Yape.
     * Se ejecuta cada vez que 'escucharPendientes' detecta un documento nuevo.
     * @param {string} yapeId 
     */
    const intentarAutoAsignacion = async (yapeId) => {
        const totalSucursales = store.sucursales.length;

        if (totalSucursales === 1) {
            const unicaSucursal = store.sucursales[0];
            console.log(`Asignando Yape ${yapeId} a ${unicaSucursal.nombre}`);
            
            await reclamarYape(yapeId, unicaSucursal.nombre);
        }
    };

    /**
     * Escucha las transacciones pendientes para el admin dado
     * @param {*} emailAdmin
     */
    const escucharPendientes = (emailAdmin) => {
        loading.value = true;
        const q = query(
            collection(db, "yape_notifications"),
            where("userEmail", "==", emailAdmin),
            where("status", "==", "pending"),
            orderBy("timestamp", "desc")
        );

        unsubPendientes = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    intentarAutoAsignacion(change.doc.id);
                }
            });
            yapesPendientes.value = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            loading.value = false;
        }, (err) => {
            console.error("Error pendientes:", err);
            error.value = err.message;
        });
    };

    /**
     * Escucha las transacciones reclamadas por el admin en la sucursal dada
     * @param {string} emailAdmin 
     * @param {string} nombreSucursal 
     */
    const escucharMisVentas = (emailAdmin, nombreSucursal) => {
        const q = query(
            collection(db, "yape_notifications"),
            where("userEmail", "==", emailAdmin),
            where("status", "==", "claimed"),
            where("branchName", "==", nombreSucursal),
            orderBy("claimedAt", "desc")
        );

        unsubMisVentas = onSnapshot(q, (snapshot) => {
            misVentas.value = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        });
    };

    /**
     * Detiene todas las escuchas activas
     */
    const detenerTodo = () => {
        if (unsubPendientes) unsubPendientes();
        if (unsubMisVentas) unsubMisVentas();
    };

    /**
     * Retorna las propiedades y métodos del composable
     */
    return {
        yapesPendientes,
        misVentas,
        loading,
        error,
        escucharPendientes,
        escucharMisVentas,
        reclamarYape,
        detenerTodo
    };
}