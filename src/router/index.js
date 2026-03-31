import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '@/firebaseConfig'
import { onAuthStateChanged } from 'firebase/auth'
import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import AdminLayout from '@/layout/AdminLayout.vue'
import AdminView from '@/views/AdminView.vue'
import UserProfileView from '@/views/ProfileView.vue'
import { store, setAdminAuth } from '@/store'

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
    {
      path: '/',
      name: 'login',
      component: LoginView
    },
    { 
      path: '/dashboard', 
      name: 'dashboard', 
      component: DashboardView,
      meta: { requiresAuth: true } 
    },
    {
      path: '/admin',
      component: AdminLayout,
      meta:{
        requiresAuth: true,
        requiresAdmin: true,
      },
      children: [
        {
          path: '',
          name: 'admin',
          component: AdminView
        },
        {
          path: 'profile',
          name: 'profile',
          component: UserProfileView,
        }
      ]
    },
  ]
})

/**
 * Guardia global de rutas para proteger las vistas que requieren autenticación
 */
router.beforeEach(async (to, from, next) => {
  const user = await getCurrentUser();
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin);

  if (requiresAuth && !user) {
    return next('/');
  }

  if (requiresAdmin) {
    if (store.isAdminAuthenticated) {
      return next();
    } else {
      return next('/dashboard');
    }
  } 
  if (store.isAdminAuthenticated) {
    setAdminAuth(false);
    store.sucursalActual = null;
  }

  return next();
});

export default router