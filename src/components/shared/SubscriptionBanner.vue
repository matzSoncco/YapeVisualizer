<template>
  <div v-if="sub.isNearExpiring && !sub.isHardBlocked" class="sub-banner warning-banner">
    <i class="pi pi-exclamation-circle"></i>
    <span>
      Tu plan <strong>{{ sub.planName }}</strong> vence en <strong>{{ sub.daysLeft }} días</strong>.
      <router-link to="/profile" class="sub-link">Renovar ahora</router-link>
    </span>
  </div>

  <div v-if="sub.isHardBlocked && isNotProfileOrLogin" class="sub-overlay-blocker">
    <div class="blocker-modal">
      <div class="blocker-icon">
        <i class="pi pi-lock"></i>
      </div>
      <h2>Suscripción Expirada</h2>
      <p>
        El periodo de acceso de tu plan <strong>{{ sub.planName }}</strong> ha finalizado. Por
        favor, regulariza tu cuenta para seguir administrando tus sucursales y ventas.
      </p>
      <Button
        label="Contacta para Renovar"
        icon="pi pi-whatsapp"
        @click="contactarRenovacion"
        severity="warning"
        class="w-full mt-4"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useSubscription } from '@/composables/core/useSubscription'

const route = useRoute()
const { subscriptionStatus: sub } = useSubscription()

const isNotProfileOrLogin = computed(() => {
  return route.name !== 'profile' && route.name !== 'login'
})

const contactarRenovacion = () => {
  const numeroTelefono = '51940832417'
  const mensaje = encodeURIComponent(
    'Hola Max, mi suscripción del sistema POS ha expirado. Quiero renovar.',
  )
  window.open(`https://wa.me/${numeroTelefono}?text=${mensaje}`, '_blank')
}
</script>

<style scoped>
.sub-banner {
  padding: 0.75rem 1rem;
  text-align: center;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  z-index: 1000;
  position: sticky;
  top: 0;
}

.warning-banner {
  background-color: var(--yellow-100, #fef08a);
  color: var(--yellow-800, #854d0e);
  border-bottom: 1px solid var(--yellow-200, #fde047);
}

.sub-link {
  color: inherit;
  text-decoration: underline;
  margin-left: 0.5rem;
  cursor: pointer;
}

/* El Bloqueador Total (Tipo Pared de Pago) */
.sub-overlay-blocker {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.85); /* Fondo oscuro semitransparente */
  backdrop-filter: blur(5px); /* Efecto cristal */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999; /* Por encima de todo, incluso modales de PrimeVue */
}

.blocker-modal {
  background: white;
  padding: 2.5rem;
  border-radius: 12px;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
}

.blocker-icon {
  width: 60px;
  height: 60px;
  background-color: var(--red-100, #fee2e2);
  color: var(--red-600, #dc2626);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin: 0 auto 1.5rem;
}

.blocker-modal h2 {
  margin: 0 0 1rem;
  color: var(--gray-900, #111827);
}

.blocker-modal p {
  color: var(--gray-600, #4b5563);
  margin-bottom: 1.5rem;
  line-height: 1.5;
}
</style>
