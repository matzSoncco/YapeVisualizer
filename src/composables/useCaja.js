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
            status: 'OPEN',
            cajero: nombreCajero,
            fechaApertura: new Date().toISOString(),
            timestampApertura: Timestamp.now(),
            
            montoInicial: 0, 
            totalYape: 0,
            cantidadYape: 0,
            totalEfectivo: 0,
            totalIngresos: 0,
            
            fechaCierre: null,
            timestampCierre: null
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
     * @param {number} montoEfectivoDeclarado - Monto que el cajero dice tener en tickets (Opcional)
     */
    const cerrarCaja = async (montoEfectivoDeclarado = 0) => {
        const session = store.cashSession;
        if (!session?.id) throw new Error("No hay caja abierta para cerrar");

        try {
            const yapesRef = collection(db, 'yape_notifications');
            const q = query(yapesRef, where('sessionId', '==', session.id), where('status', '==', 'claimed'));
            const snapshot = await getDocs(q);

            let totalYapeCalculado = 0;
            let cantidadVentas = 0;

            snapshot.forEach((doc) => {
                totalYapeCalculado += Number(doc.data().amount || 0);
                cantidadVentas++;
            });

            const cierreData = {
                status: 'CLOSED',
                fechaCierre: new Date().toISOString(),
                timestampCierre: Timestamp.now(),

                cantidadYape: cantidadVentas,
                totalYape: totalYapeCalculado,
                totalEfectivo: Number(montoEfectivoDeclarado || 0),
                
                totalIngresos: totalYapeCalculado + Number(montoEfectivoDeclarado || 0)
            };

            const sessionRef = doc(db, 'users', user.value.uid, 'sucursales', sucursalId.value, 'cuadres', session.id);
            await updateDoc(sessionRef, cierreData);

            setCajaSesion(null);

            return cierreData;
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