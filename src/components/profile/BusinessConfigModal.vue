<template>
  <Dialog 
    v-model:visible="visible" 
    modal 
    header="Identidad del Negocio" 
    :style="{ width: '400px' }"
  >
    <div class="flex flex-column gap-4 py-3">
      
      <div class="flex flex-column align-items-center gap-3">
        <Avatar 
          :image="previewUrl || form.logoUrl || 'https://via.placeholder.com/150?text=Logo'" 
          size="xlarge" 
          shape="circle" 
          class="border-1 border-300"
          style="width: 100px; height: 100px;"
        />
        
        <FileUpload 
          mode="basic" 
          name="logo" 
          accept="image/*" 
          :maxFileSize="2000000" 
          chooseLabel="Cambiar Logo" 
          customUpload 
          @uploader="customUploader" 
          :auto="true"
          :disabled="isUploading"
        />
        <small v-if="isUploading" class="text-orange-500">Subiendo a la nube...</small>
      </div>

      <div class="flex flex-column gap-1">
        <label for="brandName" class="font-bold text-xs">Nombre Comercial Global</label>
        <InputText id="brandName" v-model="form.name" placeholder="Ej. El Carboncito SAC" />
      </div>

      <div class="flex justify-content-end gap-2 mt-2">
        <Button label="Cancelar" text severity="secondary" @click="visible = false" />
        <Button label="Guardar Configuración" icon="pi pi-check" @click="handleSave" :loading="isSaving" />
      </div>
    </div>
  </Dialog>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { storage, db } from '@/firebaseConfig';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { store, setUserProfile } from '@/store';
import { useToast } from 'primevue/usetoast';

const { user } = useAuth();
const toast = useToast();

const visible = ref(false);
const isUploading = ref(false);
const isSaving = ref(false);
const previewUrl = ref(null);

const form = reactive({
  name: '',
  logoUrl: ''
});

/**
 * Funcion para abrir el modal y cargar los datos actuales del perfil de negocio
 */
const open = () => {
  const currentProfile = store.userProfile?.businessProfile || {};
  form.name = currentProfile.name || '';
  form.logoUrl = currentProfile.logoUrl || '';
  previewUrl.value = null;
  visible.value = true;
};

/**
 * Funcion para subir el logo a Firebase Storage y obtener su URL publica
 * @param event - El evento del FileUpload con el archivo seleccionado
 */
const customUploader = async (event) => {
  const file = event.files[0];
  if (!file || !user.value) return;

  isUploading.value = true;
  try {
    previewUrl.value = URL.createObjectURL(file);

    const fileExtension = file.name.split('.').pop();
    const filePath = `logos/${user.value.uid}/main_logo_${Date.now()}.${fileExtension}`;
    const sRef = storageRef(storage, filePath);

    await uploadBytes(sRef, file);
    
    const downloadUrl = await getDownloadURL(sRef);
    
    form.logoUrl = downloadUrl;
    
    toast.add({ severity: 'info', summary: 'Imagen subida', detail: 'Logo listo para guardar', life: 2000 });
  } catch (error) {
    console.error(error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo subir la imagen', life: 3000 });
  } finally {
    isUploading.value = false;
  }
};

/**
 * Funcion para guardar la configuracion del negocio en Firestore
 */
const handleSave = async () => {
  if (!form.name.trim()) {
    toast.add({ severity: 'warn', summary: 'Atención', detail: 'Ponle un nombre a tu negocio', life: 3000 });
    return;
  }

  isSaving.value = true;
  try {
    const userRef = doc(db, "users", user.value.uid);
    const updateData = {
      businessProfile: {
        name: form.name,
        logoUrl: form.logoUrl,
        currency: 'PEN'
      },
      isConfigured: true
    };

    await setDoc(userRef, updateData, { merge: true });

    setUserProfile({
      ...store.userProfile,
      ...updateData
    });

    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Identidad guardada correctamente', life: 3000 });
    visible.value = false;
  } catch (error) {
    console.error(error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar', life: 3000 });
  } finally {
    isSaving.value = false;
  }
};

defineExpose({ open });
</script>