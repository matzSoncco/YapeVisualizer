/**
 * Configuración de Firebase y conexión con el Proyecto (lectoryape)
 * Las credenciales se cargan desde las variables de entorno (.env) definidas en el proyecto
 */

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

/**
 * Inicialización de los servicios
 * - Firestore (db)
 * - Autenticación (auth)
 */

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);