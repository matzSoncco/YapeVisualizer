import { ref, computed } from 'vue'
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/firebaseConfig'
import { store, setUserProfile, setLoading } from '@/store'
import { apiFetch } from '@/services/api'

const user = ref(null)

/**
 * Listener for auth state changes
 * Updates the user ref whenever the auth state changes
 */
onAuthStateChanged(auth, (firebaseUser) => {
  user.value = firebaseUser
})

export function useAuth() {
  const authError = ref(null)

  /**
   * Syncs the user profile with the backend after login
   * @returns {Promise<Object>} - Promise that resolves with the user profile data
   */
  const syncProfile = async () => {
    setLoading(true)
    const response = await apiFetch('auth/sync-profile', { method: 'POST' })

    try {
      if (!response.ok) {
        throw new Error(response.message || 'Error al sincronizar perfil')
      }

      setUserProfile(response.data)
      return response.data
    } finally {
      setLoading(false)
    }
  }

  /**
   * Login with Google using Firebase Authentication
   * @returns {Promise<void>} - Promise that resolves when the login process is complete
   */
  const logInWithGoogle = async () => {
    setLoading(true)
    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })
      await signInWithPopup(auth, provider)
      await syncProfile()
    } catch (err) {
      authError.value = err.code
      console.error('Error en el acceso:', err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Log out the user and clear the local store
   * @returns {Promise<void>} - Promise that resolves when the logout process is complete
   */
  const logOut = async () => {
    try {
      await signOut(auth)
      store.clearStore()
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  /**
   * Updates the admin PIN by sending the current and new PIN to the backend
   * @param {string} currentPin - The current admin PIN
   * @param {string} newPin - The new admin PIN to set
   * @returns {Promise<boolean>} - Promise that resolves with true if the update was successful, false otherwise
   */
  const updateAdminPin = async (currentPin, newPin) => {
    setLoading(true)

    try {
      const response = await apiFetch('auth/update-pin', {
        method: 'POST',
        body: JSON.stringify({ currentPin, newPin }),
      })
      return response.ok
    } finally {
      setLoading(false)
    }
  }

  /**
   * Verifies the entered PIN against the one stored in Firestore for the current user
   * @param {string} pin - The admin PIN to verify
   * @returns {Promise<boolean>} - Promise that resolves with true if the PIN is valid, false otherwise
   */
  const verifyAdminPin = async (pin) => {
    setLoading(true)
    try {
      const response = await apiFetch('auth/verify-pin', {
        method: 'POST',
        body: JSON.stringify({ pin }),
      })
      return response.ok
    } finally {
      setLoading(false)
    }
  }

  /**
   * Computed property to check if the user has an insecure PIN
   * @returns {boolean} - True if the user's profile is not configured, false otherwise
   */
  const hasInsecurePin = computed(() => {
    return store.userProfile?.isConfigured === false
  })

  return {
    user,
    authError,
    isLoading: computed(() => store.loading),
    logInWithGoogle,
    logOut,
    syncProfile,
    updateAdminPin,
    verifyAdminPin,
    hasInsecurePin,
  }
}
