import { ref } from 'vue';
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebaseConfig";

export function useAuth() {
    const error = ref(null);
    const loading = ref(false);

    const logInWithGoogle = async () => {
        error.value = null;
        loading.value = true;
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            loading.value = false;

            return result.user;
        } catch (err) {
            console.error("Error en auntenticación con Google:", err);
            error.value = "Error de conexión con Google. Por favor, inténtalo de nuevo.";
            loading.value = false;
            throw err;
        }
    }

    return {
        logInWithGoogle,
        error,
        loading
    }
}