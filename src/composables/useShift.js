import { computed } from 'vue';
import { db } from "../firebaseConfig";
import {
    collection,
    addDoc,
    doc,
    updateDoc,
    query,
    where,
    getDocs,
    getDoc,
    limit,
    serverTimestamp,
} from "firebase/firestore";
import { useAuth } from './useAuth';
import { store, setCurrentShift } from '@/store';

export function useShift() {
    const { user } = useAuth();

    const isShiftOpen = computed(() => store.currentShift !== null);
    const currentShift = computed(() => store.currentShift);
    const sucursalId = computed(() => store.sucursalActual);

    /**
     * Verifica si existe un turno abierta para la sucursal actual
     * Se debe llamar al montar el Dashboard
     */
    const verificarTurnoActivo = async () => {
        setCurrentShift(null);
        if (!user.value?.uid || !sucursalId.value || sucursalId.value === 'ADMIN') return;

        try {
            const shiftsRef = collection(db, 'users', user.value.uid, 'sucursales', sucursalId.value, 'shifts');
            const q = query(shiftsRef, where('status', '==', 'OPEN'), limit(1));
            
            const snapshot = await getDocs(q);
            
            if (!snapshot.empty) {
                const docData = snapshot.docs[0];
                setCurrentShift({ id: docData.id, ...docData.data() });
            } else {
                setCurrentShift(null);
            }
        } catch (error) {
            console.error("Error verificando turno activo:", error);
        }
    };

    /**
     * Abre un nuevo turno de caja
     * @param {number} montoInicial - Monto inicial declarado para el turno
     * @param {string} nombreCajero - Nombre de quien abre el turno
     */
    const abrirTurno = async (montoInicial, cajeroNombre) => {
        if (!user.value?.uid || !sucursalId.value) throw new Error("Error de contexto: No hay sucursal");

        const nuevoTurno = {
            status: 'OPEN',
            cajero: cajeroNombre,
            fechaApertura: new Date().toISOString(),
            timestampApertura: serverTimestamp(),

            stats: {
                fund: Number(montoInicial),
                totalCashSales: 0,
                totalYapeSales: 0,
                totalExpenses: 0,
                totalTransactions: 0
            },
            
            fechaCierre: null,
            timestampCierre: null,
            audit: null
        };

        try {
            const shiftsRef = collection(db, 'users', user.value.uid, 'sucursales', sucursalId.value, 'shifts');
            const docRef = await addDoc(shiftsRef, nuevoTurno);

            setCurrentShift({ id: docRef.id, ...nuevoTurno });
            return docRef.id;
        } catch (error) {
            console.error("Error al abrir turno:", error);
            throw error;
        }
    };

    /**
     * Cierra el turno actual
     * @param {number} efectivoRealDeclarado - Monto que el cajero dice tener en efectivo al cerrar
     * @param {string} nombreSucursal - Nombre de la sucursal (valioso para Admin)
     */
    const cerrarTurno = async (efectivoRealDeclarado, nombreSucursal) => {
        const localShift = store.currentShift;
        const currentSucursalId = store.sucursalActual;

        if (!localShift?.id) throw new Error("No hay turno activo para cerrar");
        if (!currentSucursalId) throw new Error("No se detectó la sucursal activa");

        try {
            const shiftRef = doc(db, 'users', user.value.uid, 'sucursales', currentSucursalId, 'shifts', localShift.id);
            const shiftSnap = await getDoc(shiftRef);
            
            if (!shiftSnap.exists()) {
                throw new Error("El turno no existe en la base de datos");
            }

            const freshData = shiftSnap.data();
            const stats = freshData.stats || {};

            const fnd = Number(stats.fund || 0);
            const cash = Number(stats.totalCashSales || 0);
            const yape = Number(stats.totalYapeSales || 0);
            const exp = Number(stats.totalExpenses || 0);
            const declarado = Number(efectivoRealDeclarado) || 0;

            const efectivoTeorico = fnd + cash - exp;
            const diferencia = declarado - efectivoTeorico;            

            const cierreData = {
                status: 'CLOSED',
                fechaCierre: new Date().toISOString(),
                timestampCierre: serverTimestamp(),

                sucursalId: currentSucursalId,
                sedeNombre: nombreSucursal || 'Sucursal Desconocida',

                audit: {
                    fund: fnd,
                    totalSystemCash: efectivoTeorico,
                    declaredCash: Number(efectivoRealDeclarado),
                    difference: diferencia,
                    isBalanced: Math.abs(diferencia) < 0.5
                },

                totalIngresosDia: cash + yape,
                totalYape: yape,
                totalEfectivoFinal: cash
            };

            await updateDoc(shiftRef, cierreData);

            setCurrentShift(null);

            return cierreData;
        } catch (error) {
            console.error("Error al cerrar turno:", error);
            throw error;
        }
    };

    return {
        currentShift,
        isShiftOpen,
        verificarTurnoActivo,
        abrirTurno,
        cerrarTurno
    };
}