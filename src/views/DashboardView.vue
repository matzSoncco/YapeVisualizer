<template>
  <div class="dashboard">
    <div class="dashboard-container">
      
      <SucursalSelector v-if="!sucursalActual" />

      <div v-else class="main-dashboard">
        
        <header class="header">
          <div class="header-content">
            <div class="title-section">
              <h1>Monitor Yape</h1>
              <p class="subtitle">Tienda: <strong>{{ sucursalActual }}</strong></p>
            </div>
            <div class="user-section">
              <button @click="simularYapeo" class="btn-simular">🧪 Simular</button>
              <div class="divider"></div>
              <button @click="cambiarSucursal" class="btn-change">🔄 Cambiar</button>
              <button @click="handleLogout" class="btn-logout">🚪 Salir</button>
            </div>
          </div>
        </header>

        <PendingList 
          :yapes="yapesPendientes" 
          @pescar="confirmarPesca" 
        />

        <SalesHistory 
          :ventas="misVentas" 
        />

      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2'; 
import '../assets/dashboard.css'; // Tu CSS global

// Componentes Hijos
import SucursalSelector from '../components/SucursalSelector.vue';
import PendingList from '../components/PendingList.vue';
import SalesHistory from '../components/SalesHistory.vue';

// Composables
import { useAuth } from '../composables/useAuth';
import { useYape } from '../composables/useYape';
import { useSucursal } from '../composables/useSucursal';

// Simulador
import { db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from "firebase/firestore"; 

const router = useRouter();
const { user, logOut } = useAuth();
const { sucursalActual, limpiarSucursal } = useSucursal();
const { 
  escucharPendientes, 
  escucharMisVentas, 
  reclamarYape, 
  detenerTodo,
  yapesPendientes, 
  misVentas 
} = useYape();

// --- LÓGICA DE SIMULACIÓN ---
const simularYapeo = async () => {
  if (!user.value) return;
  const randomMonto = [10, 20, 50, 100][Math.floor(Math.random()*4)];
  await addDoc(collection(db, "yape_notifications"), {
      userEmail: user.value.email,
      senderName: "Cliente Simulado",
      amount: randomMonto,
      status: "pending",
      branchName: null,
      timestamp: serverTimestamp()
  });
};

// --- LÓGICA DE PESCA (CONFIRMACIÓN) ---
const confirmarPesca = (yape) => {
  // El SweetAlert sigue aquí para dar esa capa de seguridad que pediste
  Swal.fire({
    title: '¿Es tu venta?',
    html: `Cliente: <b>${yape.senderName}</b><br>Monto: <b style="color:green">S/ ${Number(yape.amount).toFixed(2)}</b>`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'SÍ, ES MÍO',
    confirmButtonColor: '#10b981',
    cancelButtonColor: '#d33'
  }).then(async (result) => {
    if (result.isConfirmed) {
      await reclamarYape(yape.id, sucursalActual.value);
      const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
      Toast.fire({ icon: 'success', title: '¡Venta registrada!' });
    }
  });
};

// --- NAVEGACIÓN ---
const cambiarSucursal = () => { detenerTodo(); limpiarSucursal(); };
const handleLogout = async () => { detenerTodo(); limpiarSucursal(); await logOut(); router.push('/'); };

const iniciarDatos = () => {
  if (user.value && sucursalActual.value) {
    escucharPendientes(user.value.email);
    escucharMisVentas(user.value.email, sucursalActual.value);
  }
};

watch(sucursalActual, (nuevo) => { if (nuevo) iniciarDatos(); });
watch(user, (nuevo) => { if (nuevo && sucursalActual.value) iniciarDatos(); });
onMounted(() => { if (sucursalActual.value && user.value) iniciarDatos(); });
</script>

<style scoped>
  
.btn-simular {
  background: #8b5cf6;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  margin-right: 10px;
  transition: transform 0.1s;
}
.btn-simular:active { transform: scale(0.95); }

.status-badge {
  background: #d1fae5;
  color: #065f46;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}
</style>