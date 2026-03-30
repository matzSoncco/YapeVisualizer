<template>
  <div class="login-container">
    <div class="login-card">

      <div class="login-header">
        <div class="login-brand">
          <div class="brand-icon">
            <i class="pi pi-credit-card"></i>
          </div>
          <div>
            <h1 class="login-title">CajaFlow</h1> <!-- Nombre de la aplicacion, a cambiar a futuro -->
            <p class="login-subtitle">Central de pagos digitales</p>
          </div>
        </div>
        <div class="login-channels">
          <span class="channel-tag yape">Yape</span>
          <span class="channel-tag plin">Plin</span>
          <span class="channel-tag bcp">BCP</span>
          <span class="channel-tag interbank">Interbank</span>
        </div>
      </div>

      <div class="login-body">
        <p class="login-description">
          Accede con tu cuenta Google para gestionar tus cobros y sucursales.
        </p>

        <Button
          label="Continuar con Google"
          icon="pi pi-google"
          :loading="loading"
          @click="handleLogin"
          class="google-btn"
        />

        <div class="login-footer">
          <span class="secure-tag">
            <i class="pi pi-lock"></i>
            Acceso seguro
          </span>
          <p>Autenticación oficial mediante Google Cloud</p>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/core/useAuth'
import Button from 'primevue/button'

const router = useRouter()
const { logInWithGoogle, loading } = useAuth()

const handleLogin = async () => {
  try {
    await logInWithGoogle()
    router.push('/dashboard')
  } catch {
    // el error se maneja en el composable
  }
}
</script>

<style scoped>
/* ── Contenedor ───────────────────────────────────────────── */
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-surface);
  padding: 1.5rem;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: var(--bg-app);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

/* ── Header oscuro ────────────────────────────────────────── */
.login-header {
  background: var(--color-primary);
  padding: 2rem 2rem 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.login-brand {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.brand-icon {
  width: 44px;
  height: 44px;
  background: var(--color-accent);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.login-title {
  margin: 0;
  font-size: 1.375rem;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.02em;
}

.login-subtitle {
  margin: 0.2rem 0 0;
  font-size: 0.8rem;
  color: #94a3b8;
}

/* ── Pills de canales ─────────────────────────────────────── */
.login-channels {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.channel-tag {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: 100px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.channel-tag.yape      { background: #4c1d95; color: #ddd6fe; }
.channel-tag.plin      { background: #1e3a5f; color: #bfdbfe; }
.channel-tag.bcp       { background: #1c3d6e; color: #93c5fd; }
.channel-tag.interbank { background: #1a3a2e; color: #6ee7b7; }

/* ── Cuerpo ───────────────────────────────────────────────── */
.login-body {
  padding: 1.75rem 2rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.login-description {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  line-height: 1.6;
}

/* ── Botón Google ─────────────────────────────────────────── */
.google-btn {
  width: 100%;
  background: var(--bg-app) !important;
  color: var(--color-text-main) !important;
  border: 1.5px solid var(--color-border) !important;
  padding: 0.85rem !important;
  border-radius: var(--radius-md) !important;
  font-weight: 700 !important;
  transition: background 0.15s, border-color 0.15s !important;
}

.google-btn:hover {
  background: var(--bg-surface) !important;
  border-color: var(--color-text-muted) !important;
}

/* ── Footer ───────────────────────────────────────────────── */
.login-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--color-border);
  text-align: center;
}

.secure-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: var(--bg-surface);
  color: var(--color-text-muted);
  padding: 0.3rem 0.75rem;
  border-radius: 100px;
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.login-footer p {
  margin: 0;
  font-size: 0.7rem;
  color: var(--color-text-muted);
}

/* ── Responsive ───────────────────────────────────────────── */
@media (max-width: 480px) {
  .login-container {
    background: var(--bg-app);
    align-items: flex-start;
    padding-top: 12vh;
  }

  .login-card {
    border: none;
    box-shadow: none;
    border-radius: var(--radius-lg);
  }
}
</style>