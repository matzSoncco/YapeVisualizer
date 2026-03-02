import { computed, reactive } from 'vue';
import { db } from "../firebaseConfig";
import {
    onSnapshot,
    collection,
    addDoc,
    doc,
    updateDoc,
    query,
    where,
    getDoc,
    limit,
    serverTimestamp,
} from "firebase/firestore";
import { useAuth } from './useAuth';
import { store, setCurrentShift, setLoading } from '@/store';

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
        setLoading(true);

        try {
            const shiftsRef = collection(db, 'users', user.value.uid, 'sucursales', sucursalId.value, 'shifts');
            const q = query(shiftsRef, where('status', '==', 'OPEN'), limit(1));
            
            return onSnapshot(q, (snapshot) => {
                if (!snapshot.empty) {
                    const docData = snapshot.docs[0];
                    setCurrentShift({ id: docData.id, ...docData.data() });
                } else {
                    setCurrentShift(null);
                }
                setLoading(false);
            }, (error) => {
                console.error("Error en el stream del turno:", error);
                setLoading(false);
            });
        } catch (error) {
            console.error("Error verificando turno activo:", error);
            setLoading(false);
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
                totalDigitalSales: 0,
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

    const arqueoState = reactive({
        isOpen: false,
        monto: null,
        loading: false
    })

    const abrirArqueo = () => {
        arqueoState.monto = null;
        arqueoState.isOpen = true;
    };

    /**
     * Cierra el turno actual
     */
    const cerrarTurno = async () => {
        const localShift = store.currentShift;
        const currentSucursalId = store.sucursalActual;

        if (!localShift?.id || !currentSucursalId) {
            arqueoState.loading = false;
            throw new Error("Contexto inválido para cierre");
        }

        arqueoState.loading = true;

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
            const digital = Number(stats.totalDigitalSales || 0);
            const exp = Number(stats.totalExpenses || 0);

            const declarado = Number(arqueoState.monto) || 0;
            const efectivoTeorico = Math.round((fnd + cash - exp) * 100) / 100;
            const diferencia = Math.round((declarado - efectivoTeorico) * 100) / 100;
            
            const nombreSede = store.sucursales.find(s => s.id === currentSucursalId)?.nombre || 'Sucursal';

            const cierreData = {
                status: 'CLOSED',
                userId: user.value.uid,
                fechaCierre: new Date().toISOString(),
                timestampCierre: serverTimestamp(),
                sucursalId: currentSucursalId,
                sedeNombre: nombreSede,

                audit: {
                    fund: fnd,
                    totalSystemCash: efectivoTeorico,
                    declaredCash: Number(arqueoState.monto),
                    difference: diferencia,
                    isBalanced: Math.round(diferencia * 100) === 0
                },

                totalIngresosDia: Math.round((cash + digital) * 100) / 100,
                totalDigital: digital,
                totalEfectivoFinal: cash
            };

            await updateDoc(shiftRef, cierreData);

            setCurrentShift(null);
            setTimeout(() => {
                arqueoState.isOpen = false;
                arqueoState.monto = null;
            }, 100);

            return cierreData;
        } catch (error) {
            console.error("Error al cerrar turno:", error);
            throw error;
        } finally {
            arqueoState.loading = false;
        }
    };

    return {
        currentShift,
        isShiftOpen,
        verificarTurnoActivo,
        abrirTurno,
        arqueoState,
        abrirArqueo,
        cerrarTurno
    };
}