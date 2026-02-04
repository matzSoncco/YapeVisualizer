import { ref } from 'vue';
import { db } from "../firebaseConfig";
import { collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { useAuth } from './useAuth';

export function useReportes() {
    const { user } = useAuth();
    const loading = ref(false);
    const reportes = ref([]);
    const error = ref(null);

    /**
     * Busca reportes (cuadres) en Firestore basado en filtros
     * @param {Date} fechaInicio 
     * @param {Date} fechaFin 
     * @param {String} sucursalId (Opcional)
     */
    const buscarReportes = async (fechaInicio, fechaFin, sucursalId) => {
        if (!user.value?.uid) return;
        
        loading.value = true;
        error.value = null;
        reportes.value = [];

        try {
            // 1. Normalizar Fechas (Inicio 00:00:00 - Fin 23:59:59)
            const start = new Date(fechaInicio);
            start.setHours(0, 0, 0, 0);
            
            const end = new Date(fechaFin);
            end.setHours(23, 59, 59, 999);

            // TODO: Aquí hay un detalle técnico con Firestore.
            // Firestore no permite hacer query a 'collectionGroup' filtrando por padre fácilmente sin índices complejos.
            // ESTRATEGIA: Si selecciona una sucursal, consultamos esa. Si son "Todas", iteramos (es más barato que índices compuestos).

            let promesas = [];

            if (sucursalId) {
                // CASO A: Una sucursal específica
                const q = query(
                    collection(db, 'users', user.value.uid, 'sucursales', sucursalId, 'cuadres'),
                    where('fecha', '>=', start.toISOString()), // Asumiendo que guardas ISOString
                    where('fecha', '<=', end.toISOString()),
                    orderBy('fecha', 'desc')
                );
                promesas.push(getDocs(q));
            } else {
                // CASO B: Todas las sucursales (Consultamos las sucursales primero o las pasas como argumento)
                // Para simplificar, aquí el usuario debe pasar la lista de IDs o hacemos collectionGroup con cuidado.
                // Por ahora, lanzaremos error si no hay sucursal, o implementaremos la lógica de "Todas" luego.
                // (Para este ejemplo asumiremos que el usuario selecciona una o manejaremos "todas" iterando afuera).
                console.warn("La búsqueda de 'Todas' requiere iteración. Selecciona una sede por ahora.");
            }

            const snapshots = await Promise.all(promesas);
            
            let resultados = [];
            snapshots.forEach(snap => {
                snap.forEach(doc => {
                    resultados.push({ id: doc.id, ...doc.data() });
                });
            });

            // Ordenamos en memoria por si fusionamos varias sucursales
            reportes.value = resultados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        } catch (err) {
            console.error("Error buscando reportes:", err);
            error.value = err.message;
        } finally {
            loading.value = false;
        }
    };

    return {
        reportes,
        loading,
        error,
        buscarReportes
    };
}