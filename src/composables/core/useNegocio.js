/**
 * useNegocio.js
 * Composable para gestionar los datos del negocio:
 * - Buscar razon social por RUC via SUNAT (apis.net.pe)
 * - Guardar nombre/ruc en Firestore
 * - Subir logo a Firebase Storage
 */

import { ref } from 'vue'
import { db, storage } from '@/firebaseConfig'
import { doc, updateDoc } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { store } from '@/store'
import { useAuth } from '@/composables/core/useAuth'

export function useNegocio() {
  const { user } = useAuth()
  const loading = ref(false)
  const loadingRuc = ref(false)
  const errorRuc = ref('')

  /**
   * La búsqueda de RUC está siempre disponible via Cloud Function (Firebase)
   */
  const sunatDisponible = true

  /**
   * Busca la razón social por RUC usando apis.net.pe
   * @param {string} ruc - 11 dígitos del RUC
   * @returns {Promise<string>} Razón social del negocio
   */
  const buscarRuc = async (ruc) => {
    if (!ruc || ruc.length !== 11) {
      errorRuc.value = 'El RUC debe tener 11 dígitos'
      return null
    }

    loadingRuc.value = true
    errorRuc.value = ''

    try {
      // Cloud Function que actúa de proxy a decolecta.com (evita CORS en producción)
      const response = await fetch(`https://buscarruc-gq2e4h3yvq-uc.a.run.app?ruc=${ruc}`, {
        headers: { Accept: 'application/json' },
      })

      if (!response.ok) {
        if (response.status === 404) {
          errorRuc.value = 'RUC no encontrado en SUNAT'
        } else {
          errorRuc.value = 'Error al consultar SUNAT. Intenta de nuevo.'
        }
        return null
      }

      const data = await response.json()
      return data.razonSocial || data.nombre || data.razon_social || null
    } catch (e) {
      console.error('SUNAT fetch error:', e)
      errorRuc.value = 'No se pudo conectar con el servicio de SUNAT'
      return null
    } finally {
      loadingRuc.value = false
    }
  }

  /**
   * Guarda los datos del negocio en Firestore y actualiza el store
   * @param {{ nombre: string, ruc: string }} data
   */
  const guardarNegocio = async (data) => {
    if (!user.value?.uid) return

    loading.value = true
    try {
      const userRef = doc(db, 'users', user.value.uid)
      await updateDoc(userRef, { negocio: data })
      Object.assign(store.negocio, data)
    } finally {
      loading.value = false
    }
  }

  /**
   * Sube el logo a Firebase Storage y guarda la URL en Firestore
   * @param {File} file - Archivo de imagen
   * @returns {Promise<string>} URL del logo subido
   */
  const subirLogo = async (file) => {
    if (!user.value?.uid || !file) return null

    loading.value = true
    try {
      const logoRef = storageRef(storage, `users/${user.value.uid}/logo`)
      const snapshot = await uploadBytes(logoRef, file)
      const url = await getDownloadURL(snapshot.ref)

      // Guardar la URL en Firestore bajo negocio.logoUrl
      const userRef = doc(db, 'users', user.value.uid)
      await updateDoc(userRef, { 'negocio.logoUrl': url })
      store.negocio.logoUrl = url

      return url
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    loadingRuc,
    errorRuc,
    sunatDisponible,
    buscarRuc,
    guardarNegocio,
    subirLogo,
  }
}
