import { ref } from 'vue';
import { doc, updateDoc } from "firebase/firestore";
import { ref as sRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebaseConfig";
import { store, setUserProfile } from '@/store';

export function useBusiness() {
    const loading = ref(false);

    /**
     * Función para subir el logo del negocio a Firebase Storage
     * Obtiene su URL de descarga
     * @param {string} uid - ID del usuario para organizar los archivos en Storage
     * @param {File} file - Archivo de imagen del logo a subir
     * @returns {Promise<string>} 
     */
    const uploadLogo = async (uid, file) => {
        const fileRef = sRef(storage, `logos/${uid}/brand_logo_${Date.now()}`);
        await uploadBytes(fileRef, file);
        return await getDownloadURL(fileRef);
    };

    /**
     * Función para actualizar el perfil del negocio
     * Actualiza el documento del usuario en Firestore con los nuevos datos del perfil del negocio
     * y sincroniza el estado local del perfil del usuario con los cambios realizados
     * @param {string} uid - ID del usuario
     * @param {Object} data - Datos del perfil del negocio
     * @returns {Promise<Object>} 
     */
    const updateBusinessProfile = async (uid, data) => {
        loading.value = true;
        try {
            const userRef = doc(db, "users", uid);
            const updateData = {
                businessProfile: data,
                isConfigured: true
            };
            await updateDoc(userRef, updateData);
            
            setUserProfile({ ...store.userProfile, ...updateData });
            return { success: true };
        } catch (e) {
            console.error(e);
            throw e;
        } finally {
            loading.value = false;
        }
    };

    return {
        loading,
        uploadLogo,
        updateBusinessProfile
    };
}