<template>
  <Dialog 
    v-model:visible="visible" 
    modal 
    header="Actualizar PIN de Seguridad" 
    class="custom-pin-dialog"
    :style="{ width: '380px' }" 
    :draggable="false"
  >
    <div class="pin-form-content">
      <p class="pin-description text-sm text-gray-500 mb-4">Ingresa tu PIN actual y define uno nuevo de 4 dígitos.</p>
      
      <div class="pin-field-group flex flex-column gap-2 mb-3">
        <label class="font-bold text-xs">PIN Actual</label>
        <div class="otp-container flex justify-content-center">
           <InputOtp v-model="pinForm.current" :length="4" mask />
        </div>
      </div>

      <div class="pin-field-group flex flex-column gap-2 mb-4">
        <label class="font-bold text-xs">Nuevo PIN</label>
        <div class="otp-container flex justify-content-center">
           <InputOtp v-model="pinForm.new" :length="4" mask />
        </div>
      </div>

      <div class="pin-footer-actions flex justify-content-end gap-2 mt-4">
        <Button label="Cancelar" severity="secondary" text @click="visible = false" />
        <Button 
          label="Guardar Nuevo PIN" 
          @click="handlePinUpdate" 
          :loading="loadingAuth" 
          :disabled="pinForm.new.length < 4 || pinForm.current.length < 4"
        />
      </div>
    </div>
  </Dialog>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useToast } from 'primevue/usetoast'

const { updateAdminPin, loading: loadingAuth } = useAuth()
const toast = useToast()

const visible = ref(false)
const pinForm = reactive({ current: '', new: '' })

/**
 * Funcion para manejar la actualización del PIN de seguridad
 * Valida que el nuevo PIN sea diferente al actual
 * luego llama a la función de autenticación para actualizarlo en Firebase
 */
const handlePinUpdate = async () => {
  if (pinForm.current === pinForm.new) {
    toast.add({
      severity: 'warn',
      summary: 'Sin cambios',
      detail: 'El nuevo PIN es igual al actual.',
      life: 3000,
    })
    return
  }

  try {
    await updateAdminPin(pinForm.current, pinForm.new)

    toast.add({
      severity: 'success',
      summary: 'Seguridad Actualizada',
      detail: 'Tu nuevo PIN ha sido guardado.',
      life: 2000,
    })
    
    visible.value = false 
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error de Seguridad', detail: e.message, life: 5000 })
  }
}

/**
 * Funcion para abrir el modal de cambio de PIN
 * Resetea los campos del formulario
 */
const open = () => {
  pinForm.current = ''
  pinForm.new = ''
  visible.value = true
}

defineExpose({ open })
</script>