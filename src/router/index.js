import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '../firebaseConfig'
import { onAuthStateChanged } from 'firebase/auth'
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import AdminView from '@/views/AdminView.vue'
import UserProfileView from '@/views/ProfileView.vue'

/**
 * Obtiene el usuario actual autenticado
 * @returns {Promise} Promesa que se resuelve con el usuario autenticado o null
 */
const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const removeListener = onAuthStateChanged(
      auth,
      (user) => {
        removeListener();
        resolve(user);
      },
      reject
    );
  });
};

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'login', component: LoginView },
    { 
      path: '/dashboard', 
      name: 'dashboard', 
      component: DashboardView,
      meta: { requiresAuth: true } 
    },
    { 
      path: '/admin', 
      name: 'admin', 
      component: AdminView,
      meta: { requiresAuth: true } 
    },
    { 
      path: '/profile', 
      name: 'profile', 
      component: UserProfileView,
      meta: { requiresAuth: true } 
    }
  ]
})

/**
 * Guardia global de rutas para proteger las vistas que requieren autenticación
 */
router.beforeEach(async (to, from, next) => {
  const user = await getCurrentUser();
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  if (requiresAuth && !user) {
    next('/');
  } else if (to.name === 'login' && user) {
    next('/dashboard');
  } else {
    next();
  }
});

export default router