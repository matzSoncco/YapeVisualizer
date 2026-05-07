import { ref } from 'vue'
import { db } from '@/firebaseConfig'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  getDocs
} from 'firebase/firestore'
import { store } from '@/store'
import { useAuth } from '@/composables/core/useAuth'
import { useShift } from './useShift'

/**
 * Composable para manejar las transacciones de Yape
 * Lógica de autoasignación y gestión de turnos
 * @returns {Object} Propiedades y métodos del composable
 */
export function useDigitalPayments() {
  const { user } = useAuth()
  const pendientes = ref([])
  const loading = ref(false)
  const error = ref(null)

  let unsubPendientes = null

  /**
   * Reclama una transacción pendiente (Método base).
   * @param {string} yapeId - ID del documento
   * @param {string} movementData - ID o Data del movimiento
   * @returns {Promise<boolean>}
   */
  const reclamarPagoDigital = async (yapeId, movementData) => {
    const finalMovementId = typeof movementData === 'object' ? movementData.id : movementData
    const currentShift = store.currentShift
    const sucursalId = store.sucursalActual

    if (!currentShift?.id) {
      console.warn('Advertencia: Se está registrando una venta sin sesión de caja activa.')
    }

    if (!user.value?.uid) throw new Error('Usuario no autenticado')

    const sucursalObj = store.sucursales.find((s) => s.id === sucursalId)
    const nombreSucursal = sucursalObj ? sucursalObj.nombre : 'Sucursal Desconocida'

    try {
      const digitalRef = doc(db, 'users', user.value.uid, 'yape_notifications', yapeId)
      const docSnap = await getDoc(digitalRef)
      if (docSnap.exists() && docSnap.data().status === 'PROCESSED') {
        throw new Error('Este pago ya fue reclamado previamente.')
      }
      await updateDoc(digitalRef, {
        status: 'PROCESSED',
        claimedAt: serverTimestamp(),
        branchId: sucursalId,
        branchName: nombreSucursal,
        sessionId: currentShift?.id || null, // Protección extra si no hay turno
        movementId: finalMovementId,
        cashierName: currentShift?.cajero || 'Cajero no registrado',
      })
      return true
    } catch (e) {
      console.error('Error procesando pago digital:', e)
      throw e
    }
  }

  /**
   * Escucha las transacciones pendientes SÓLO del turno activo
   * @param {string} emailAdmin
   */
  const escucharPendientes = (emailAdmin) => {
    if (!emailAdmin || !user.value?.uid) return

    loading.value = true
    const notificationsRef = collection(db, 'users', user.value.uid, 'yape_notifications')
    const currentShift = store.currentShift

    // 1. Consulta simple: Solo traemos los pendientes.
    // Esto ya NO requiere el Índice Compuesto en Firebase.
    const q = query(
      notificationsRef,
      where('status', '==', 'pending'),
      orderBy('timestamp', 'desc')
    )

    if (unsubPendientes) unsubPendientes()

    unsubPendientes = onSnapshot(
      q,
      (snapshot) => {
        // 2. Calcular la fecha límite real
        let fechaLimite;
        if (currentShift && currentShift.openedAt) {
          // Si es Timestamp de Firebase, lo convertimos. Si es string/número, usamos new Date()
          fechaLimite = currentShift.openedAt.toDate 
            ? currentShift.openedAt.toDate() 
            : new Date(currentShift.openedAt);
        } else {
          // Si no hay turno, el límite estricto es HOY a las 00:00:00
          fechaLimite = new Date();
          fechaLimite.setHours(0, 0, 0, 0);
        }

        // 3. El Candado: Filtrar los documentos uno por uno
        const pagosFiltrados = [];
        
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          
          // Uniformizamos la fecha del Yape
          let yapeFecha = new Date(0); // Fecha muy antigua por si hay error
          if (data.timestamp) {
             yapeFecha = data.timestamp.toDate 
               ? data.timestamp.toDate() 
               : new Date(data.timestamp);
          }

          if (yapeFecha >= fechaLimite) {
            pagosFiltrados.push({
              id: doc.id,
              ...data,
              monto: Number(data.amount) || 0,
            });
          }
        });

        // 4. Actualizamos la vista solo con los que pasaron el filtro
        pendientes.value = pagosFiltrados;
        loading.value = false;
      },
      (err) => {
        console.error('Error feed Yape:', err)
        error.value = err.message
      }
    )
  }

  /**
   * Busca el historial completo de Yapes para una fecha específica
   * @param {string} fechaString - Formato 'YYYY-MM-DD'
   * @returns {Promise<Array>} Lista de Yapes
   */
  const fetchHistorial = async (fechaString) => {
    if (!user.value?.uid || !fechaString) return []

    try {
      // Construimos el rango desde las 00:00:00 hasta las 23:59:59 del día solicitado
      const inicio = new Date(`${fechaString}T00:00:00`)
      const fin = new Date(`${fechaString}T23:59:59`)

      const notificationsRef = collection(db, 'users', user.value.uid, 'yape_notifications')
      
      // Aquí traemos TODOS los pagos de esa fecha, sin importar si son 'pending' o 'PROCESSED'
      const q = query(
        notificationsRef,
        where('timestamp', '>=', inicio),
        where('timestamp', '<=', fin),
        orderBy('timestamp', 'desc')
      )

      const snapshot = await getDocs(q)
      
      return snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          monto: Number(data.amount) || 0,
        }
      })
    } catch (err) {
      console.error('Error obteniendo el historial de Yape:', err)
      throw err
    }
  }

  /**
   * Detiene todas las escuchas activas
   */
  const detenerTodo = () => {
    if (unsubPendientes) unsubPendientes()
    pendientes.value = []
  }

  return {
    pendientes,
    loading,
    error,
    escucharPendientes,
    reclamarPagoDigital,
    fetchHistorial, 
    detenerTodo,
  }
}