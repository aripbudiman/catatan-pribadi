import { createRouter, createWebHistory } from 'vue-router';
import { auth } from '../firebase';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'public',
      component: () => import('../views/PublicView.vue'),
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { requiresGuest: true },
    },
  ],
});

router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresGuest = to.matched.some(record => record.meta.requiresGuest);
  const currentUser = auth.currentUser;

  if (requiresAuth && !currentUser) {
    next('/login');
  } else if (requiresGuest && currentUser) {
    next('/admin');
  } else {
    next();
  }
});

export default router;
