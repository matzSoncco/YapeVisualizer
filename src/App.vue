<script setup>
import { RouterView, useRoute } from 'vue-router'
import { watch } from 'vue'
import { db } from './firebaseConfig'
import { collection, query, onSnapshot, doc } from 'firebase/firestore'
import { useAuth } from '@/composables/useAuth'
import { setSucursales, setLoading, setUserProfile } from '@/store'

/**
 * Escucha en tiempo real los cambios en las sucursales del usuario autenticado
 * y actualiza el store en consecuencia
 */
const route = useRoute()
const { user } = useAuth()

/**
 * Referencias para desuscribirse de los listeners
 */
let unsubSucursales = null;
let unsubPerfil = null;

/**
 * Vigila cambios en el usuario autenticado para actualizar las sucursales
 * y el perfil en tiempo real
 */
watch(user, (newUser) => {
  if (unsubSucursales) {
    unsubSucursales()
    unsubSucursales = null
  }

  if (unsubPerfil) {
    unsubPerfil()
    unsubPerfil = null
  }

  if (!newUser?.uid) {
    setSucursales([])
    setUserProfile(null)
    return
  }

  setLoading(true)
  
  const qSucursales = query(collection(db, 'users', newUser.uid, 'sucursales'))
  
  /**
   * Escucha cambios en tiempo real y actualiza el store
   */
  unsubSucursales = onSnapshot(qSucursales, (snapshot) => {
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

  const userDocRef = doc(db, 'users', newUser.uid);

  /**
   * Escucha cambios en el perfil del usuario
   */
  unsubPerfil = onSnapshot(userDocRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      
      setUserProfile({
        role: data.role,
        subscription: data.subscription || {}
      });
    }
  }, (error) => {
    console.error("Error escuchando perfil:", error);
  });
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