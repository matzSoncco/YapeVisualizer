<template>
  <div class="dashboard">
    <div class="dashboard-container">
      <!-- Header mejorado -->
      <header class="header">
        <div class="header-content">
          <div class="title-section">
            <div class="icon-badge">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div>
              <h1>Mis Yapeos</h1>
              <p class="subtitle">Historial de transacciones</p>
            </div>
          </div>
          
          <div class="user-section" v-if="usuario">
            <div class="user-info">
              <div class="user-avatar">
                <span>{{ usuario.email.charAt(0).toUpperCase() }}</span>
              </div>
              <div class="user-details">
                <span class="user-email">{{ usuario.email }}</span>
                <span class="user-status">● En línea</span>
              </div>
            </div>
            <button @click="cerrarSesion" class="btn-logout">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Salir
            </button>
          </div>
        </div>
      </header>

      <!-- Estadísticas rápidas -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon stat-icon-purple">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18"/>
              <path d="M9 21V9"/>
            </svg>
          </div>
          <div class="stat-content">
            <p class="stat-label">Total Transacciones</p>
            <p class="stat-value">{{ yapeos.length }}</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon stat-icon-green">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div class="stat-content">
            <p class="stat-label">Monto Total</p>
            <p class="stat-value">S/ {{ totalMonto.toFixed(2) }}</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon stat-icon-blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div class="stat-content">
            <p class="stat-label">Promedio</p>
            <p class="stat-value">S/ {{ promedioMonto.toFixed(2) }}</p>
          </div>
        </div>
      </div>

      <!-- Tabla mejorada -->
      <div class="table-container">
        <div class="table-header">
          <h2>Historial Detallado</h2>
          <div class="table-actions">
            <button class="btn-filter">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
              </svg>
              Filtrar
            </button>
          </div>
        </div>

        <div class="table-wrapper">
          <table class="modern-table">
            <thead>
              <tr>
                <th>
                  <div class="th-content">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    Fecha y Hora
                  </div>
                </th>
                <th>
                  <div class="th-content">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    Cliente
                  </div>
                </th>
                <th>
                  <div class="th-content">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="12" y1="1" x2="12" y2="23"/>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                    Monto
                  </div>
                </th>
                <th>
                  <div class="th-content">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    Código
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="yape in yapeos" :key="yape.id" class="table-row">
                <td>
                  <div class="date-cell">
                    <span class="date-primary">{{ formatDate(yape.uploadedAt) }}</span>
                    <span class="date-secondary">{{ formatTime(yape.uploadedAt) }}</span>
                  </div>
                </td>
                <td>
                  <div class="client-cell">
                    <div class="client-avatar">{{ yape.text.charAt(0).toUpperCase() }}</div>
                    <span class="client-name">{{ yape.text }}</span>
                  </div>
                </td>
                <td>
                  <div class="amount-cell" :class="getAmountClass(yape.bigText)">
                    <span class="amount-value">S/ {{ yape.bigText.toFixed(2) }}</span>
                    <span class="amount-badge" v-if="yape.bigText > 100">Alto</span>
                  </div>
                </td>
                <td>
                  <div class="code-cell">
                    <code class="security-code">{{ yape.securityCode }}</code>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Estado vacío mejorado -->
        <div v-if="yapeos.length === 0" class="empty-state">
          <div class="empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h3>No hay transacciones aún</h3>
          <p>Tus yapeos aparecerán aquí en tiempo real</p>
          <div class="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { auth, db } from '../firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';

const router = useRouter();
const usuario = ref(null);
const yapeos = ref([]);
let unsubscribe = null;

// Computed properties para estadísticas
const totalMonto = computed(() => {
  return yapeos.value.reduce((sum, yape) => sum + yape.bigText, 0);
});

const promedioMonto = computed(() => {
  return yapeos.value.length > 0 ? totalMonto.value / yapeos.value.length : 0;
});

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      usuario.value = user;
      cargarYapeos(user.email);
    } else {
      router.push('/');
    }
  });
});

const cargarYapeos = (email) => {
  const q = query(
    collection(db, "yape_notifications"),
    where("userEmail", "==", email),
    orderBy("timestamp", "desc"),
    limit(50)
  );

  unsubscribe = onSnapshot(q, (snapshot) => {
    console.log("🔥 Cantidad de datos encontrados:", snapshot.docs.length);
    
    yapeos.value = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log("📦 Dato individual:", data); // Para ver qué campos llegan
        return { id: doc.id, ...data };
    });
  }, (error) => {
      console.error("❌ Error oculto:", error);
  });
};

const cerrarSesion = async () => {
  if (unsubscribe) unsubscribe();
  await signOut(auth);
  router.push('/');
};

const formatDate = (ts) => {
  return new Date(ts).toLocaleDateString('es-PE', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });
};

const formatTime = (ts) => {
  return new Date(ts).toLocaleTimeString('es-PE', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const getAmountClass = (amount) => {
  if (amount > 100) return 'amount-high';
  if (amount > 50) return 'amount-medium';
  return 'amount-low';
};
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 2rem;
}

.dashboard-container {
  max-width: 1400px;
  margin: 0 auto;
}

/* Header mejorado */
.header {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.icon-badge {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
}

.title-section h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  margin: 0.25rem 0 0 0;
  color: #6b7280;
  font-size: 0.95rem;
}

.user-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  background: #f9fafb;
  border-radius: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 1.1rem;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.user-email {
  font-size: 0.9rem;
  font-weight: 500;
  color: #1f2937;
}

.user-status {
  font-size: 0.75rem;
  color: #10b981;
  font-weight: 500;
}

.btn-logout {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  padding: 0.65rem 1.25rem;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-logout:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
}

/* Tarjetas de estadísticas */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-icon-purple {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon-green {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.stat-icon-blue {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.stat-content {
  flex: 1;
}

.stat-label {
  margin: 0;
  font-size: 0.85rem;
  color: #6b7280;
  font-weight: 500;
}

.stat-value {
  margin: 0.25rem 0 0 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
}

/* Contenedor de tabla */
.table-container {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.table-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
}

.table-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-filter {
  background: #f3f4f6;
  border: none;
  padding: 0.65rem 1.25rem;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.btn-filter:hover {
  background: #e5e7eb;
}

.table-wrapper {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid #f3f4f6;
}

/* Tabla moderna */
.modern-table {
  width: 100%;
  border-collapse: collapse;
}

.modern-table thead {
  background: #f9fafb;
}

.modern-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.85rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid #e5e7eb;
}

.th-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.table-row {
  transition: background 0.2s ease;
}

.table-row:hover {
  background: #f9fafb;
}

.modern-table td {
  padding: 1.25rem 1rem;
  border-bottom: 1px solid #f3f4f6;
}

.date-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.date-primary {
  font-weight: 500;
  color: #1f2937;
  font-size: 0.95rem;
}

.date-secondary {
  font-size: 0.8rem;
  color: #9ca3af;
}

.client-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.client-avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
}

.client-name {
  font-weight: 500;
  color: #1f2937;
}

.amount-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.amount-value {
  font-weight: 700;
  font-size: 1.05rem;
}

.amount-high .amount-value {
  color: #10b981;
}

.amount-medium .amount-value {
  color: #3b82f6;
}

.amount-low .amount-value {
  color: #6b7280;
}

.amount-badge {
  background: #10b981;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 600;
}

.code-cell {
  font-family: 'Courier New', monospace;
}

.security-code {
  background: #f3f4f6;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #374151;
  font-weight: 600;
  border: 1px solid #e5e7eb;
}

/* Estado vacío */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-icon {
  margin: 0 auto 1.5rem;
  width: 80px;
  height: 80px;
  background: #f3f4f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  color: #1f2937;
}

.empty-state p {
  margin: 0 0 2rem 0;
  color: #6b7280;
  font-size: 1rem;
}

.loading-dots {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

.loading-dots span {
  width: 10px;
  height: 10px;
  background: #667eea;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.loading-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .dashboard {
    padding: 1rem;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .user-section {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }

  .user-info {
    justify-content: center;
  }

  .btn-logout {
    justify-content: center;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .table-wrapper {
    overflow-x: scroll;
  }

  .modern-table {
    min-width: 600px;
  }
}
</style>