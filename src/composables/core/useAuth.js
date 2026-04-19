import { ref, computed } from 'vue'
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { auth, db } from '@/firebaseConfig'
import { store, setUserProfile } from '@/store'
import { apiFetch } from '@/services/api'

const user = ref(null)

/**
 * Authentication state listener
 * Syncs Firebase Auth with the Backend Profile
 */
onAuthStateChanged(auth, async (currentUser) => {
  user.value = currentUser

  if (currentUser) {
    try {
      const result = await apiFetch('auth/sync-profile', {
        method: 'POST',
        body: JSON.stringify({
          email: currentUser.email,
          displayName: currentUser.displayName,
        }),
      })

      setUserProfile(result.data)
    } catch (error) {
      console.error('Error sincronizando el backend:', error.message)
      // TODO: Manage this error trough a error state or redirect to login if the session is invalid
    }
  } else {
    setUserProfile(null)
  }
})

/**
 * Composable para manejar autenticación de usuarios
 * @returns {Object} Funciones y propiedades relacionadas con la autenticación
 */
export function useAuth() {
  const error = ref(null)
  const loading = ref(false)

  /**
   * Iniciar sesión con Google mediante popup
   * @returns {Promise<void>} Promesa que se resuelve cuando la operación de login finaliza.
   */
  const logInWithGoogle = async () => {
    error.value = null
    loading.value = true
    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })
      await signInWithPopup(auth, provider)
    } catch (err) {
      error.value = err.code
      console.error('Error en login:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Cerrar sesión del usuario actual
   * @returns {Promise<void>} Promesa que se resuelve cuando la operación de logout finaliza.
   */
  const logOut = async () => {
    try {
      await signOut(auth)
      user.value = null
    } catch (err) {
      console.error('Error en logout:', err)
    }
  }

  /**
   * Updates PIN via backend API
   * @param {string} currentPin - The current PIN for verification
   * @param {string} newPin - The new PIN to set
   * @returns {Promise<boolean>} Resolves to true if the update was successful, otherwise throws an error
   */
  const updateAdminPin = async (currentPin, newPin) => {
    if (!user.value) throw new Error('Sesión no válida')

    loading.value = true
    try {
      const response = await apiFetch('auth/update-pin', {
        method: 'POST',
        body: JSON.stringify({ currentPin, newPin }),
      })

      setUserProfile({ ...store.userProfile, adminPin: response.data.adminPin })
      return true
    } catch (err) {
      console.error('Error al actualizar el PIN:', err.message)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Verifies the provided PIN againts the backend API
   * @param {string} inputPin - The PIN to verify
   * @returns {Promise<boolean>} Resolves to true if the PIN is correct, false otherwise
   */
  const verifyAdminPin = async (inputPin) => {
    if (!user.value) return false
    loading.value = true
    try {
      const result = await apiFetch('auth/verify-pin', {
        method: 'POST',
        body: JSON.stringify({
          pin: inputPin,
        }),
      })
      return result.success
    } catch (error) {
      console.error('La verificación del PIN falló:', error.message)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Computed property for insecure PIN check
   */
  const hasInsecurePin = computed(() => {
    // Note: Backend migration logic should handle the comparison
    return store.userProfile?.adminPin === '1234';
  });

  /**
   * Updates business profile via Backend
   * @param {*} profileData - Objeto con los datos del perfil del negocio
   */
  const updateBusinessProfile = async (profileData) => {
    if (!user.value) throw new Error('Sesión no válida')

    loading.value = true
    try {
      const response = await apiFetch('business/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });

      setUserProfile({
        ...store.userProfile,
        ...response.data,
      });
    } catch (err) {
      console.error('Error actualizando el perfil del negocio:', err.message);
      throw err;
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    error,
    loading,
    logInWithGoogle,
    logOut,
    updateAdminPin,
    updateBusinessProfile,
    verifyAdminPin,
    hasInsecurePin,
  };
}
