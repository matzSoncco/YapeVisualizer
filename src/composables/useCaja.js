import { computed } from 'vue';
import { db } from "../firebaseConfig";
import { collection, addDoc, doc, updateDoc, query, where, getDocs, limit, Timestamp } from "firebase/firestore";
import { useAuth } from './useAuth';
import { store, setCajaSesion } from '../store';

export function useCaja() {
    const { user } = useAuth();

    const isSessionOpened = computed(() => store.cashSession !== null);
    const datosSesion = computed(() => store.cashSession);
    const sucursalId = computed(() => store.sucursalActual);

    /**
     * Verifica si existe una caja abierta para la sucursal actual
     * Se debe llamar al montar el Dashboard
     */
    const verificarCajaAbierta = async () => {
        setCajaSesion(null);
        if (!user.value?.uid || !sucursalId.value || sucursalId.value === 'ADMIN') return;

        try {
            const cuadresRef = collection(db, 'users', user.value.uid, 'sucursales', sucursalId.value, 'cuadres');
            const q = query(cuadresRef, where('status', '==', 'OPEN'), limit(1));
            
            const snapshot = await getDocs(q);
            
            if (!snapshot.empty) {
                const docData = snapshot.docs[0];
                setCajaSesion({ id: docData.id, ...docData.data() });
            } else {
                setCajaSesion(null);
            }
        } catch (error) {
            console.error("Error verificando caja:", error);
        }
    };

    /**
     * Abre un nuevo turno de caja
     * @param {string} nombreCajero - Nombre de quien abre el turno
     */
    const abrirCaja = async (nombreCajero) => {
        if (!user.value?.uid || !sucursalId.value) throw new Error("No hay sucursal seleccionada");

        const nuevaCaja = {
            fechaApertura: new Date().toISOString(),
            timestampApertura: Timestamp.now(),
            cajero: nombreCajero,
            status: 'OPEN',
            montoInicial: 0,
            totalYape: 0,
            totalEfectivo: 0,
            fechaCierre: null
        };

        try {
            const cuadresRef = collection(db, 'users', user.value.uid, 'sucursales', sucursalId.value, 'cuadres');
            const docRef = await addDoc(cuadresRef, nuevaCaja);

            setCajaSesion({ id: docRef.id, ...nuevaCaja });
            return docRef.id;
        } catch (error) {
            console.error("Error al abrir caja:", error);
            throw error;
        }
    };

    /**
     * Cierra el turno actual
     * @param {number} totalEfectivoDeclarado - Monto que el cajero dice tener en tickets (Opcional)
     * @param {number} totalYapeValidado - Suma total de los Yapes pescados (calculado en el front o back)
     */
    const cerrarCaja = async (totalEfectivoDeclarado, totalYapeValidado) => {
        const session = store.cashSession;
        if (!session?.id) throw new Error("No hay caja abierta para cerrar");

        const cierreData = {
            fechaCierre: new Date().toISOString(),
            timestampCierre: Timestamp.now(),
            status: 'CLOSED',
            totalYape: totalYapeValidado || 0,
            montoDeclaradoEfectivo: totalEfectivoDeclarado || 0
        };

        try {
            const docRef = doc(db, 'users', user.value.uid, 'sucursales', sucursalId.value, 'cuadres', session.id);
            await updateDoc(docRef, cierreData);
            setCajaSesion(null);
        } catch (error) {
            console.error("Error al cerrar caja:", error);
            throw error;
        }
    };

    return {
        isSessionOpened,
        datosSesion,
        verificarCajaAbierta,
        abrirCaja,
        cerrarCaja
    };
}