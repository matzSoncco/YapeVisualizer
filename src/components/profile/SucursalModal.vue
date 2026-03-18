<template>
  <Dialog 
    v-model:visible="visible" 
    :header="isEditing ? 'Editar Sucursal' : 'Nueva Sucursal'" 
    modal 
    class="custom-dialog" 
    :style="{ width: '450px' }" 
    :draggable="false"
  >
    <div class="form-grid flex flex-column gap-3 py-3">
      <div class="form-field flex flex-column gap-1">
        <label for="nombre" class="font-bold text-xs">Nombre de la Sede</label>
        <InputText id="nombre" v-model="form.nombre" placeholder="Ej. Sede Yanahuara" autofocus />
      </div>

      <div class="form-field flex flex-column gap-1">
        <label for="icono" class="font-bold text-xs">Icono (Emoji)</label>
        <InputText id="icono" v-model="form.icono" placeholder="Ej. 🏪" />
      </div>

      <div class="form-field flex flex-column gap-1">
        <label for="direccion" class="font-bold text-xs">Dirección</label>
        <InputText id="direccion" v-model="form.direccion" placeholder="Ej. Av. Ejército 123" />
      </div>

      <div class="form-field flex flex-column gap-1">
        <label for="telefono" class="font-bold text-xs">Teléfono</label>
        <InputText id="telefono" v-model="form.telefono" placeholder="Ej. 958..." />
      </div>

      <div class="grid mt-1">
        <div class="col-6 flex flex-column gap-1">
          <label for="serie" class="font-bold text-xs">Serie (Ticket)</label>
          <InputText id="serie" v-model="form.serie" placeholder="NV01" />
        </div>
        <div class="col-6 flex flex-column gap-1">
          <label for="corr" class="font-bold text-xs">Correlativo</label>
          <InputNumber id="corr" v-model="form.proximoCorrelativo" :min="1" />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-content-end gap-2">
        <Button label="Cancelar" icon="pi pi-times" text @click="visible = false" severity="secondary" />
        <Button label="Guardar" icon="pi pi-check" @click="handleSave" :disabled="!form.nombre" />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useSucursal } from '@/composables/useSucursal'
import { useToast } from 'primevue/usetoast'

const { addSucursal, updateSucursal } = useSucursal()
const toast = useToast()

const visible = ref(false)
const isEditing = ref(false)

const form = reactive({
  id: null,
  nombre: '',
  icono: '',
  direccion: '',
  telefono: '',
  serie: 'NV01',
  proximoCorrelativo: 1,
})

/**
 * Funcion para manejar la creación o actualización de una sucursal
 * Valida que el nombre no esté vacío
 */
const handleSave = async () => {
  if (!form.nombre.trim()) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'El nombre es obligatorio', life: 3000 })
    return
  }

  try {
    if (isEditing.value) {
      await updateSucursal(form.id, form) 
      toast.add({ severity: 'success', summary: 'Actualizado', detail: 'Sucursal actualizada correctamente', life: 3000 })
    } else {
      await addSucursal(form)
      toast.add({ severity: 'success', summary: 'Creado', detail: 'Sucursal creada correctamente', life: 3000 })
    }
    visible.value = false 
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 5000 })
  }
}

/**
 * Funcion para abrir el modal de sucursal
 * Si se recibe data, se carga en el formulario para editar
 * @param data - Objeto con los datos de la sucursal a editar (Opcional)
 */
const open = (data = null) => {
  if (data) {
    isEditing.value = true
    Object.assign(form, data)
  } else {
    isEditing.value = false
    Object.assign(form, {
      id: null,
      nombre: '',
      icono: '',
      direccion: '',
      telefono: '',
      serie: 'NV001',
      proximoCorrelativo: 1,
    })
  }
  visible.value = true
}

defineExpose({ open })
</script>