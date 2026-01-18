<template>
  <div class="dashboard">
    <header>
      <h2>📊 Mis Yapeos</h2>
      <div v-if="usuario">
        <span>{{ usuario.email }}</span>
        <button @click="cerrarSesion" class="btn-logout">Salir</button>
      </div>
    </header>

    <table>
      <thead>
        <tr>
          <th>Hora</th>
          <th>Cliente</th>
          <th>Monto</th>
          <th>Código</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="yape in yapeos" :key="yape.id">
          <td>{{ formatDate(yape.timestamp) }}</td>
          <td>{{ yape.name }}</td>
          <td :class="{'monto-alto': yape.amount > 50}">S/ {{ yape.amount.toFixed(2) }}</td>
          <td>{{ yape.securityCode }}</td>
        </tr>
      </tbody>
    </table>
    
    <p v-if="yapeos.length === 0" style="text-align: center; margin-top: 20px;">
      Esperando datos... ⏳
    </p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { auth, db } from '../firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';

const router = useRouter();
const usuario = ref(null);
const yapeos = ref([]);
let unsubscribe = null; // Para detener la escucha al salir

onMounted(() => {
  // 1. Verificamos si hay usuario logueado
  onAuthStateChanged(auth, (user) => {
    if (user) {
      usuario.value = user;
      cargarYapeos(user.email);
    } else {
      // Si no está logueado, patada al Login
      router.push('/');
    }
  });
});

const cargarYapeos = (email) => {
  // 🔥 AQUÍ ESTÁ EL FILTRO IMPORTANTE
  const q = query(
    collection(db, "yapeos"),
    where("userEmail", "==", email), // Solo trae lo de ESTE usuario
    orderBy("timestamp", "desc"),
    limit(50)
  );

  unsubscribe = onSnapshot(q, (snapshot) => {
    yapeos.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  });
};

const cerrarSesion = async () => {
  if (unsubscribe) unsubscribe();
  await signOut(auth);
  router.push('/');
};

const formatDate = (ts) => new Date(ts).toLocaleString('es-PE');
</script>

<style scoped>
/* Pega aquí estilos CSS básicos para tu tabla */
.dashboard { padding: 20px; max-width: 800px; margin: 0 auto; }
header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 12px; border-bottom: 1px solid #ddd; text-align: left; }
.monto-alto { color: green; font-weight: bold; }
.btn-logout { background: #d9534f; color: white; border: none; padding: 5px 10px; margin-left: 10px; cursor: pointer; border-radius: 4px;}
</style>