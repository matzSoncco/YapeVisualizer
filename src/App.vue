<script setup>
import { RouterView, useRoute } from 'vue-router'
import { watch } from 'vue'
import { db } from './firebaseConfig'
import { collection, query, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { useAuth } from '@/composables/core/useAuth'
import { setBranches, setLoading, setUserProfile } from '@/store'
import { store } from '@/store'
import GlobalLoader from './components/shared/GlobalLoader.vue'
import SubscriptionBanner from './components/shared/SubscriptionBanner.vue'

/**
 * Escucha en tiempo real los cambios en las sucursales del usuario autenticado
 * y actualiza el store en consecuencia
 */
const route = useRoute()
const { user } = useAuth()

/**
 * Referencias para desuscribirse de los listeners
 */
let unsubSucursales = null
let unsubPerfil = null

/**
 * Vigila cambios en el usuario autenticado para actualizar las sucursales
 * y el perfil en tiempo real
 */
watch(
  user,
  (newUser) => {
    if (unsubSucursales) {
      unsubSucursales()
      unsubSucursales = null
    }

    if (unsubPerfil) {
      unsubPerfil()
      unsubPerfil = null
    }

    if (!newUser?.uid) {
      setBranches([])
      setUserProfile(null)
      return
    }

    setLoading(true)

    const qSucursales = query(collection(db, 'users', newUser.uid, 'sucursales'))

    /**
     * Escucha cambios en tiempo real y actualiza el store
     */
    unsubSucursales = onSnapshot(
      qSucursales,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          icono: doc.data().icono || '🏪',
        }))

        setBranches(docs)
        setLoading(false)
      },
      (error) => {
        console.error('Error escuchando sucursales: ', error)
        setLoading(false)
      },
    )

    const userDocRef = doc(db, 'users', newUser.uid)

    /**
     * Escucha cambios en el perfil del usuario
     */
    unsubPerfil = onSnapshot(
      userDocRef,
      async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data()
          const subData = data.subscription || {}

          const now = new Date()
          const trialEnd = subData.trialEndDate ? new Date(subData.trialEndDate) : null
          const isTrialExpired = subData.status === 'trial' && trialEnd && now > trialEnd

          if (isTrialExpired && subData.isActive) {
            try {
              console.log(
                'Detectado trial vencido. Apagando acceso en Firestore para bloquear APK...',
              )
              await updateDoc(userDocRef, {
                'subscription.isActive': false,
                'subscription.status': 'expired',
              })
              return
            } catch (e) {
              console.error('Error apagando la suscripción:', e)
            }
          }

          setUserProfile({
            role: data.role,
            subscription: subData,
            adminPin: data.adminPin,
            deviceOnline: data.deviceOnline || false,
            lastHeartbeat: data.lastHeartbeat ? data.lastHeartbeat.toDate() : null,
          })
        }
      },
      (error) => {
        console.error('Error escuchando perfil:', error)
      },
    )
  },
  { immediate: true },
)
</script>

<template>
  <ConfirmDialog class="custom-confirm">
    <template #message="slotProps">
      <div class="confirm-content">
        <i :class="slotProps.message.icon" class="confirm-icon"></i>
        <span class="confirm-text">{{ slotProps.message.message }}</span>
      </div>
    </template>
  </ConfirmDialog>
  <SubscriptionBanner />
  <GlobalLoader v-if="store.loading" mensaje="Sincronizando con la central..." />
  <Toast />
  <RouterView :key="route.fullPath" />
</template>

<style>
/* Los estilos globales ahora están en app.css */
</style>
