import { computed } from 'vue'
import { db } from '@/firebaseConfig'
import { collection, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore'
import { useAuth } from '../core/useAuth'
import { store, setCurrentBranch } from '@/store'

/**
 * Composable para manejar sucursales
 * @returns {Object} Funciones y propiedades relacionadas con sucursales
 */
export function useSucursal() {
  const { user, verifyAdminPin } = useAuth()

  /**
   * Agrega una nueva sucursal a la subcolección del usuario actual en Firestore.
   * @param {Object} data - Datos de la sucursal
   * @returns {Promise<void>} Promesa que se resuelve cuando la operación en la BD finaliza.
   */
  const addSucursal = async (data) => {
    if (!user.value?.uid) return
    const subscription = store.userProfile.subscription || {}
    const limitePermitido = subscription.limitSucursales || 0
    const cantidadActual = store.sucursales.length

    if (cantidadActual >= limitePermitido) {
      // Lanzamos error para que el 'catch' del ProfileView lo muestre en alerta
      // TODO: Mejorar con un modal para UX más amigable (decidir donde mostrarlo y qué lógica usar)
      throw new Error(
        `Límite alcanzado (${cantidadActual}/${limitePermitido}). Tu plan actual no permite crear más sedes.`,
      )
    }

    const newRef = doc(collection(db, 'users', user.value.uid, 'sucursales'))
    await setDoc(newRef, {
      nombre: data.nombre,
      icono: data.icono || '🏪',
      direccion: data.direccion || '',
      telefono: data.telefono || '',
      serie: data.serie || 'NV001',
      proximoCorrelativo: data.proximoCorrelativo || 1,
      activa: true,
      createdAt: new Date().toISOString(),
    })
  }

  /**
   * Actualiza los datos de una sucursal existente en Firestore
   * @param {String} id - UID de la sucursal a actualizar
   * @param {Object} data - Datos actualizados de la sucursal
   * @returns {Promise<void>} Promesa que se resuelve cuando la operación en la BD finaliza.
   */

  const updateSucursal = async (id, data) => {
    if (!user.value?.uid) return
    const ref = doc(db, 'users', user.value.uid, 'sucursales', id)
    await updateDoc(ref, {
      nombre: data.nombre,
      icono: data.icono,
      direccion: data.direccion,
      telefono: data.telefono,
      serie: data.serie,
      proximoCorrelativo: data.proximoCorrelativo,
    })
  }

  /**
   * Elimina una sucursal de la subcolección del usuario actual en Firestore
   * @param {String} id - UID de la sucursal a eliminar
   * @returns {Promise<void>} Promesa que se resuelve cuando la operación en la BD finaliza.
   */
  const deleteSucursal = async (id) => {
    if (!user.value?.uid) return
    await deleteDoc(doc(db, 'users', user.value.uid, 'sucursales', id))
  }

  /**
   * Metodo para seleccionar la sucursal o ADMIN
   * @param {string} nombreId - uid de la sucursal o 'ADMIN'
   * @param {string|null} pinIngresado - El PIN que viene del Modal (solo si es ADMIN)
   */
  const seleccionar = async (nombreId, pinIngresado = null) => {
    if (nombreId !== 'ADMIN') {
      setCurrentBranch(nombreId)
      return true
    }

    if (!pinIngresado) return false

    const esValido = await verifyAdminPin(pinIngresado)

    if (esValido) {
      setCurrentBranch('ADMIN')
      return true
    }

    console.error('PIN incorrecto o no proporcionado')
    return false
  }

  /**
   * Cálculo del nombre de la sucursal actual
   * @return {string} Nombre de la sucursal o 'Administrador'
   */
  const nombreSucursalActual = computed(() => {
    const actual = store.sucursalActual
    if (!actual) return ''
    if (actual === 'ADMIN') return 'Administrador'

    const suc = sucursales.value.find((s) => s.id === actual)
    return suc ? suc.nombre : 'Cargando...'
  })

  /**
   * Limpia la sucursal actual seleccionada
   */
  const limpiarSucursal = () => {
    setCurrentBranch(null)
  }

  /**
   * Lista de sucursales desde el store reactivo
   */
  const sucursales = computed(() => {
    return store.sucursales
  })

  return {
    sucursales,
    sucursalActual: computed(() => store.sucursalActual),
    loading: computed(() => store.loading),
    esAdmin: computed(() => store.sucursalActual === 'ADMIN'),
    nombreSucursalActual,

    addSucursal,
    deleteSucursal,
    updateSucursal,
    seleccionar,
    limpiarSucursal,
  }
}
