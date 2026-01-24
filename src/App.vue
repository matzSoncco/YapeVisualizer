<script setup>
import { RouterView, useRoute } from 'vue-router'
import { watch } from 'vue'
import { db } from './firebaseConfig'
import { collection, query, onSnapshot } from 'firebase/firestore'
import { useAuth } from '@/composables/useAuth'
import { setSucursales, setLoading } from '@/store'

/**
 * Escucha en tiempo real los cambios en las sucursales del usuario autenticado
 * y actualiza el store en consecuencia
 */
const route = useRoute()
const { user } = useAuth()
let unsubscribe = null

/**
 * Vigila cambios en el usuario autenticado para actualizar las sucursales
 */
watch(user, (newUser) => {
  if (unsubscribe) {
    unsubscribe()
    unsubscribe = null
  }

  if (!newUser?.uid) {
    setSucursales([])
    return
  }

  setLoading(true)
  
  const q = query(collection(db, 'users', newUser.uid, 'sucursales'))
  
  /**
   * Escucha cambios en tiempo real y actualiza el store
   */
  unsubscribe = onSnapshot(q, (snapshot) => {
    const docs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      icono: doc.data().icono || '🏪'
    }))
    
    setSucursales(docs) 
    
    setLoading(false)
  }, (error) => {
    console.error("Error escuchando sucursales: ", error)
    setLoading(false)
  })
}, { immediate: true })
</script>

<template>
  <RouterView :key="route.fullPath" />
</template>

<style>
/* Estilos globales para resetear márgenes y fuentes */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

body {
  overflow-x: hidden;
}

#app {
  min-height: 100vh;
}
</style>