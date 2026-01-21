import { onMounted, ref } from 'vue';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";

const user = ref (null);

/**
 * Funcionalidad de autenticación con Google
 * @returns {Object} Métodos y propiedades de autenticación
 */

export function useAuth() {
    const error = ref(null);
    const loading = ref(false);

    /**
     * Monitorea el estado de autenticación del usuario
     */
    onMounted (() => {
        onAuthStateChanged(auth, (currentUser) => {
            user.value = currentUser;
        })
    })

    /**
     * Inicia sesión con Google
     * @return {Promise<void>}
     */
    const logInWithGoogle = async () => {
        error.value = null;
        loading.value = true;
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (err) {
            console.error("Error en auntenticación con Google:", err);
            error.value = "Error de conexión con Google. Por favor, inténtalo de nuevo.";
        } finally {
            loading.value = false;
        }
    }

    /**
     * Cierra la sesión del usuario
     * @return {Promise<void>}
     */
    const logOut = async () => {
        try {
            await signOut(auth);
        } catch (err) {
            console.error(err);
        }
    }

    /**
     * Retorna las propiedades y métodos del composable
     */
    return {
        user,
        logInWithGoogle,
        logOut,
        error,
        loading
    }
}