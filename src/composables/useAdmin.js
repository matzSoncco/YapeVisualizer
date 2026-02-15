import { ref, computed } from 'vue';
import { db } from '@/firebaseConfig';
import { 
    collectionGroup, 
    query, 
    where, 
    getDocs, 
    orderBy, 
    Timestamp 
} from "firebase/firestore";
import { useAuth } from '@/composables/useAuth';

export function useAdmin() {
    const reportes = ref([]);
    const loadingReportes = ref(false);
    const error = ref(null);
    const { user } = useAuth();

    /**
     * Busca los cuadres cerrados en el rango de fechas y sucursal
     * @param {Object} filters - Filtros de búsqueda
     */
    const buscarCuadres = async (filters) => {
        if (!user.value?.uid) {
            console.error("No hay usuario autenticado para buscar cuadres");
            error.value = "Sesión expirada o no válida";
            return;
        }

        loadingReportes.value = true;
        reportes.value = [];
        error.value = null;

        try {
            const start = new Date(filters.startDate);
            start.setHours(0, 0, 0, 0);
            
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59, 999);

            const cuadresRef = collectionGroup(db, 'shifts');
            
            const constraints = [
                where('userId', '==', user.value.uid),
                where('status', '==', 'CLOSED'),
                where('timestampCierre', '>=', Timestamp.fromDate(start)),
                where('timestampCierre', '<=', Timestamp.fromDate(end)),
                orderBy('timestampCierre', 'desc')
            ];

            if (filters.branchId) {
               constraints.push(where('sucursalId', '==', filters.branchId));
            }

            const q = query(cuadresRef, ...constraints);
            const snapshot = await getDocs(q);

            reportes.value = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    fecha: data.timestampCierre?.toDate() || new Date(),
                    sedeNombre: data.sedeNombre || 'Desconocida',
                    cajero: data.cajero || 'Desconocido',
                    
                    montoYape: Number(data.totalYape || 0),
                    montoEfectivo: Number(data.audit?.declaredCash || 0),
                    totalIngresosDia: Number(data.totalIngresosDia || 0),
                    
                    diferencia: Number(data.audit?.difference || 0),
                    estado: data.audit?.isBalanced ? 'Cuadrado' : 'Descuadrado',
                    
                    sucursalId: data.sucursalId
                };
            });

            return { empty: snapshot.empty, count: snapshot.size };

        } catch (err) {
            console.error("Error buscando cuadres:", err);
            error.value = err.message;
            throw err;
        } finally {
            loadingReportes.value = false;
        }
    };

    /**
     * KPI Cards: Cálculos agregados
     */
    const kpis = computed(() => {
        const totalVentas = reportes.value.reduce((acc, r) => acc + r.totalIngresosDia, 0);
        const totalYape = reportes.value.reduce((acc, r) => acc + r.montoYape, 0);
        const totalDiferencia = reportes.value.reduce((acc, r) => acc + r.diferencia, 0);
        const count = reportes.value.length || 1;

        return {
            totalVentas,
            totalYape,
            porcentajeDigital: totalVentas > 0 ? (totalYape / totalVentas) * 100 : 0,
            diferenciaNeta: totalDiferencia,
            ticketPromedio: totalVentas / count
        };
    });

    /**
     * Data para Gráfico de Línea (Ventas por Día)
     */
    const salesChartData = computed(() => {
        const groups = {};
        
        const sorted = [...reportes.value].sort((a, b) => a.fecha - b.fecha);

        sorted.forEach(r => {
            const day = r.fecha.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
            if (!groups[day]) groups[day] = 0;
            groups[day] += r.totalIngresosDia;
        });

        return {
            labels: Object.keys(groups),
            datasets: [
                {
                    label: 'Ventas Totales (S/)',
                    data: Object.values(groups),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    tension: 0.4,
                    fill: true
                }
            ]
        };
    });

    /**
     * Data para Gráfico de Dona
     * Agrupa por sucursal y suma los ingresos totales del día para cada una
     */
    const branchChartData = computed(() => {
        const groups = {};

        reportes.value.forEach(r => {
            if (!groups[r.sedeNombre]) groups[r.sedeNombre] = 0;
            groups[r.sedeNombre] += r.totalIngresosDia;
        });

        return {
            labels: Object.keys(groups),
            datasets: [
                {
                    data: Object.values(groups),
                    backgroundColor: [
                        '#3b82f6',
                        '#8b5cf6',
                        '#f59e0b',
                        '#ef4444'
                    ]
                }
            ]
        };
    });

    return {
        reportes,
        loadingReportes,
        error,
        buscarCuadres,
        kpis,
        salesChartData,
        branchChartData
    };
}