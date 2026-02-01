<template>
  <div class="login-container">
    <Card class="login-card">
      <template #content>
        <div class="login-header">
          <div class="login-logo">
            <i class="pi pi-wallet" style="font-size: 1.5rem"></i>
          </div>
          <h1 class="login-title">Monitor Yape</h1>
          <p class="login-subtitle">
            Gestiona y visualiza tus transacciones en tiempo real
          </p>
        </div>

        <Button
          label="Continuar con Google"
          icon="pi pi-google"
          :loading="loading"
          @click="handleLogin"
          size="large"
          style="width: 100%;"
        />

        <div class="login-footer">
          Acceso seguro mediante autenticación de Google
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import { useAuth } from "@/composables/useAuth";
import Card from 'primevue/card';
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