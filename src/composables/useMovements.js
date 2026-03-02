import { db } from "../firebaseConfig";
import { 
    collection,
    doc,
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
import { ref, reactive } from 'vue';

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
      * - payments: [{ method: 'CASH'|'DIGITAL', amount, refId? }]
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
                payments: payments.map(p => {
                    const safeAmount = Math.round((Number(p.amount) || 0) * 100) / 100;
                    return {
                        method: p.method,
                        amount: safeAmount,
                        refId: p.refId || null,
                        wallet: p.wallet || (p.method === 'YAPE' ? 'YAPE' : null)
                    };
                }),
                totalAmount: Math.round((Number(total) || 0) * 100) / 100,
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
                const field = p.method === 'CASH' ? 'stats.totalCashSales' : 'stats.totalDigitalSales';
                const safeAmount = Math.round((Number(p.amount) || 0) * 100) / 100;
                statsUpdate[field] = increment(safeAmount);
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

    const expenseState = reactive({
        isOpen: false,
        description: '',
        amount: null,
        loading: false
    })

    /**
     * Registra un gasto como un nuevo movimiento en el turno activo
     */
    const registrarGasto = async () => {
        if (!store.currentShift?.id) return;
        if (!expenseState.description || !expenseState.amount) {
            throw new Error("Datos incompletos");
        }

        expenseState.loading = true;
        const shiftId = store.currentShift.id;
        const sucursalId = store.sucursalActual;
        const batch = writeBatch(db)

        try {
            const shiftRef = doc(db, 'users', user.value.uid, 'sucursales', sucursalId, 'shifts', shiftId);
            const newMovRef = doc(collection(shiftRef, 'movements'));

            batch.set(newMovRef, {
                type: 'EXPENSE',
                amount: Number(expenseState.amount),
                description: expenseState.description,
                timestamp: serverTimestamp()
            });

            batch.update(shiftRef, {
                'stats.totalExpenses': increment(Number(expenseState.amount)),
                'stats.totalTransactions': increment(1)
            });

            await batch.commit();

            expenseState.isOpen = false;
            expenseState.description = '';
            expenseState.amount = null;
        } catch (error) {
            console.error("Error atomic gasto:", error);
            throw error;
        } finally {
            expenseState.loading = false;
        }
    };

    return {
        movimientosTurno,
        escucharMovimientos,
        detenerEscuchaMovimientos,
        registrarVenta,
        expenseState,
        registrarGasto
    };
}