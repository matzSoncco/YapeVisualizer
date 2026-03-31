import { ref, computed } from 'vue'
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { auth, db } from '@/firebaseConfig'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { store, setUserProfile } from '@/store'
import { hashPin } from '@/utils/security'

const user = ref(null)

/**
 * Listener de cambios en el estado de autenticación
 * Gestiona la sincronización entre Firebase Auth y el perfil en Firestore
 */
onAuthStateChanged(auth, async (currentUser) => {
  user.value = currentUser

  if (currentUser) {
    try {
      const userRef = doc(db, 'users', currentUser.uid)
      const userSnap = await getDoc(userRef)

      /**
       * Inicialización de perfil: Si es la primera vez que entra,
       * creamos su documento base con el plan de prueba.
       * TODO: Cambiar el limite de sucursales y duración del trial según se requiera
       */
      if (!userSnap.exists()) {
        const newProfile = {
          email: currentUser.email,
          displayName: currentUser.displayName || 'Usuario',
          role: 'owner',
          adminPin: '1234',
          createdAt: new Date().toISOString(),
          isConfigured: false,
          businessProfile: {
            name: '',
            ruc: '',
            address: '',
            phone: '',
            logoUrl: '',
            currency: 'PEN',
          },
          subscription: {
            isActive: true,
            status: 'trial',
            planName: 'Prueba Gratuita',
            limitSucursales: 3,
            trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            nextBillingDate: null,
          },
        }
        await setDoc(userRef, newProfile)
        setUserProfile(newProfile)
      } else {
        setUserProfile(userSnap.data())
      }
    } catch (error) {
      console.error('Error al sincronizar perfil en Firestore:', error.code, error.message)
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
      console.error('Login Error:', err)
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
      console.error('Logout Error:', err)
    }
  }

  /**
   * Actualiza el PIN administrativo en Firestore y en el estado local
   * Realiza validación de doble factor
   */
  const updateAdminPin = async (currentPin, newPin) => {
    if (!user.value) throw new Error('Sesión no válida')

    const storedPin = store.userProfile?.adminPin

    if (storedPin && storedPin !== currentPin) {
      throw new Error('El PIN actual ingresado es incorrecto.')
    }

    if (!/^\d{4}$/.test(newPin)) {
      throw new Error('El PIN debe contener exactamente 4 dígitos numéricos.')
    }

    if (newPin === '1234') {
      throw new Error('No puedes usar el PIN por defecto. Elige uno seguro.')
    }

    loading.value = true
    try {
      const userRef = doc(db, 'users', user.value.uid)
      await setDoc(userRef, { adminPin: newPin }, { merge: true })

      setUserProfile({ ...store.userProfile, adminPin: newPin })
    } catch (err) {
      console.error('Error actualizando PIN:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Verifica el PIN ingresado contra el almacenado en Firestore para el usuario actual
   * @param {string} inputPin 
   * @returns {Promise<boolean>} Promesa que se resuelve con true si el PIN es válido, false en caso contrario
   */
  const verifyAdminPin = async (inputPin) => {
    if (!user.value) return false

    loading.value = true;
    try {
      const userRef = doc(db, 'users', user.value.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const storedHash = userSnap.data().adminPin;
        const inputHash = await hashPin(String(inputPin));
        
        return storedHash === inputHash;
      }

      return false;
    } catch (err) {
      console.error('Error verificando PIN:', err);
      return false;
    } finally {
      loading.value = true;
    }
  }

  /**
   * Propiedad computada para verificar si el PIN actual es inseguro (1234)
   * @returns {boolean} true si el PIN es '1234', false en caso contrario
   */
  const tienePinInseguro = computed(() => {
    return store.userProfile?.adminPin === '1234'
  })

  /**
   * Actualiza el perfil del negocio en Firestore y sincroniza con el estado local
   * @param {*} profileData - Objeto con los datos del perfil del negocio
   */
  const updateBusinessProfile = async (profileData) => {
    if (!user.value) throw new Error('Sesión no válida')

    loading.value = true
    try {
      const userRef = doc(db, 'users', user.value.uid)

      const updateData = {
        businessProfile: profileData,
        isConfigured: true,
      }

      await setDoc(userRef, updateData, { merge: true })

      setUserProfile({
        ...store.userProfile,
        ...updateData,
      })
    } catch (err) {
      console.error('Error actualizando perfil del negocio:', err)
      throw err
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
    tienePinInseguro,
  }
}
