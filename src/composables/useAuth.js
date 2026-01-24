import { ref } from 'vue';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

const user = ref(null);

/**
 * Listener de cambios en el estado de autenticación
 * Gestiona la sincronización entre Firebase Auth y el perfil en Firestore
 */
onAuthStateChanged(auth, async (currentUser) => {
    user.value = currentUser;
    
    if (currentUser) {
        try {
            const userRef = doc(db, "users", currentUser.uid);
            const userSnap = await getDoc(userRef);

            /**
             * Inicialización de perfil: Si es la primera vez que entra,
             * creamos su documento base con el plan de prueba.
             */
            if (!userSnap.exists()) {
                await setDoc(userRef, {
                    email: currentUser.email,
                    displayName: currentUser.displayName || "Usuario",
                    photoURL: currentUser.photoURL || "",
                    role: "user",
                    createdAt: new Date().toISOString(),
                    subscription: {
                        active: true,
                        plan: "Prueba Gratuita",
                        limitSucursales: 3,
                        trialEndDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString() // 15 días de prueba
                    }
                });
            }
        } catch (error) {
            console.error("Error al sincronizar perfil en Firestore:", error);
        }
    }
});

/**
 * Composable para manejar autenticación de usuarios
 * @returns {Object} Funciones y propiedades relacionadas con la autenticación
 */
export function useAuth() {
    const error = ref(null);
    const loading = ref(false);

    /**
     * Iniciar sesión con Google mediante popup
     * @returns {Promise<void>} Promesa que se resuelve cuando la operación de login finaliza.
     */
    const logInWithGoogle = async () => {
        error.value = null;
        loading.value = true;
        try {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });
            await signInWithPopup(auth, provider);
        } catch (err) {
            error.value = err.code;
            console.error("Login Error:", err);
        } finally {
            loading.value = false;
        }
    }

    /**
     * Cerrar sesión del usuario actual
     * @returns {Promise<void>} Promesa que se resuelve cuando la operación de logout finaliza.
     */
    const logOut = async () => {
        try {
            await signOut(auth);
            user.value = null;
        } catch (err) {
            console.error("Logout Error:", err);
        }
    }

    return {
        user,
        logInWithGoogle,
        logOut,
        error,
        loading
    }
}