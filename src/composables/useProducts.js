import { ref } from 'vue';
import { db } from "../firebaseConfig";
import { 
    collection, query, where, getDocs, limit, setDoc, doc, 
    increment, serverTimestamp 
} from "firebase/firestore";
import { useAuth } from './useAuth';

export function useProducts() {
    const { user } = useAuth();
    const suggestions = ref([]);

    /**
     * Búsqueda en el Catálogo Maestro (Nivel Usuario, no Sucursal)
     * Optimizado para reducir lecturas (Limit 5)
     */
    const buscarProductos = async (text) => {
        if (!user.value?.uid || !text || text.length < 2) {
            suggestions.value = [];
            return;
        }

        const searchTerm = text.toUpperCase();

        try {
            const productsRef = collection(db, 'users', user.value.uid, 'products');
            
            const q = query(
                productsRef, 
                where('name', '>=', searchTerm),
                where('name', '<=', searchTerm + '\uf8ff'),
                limit(5)
            );

            const snapshot = await getDocs(q);
            suggestions.value = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

        } catch (error) {
            console.error("Error en catálogo:", error);
        }
    };

    /**
     * Auto-aprendizaje del Catálogo
     * Si el cajero vende "X", el sistema aprende "X" para la próxima
     */
    const actualizarCatalogo = async (item) => {
        if (!user.value?.uid || !item.name) return;

        const productId = item.name.trim().toUpperCase().replace(/\s+/g, '_'); 
        const productRef = doc(db, 'users', user.value.uid, 'products', productId);

        try {
            await setDoc(productRef, {
                name: item.name.toUpperCase(),
                lastPrice: Number(item.price),
                updatedAt: serverTimestamp(),
                frequency: increment(1)
            }, { merge: true });
        } catch (error) {
            console.error("Error aprendiendo producto:", error);
        }
    };

    return {
        suggestions,
        buscarProductos,
        actualizarCatalogo
    };
}