import { ref } from 'vue';
import { db } from '../firebaseConfig';
import { 
    collection, query, where, orderBy, onSnapshot, doc, updateDoc, serverTimestamp 
} from "firebase/firestore";

export function useYape() {
    const yapesPendientes = ref([]);
    const misVentas = ref([]);
    const loading = ref(false);
    const error = ref(null);

    let unsubPendientes = null;
    let unsubMisVentas = null;

    /**
     * Escucha las transacciones pendientes para el admin dado
     * @param {*} emailAdmin
     */
    const escucharPendientes = (emailAdmin) => {
        loading.value = true;
        const q = query(
            collection(db, "yape_notifications"),
            where("userEmail", "==", emailAdmin),
            where("status", "==", "pending"), //TODO: El apk debe enviar "pending" al crear
            orderBy("timestamp", "desc")
        );

        unsubPendientes = onSnapshot(q, (snapshot) => {
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
     * @param {*} emailAdmin 
     * @param {*} nombreSucursal 
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
     * Reclama una transaccion pendiente
     * @param {*} yapeId 
     * @param {*} nombreSucursal
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