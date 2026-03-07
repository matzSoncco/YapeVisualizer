<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-brand">
        <div class="brand-icon">
          <i class="pi pi-wallet"></i>
        </div>
        <div class="brand-text">
          <h1 class="login-title">Monitor Yape</h1>
          <p class="login-subtitle">Gestión de transacciones en tiempo real</p>
        </div>
      </div>

      <div class="login-action-area">
        <Button
          label="Continuar con Google"
          icon="pi pi-google"
          :loading="loading"
          @click="handleLogin"
          class="google-btn"
        />
      </div>

      <div class="login-footer">
        <span class="secure-tag">
          <i class="pi pi-lock"></i> Acceso Seguro
        </span>
        <p>Autenticación oficial mediante Google Cloud</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import { useAuth } from "@/composables/useAuth";
import Button from 'primevue/button';

const router = useRouter();
const { logInWithGoogle, error, loading } = useAuth();

const handleLogin = async () => {
  try {
    await logInWithGoogle();
    router.push('/dashboard');
  } catch (err) {
    // el error se maneja en el composable
  }
}
</script>

<style scoped>
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
  max-width: 440px;
  background: var(--bg-app);
  padding: 3rem;
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-pro);
}

.login-brand {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  margin-bottom: 3rem;
}

.brand-icon {
  width: 56px;
  height: 56px;
  background: var(--color-primary);
  color: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  font-size: 1.5rem;
  box-shadow: 0 8px 20px -6px rgba(15, 23, 42, 0.4);
}

.login-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-primary);
  margin: 0;
  letter-spacing: -0.03em;
}

.login-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin: 0.25rem 0 0 0;
}

.login-action-area {
  margin-bottom: 2.5rem;
}

.google-btn {
  width: 100%;
  background: var(--bg-app) !important;
  color: var(--color-text-main) !important;
  border: 1.5px solid var(--color-border) !important;
  padding: 0.85rem !important;
  border-radius: 12px !important;
  font-weight: 700 !important;
  transition: all 0.2s ease !important;
}

.google-btn:hover {
  background: var(--bg-surface) !important;
  border-color: var(--color-text-muted) !important;
  transform: translateY(-1px);
}

.login-footer {
  text-align: center;
  border-top: 1px solid var(--color-border);
  padding-top: 2rem;
}

.secure-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--color-accent-soft);
  color: #854d0e;
  padding: 0.35rem 0.75rem;
  border-radius: 100px;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
}

.login-footer p {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin: 0;
}

@media (max-width: 480px) {
  .login-card {
    border: none;
    box-shadow: none;
    padding: 2rem 1rem;
    background: transparent;
  }
  
  .login-container {
    background: var(--bg-app);
    align-items: flex-start;
    padding-top: 15vh;
  }
}
</style>