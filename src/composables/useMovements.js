import { db } from "../firebaseConfig";
import { 
    collection,
    addDoc,
    doc,
    updateDoc,
    serverTimestamp,
    increment,
    writeBatch,
    onSnapshot,
    query,
    orderBy
} from "firebase/firestore";
import { useAuth } from './useAuth';
import { store } from '../store';
import { useProducts } from "./useProducts";
import { ref } from 'vue';

export function useMovements() {
    const { actualizarCatalogo } = useProducts();
    const { user } = useAuth();

    const movimientosTurno = ref([]); 
    let unsubscribeMoves = null;

    /**
     * ESCUCHAR MOVIMIENTOS (LECTURA EN TIEMPO REAL)
     * Esta función llena la tabla automáticamente
     */
    const escucharMovimientos = async () => {
        if (!store.currentShift?.id || !user.value?.uid) return;

        const shiftId = store.currentShift.id;
        const sucursalId = store.sucursalActual;
        
        const movementsRef = collection(db, 'users', user.value.uid, 'sucursales', sucursalId, 'shifts', shiftId, 'movements');
        
        const q = query(movementsRef, orderBy('timestamp', 'desc'));

        if (unsubscribeMoves) unsubscribeMoves();

        unsubscribeMoves = onSnapshot(q, (snapshot) => {
            movimientosTurno.value = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        }, (error) => {
            console.error("Error escuchando movimientos:", error);
        });
    };

    const detenerEscuchaMovimientos = () => {
        if (unsubscribeMoves) unsubscribeMoves();
        movimientosTurno.value = [];
    };

    /**
     * Registra una venta omo un nuevo movimiento en el turno activo
     * params: { items, payments, total, clientName, metadata }
      * - items: [{ name, price, qty }]
      * - payments: [{ method: 'CASH'|'YAPE', amount, refId? }]
     */
    const registrarVenta = async ({ items, payments, total, clientName, metadata = {} }) => {
        if (!store.currentShift?.id) throw new Error("Turno cerrado. Abra caja primero.");
        
        if ((!items || items.length === 0) && !metadata.isQuickSale) {
             throw new Error("Carrito vacío.");
        }

        const shiftId = store.currentShift.id;
        const sucursalId = store.sucursalActual;
        const batch = writeBatch(db);

        try {
            const shiftRef = doc(db, 'users', user.value.uid, 'sucursales', sucursalId, 'shifts', shiftId);
            const movementsRef = collection(shiftRef, 'movements');
            const newMovRef = doc(movementsRef);

            const saleDoc = {
                type: 'SALE',
                timestamp: serverTimestamp(),
                items: items || [],
                payments: payments.map(p => ({
                    method: p.method,
                    amount: Number(p.amount),
                    refId: p.refId || null
                })),
                totalAmount: Number(total),
                clientName: clientName || 'Cliente Eventual',
                totalItems: items ? items.reduce((acc, i) => acc + i.qty, 0) : 0,
                metadata: {
                    source: 'WEB_POS',
                    ...metadata
                }
            };

            batch.set(newMovRef, saleDoc);

            const statsUpdate = { 'stats.totalTransactions': increment(1) };
            
            payments.forEach(p => {
                const field = p.method === 'CASH' ? 'stats.totalCashSales' : 'stats.totalYapeSales';
                statsUpdate[field] = increment(p.amount);
            });

            batch.update(shiftRef, statsUpdate);

            await batch.commit();

            if (!metadata.isQuickSale && items) {
                items.forEach(item => actualizarCatalogo(item));
            }

            return newMovRef.id;

        } catch (error) {
            console.error("Fallo transaccional:", error);
            throw error;
        }
    };

    /**
     * Registra un gasto como un nuevo movimiento en el turno activo
     * @param {int} amount - Monto del gasto realizado
     * @param {string} description - Descripción del gasto
     */
    const registrarGasto = async (amount, description) => {
         const shiftId = store.currentShift.id;
         const sucursalId = store.sucursalActual;
         const shiftRef = doc(db, 'users', user.value.uid, 'sucursales', sucursalId, 'shifts', shiftId);
         const movementsRef = collection(shiftRef, 'movements');

         await addDoc(movementsRef, {
             type: 'EXPENSE',
             amount: Number(amount),
             description,
             timestamp: serverTimestamp()
         });

         await updateDoc(shiftRef, {
             'stats.totalExpenses': increment(Number(amount)),
             'stats.totalTransactions': increment(1)
         });
    };

    return {
        movimientosTurno,
        escucharMovimientos,
        detenerEscuchaMovimientos,
        registrarVenta,
        registrarGasto
    };
}