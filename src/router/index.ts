import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '@/views/LoginView.vue';
import MainLayout from '@/layouts/MainLayout.vue';
import PlaceholderView from '@/views/PlaceholderView.vue';

import SIView from '@/modules/si/views/SIView.vue';
import SICardView from '@/modules/si/views/SICardView.vue';

import EquipmentView from '@/modules/equipment/views/EquipmentView.vue';
import EquipmentCardView from '@/modules/equipment/views/EquipmentCardView.vue';

import ResourcesView from '@/modules/resources/views/ResourcesView.vue';
import ResourceCardView from '@/modules/resources/views/ResourceCardView.vue';

const routes = [
  { path: '/login', component: LoginView },
  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      { path: 'si', component: SIView },
      { path: 'si/:id', component: SICardView },
      { path: 'equipment', component: EquipmentView },
      { path: 'equipment/:id', component: EquipmentCardView },
      { path: 'resources', component: ResourcesView },
      { path: 'resources/:id', component: ResourceCardView },
      { path: 'maintenance', component: PlaceholderView },
      { path: 'subsystems', component: PlaceholderView },
      { path: 'diagnostics', component: PlaceholderView },
      { path: '', redirect: '/si' },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const isAuth = !!localStorage.getItem('user');
  if (to.meta.requiresAuth && !isAuth) {
    next('/login');
  } else {
    next();
  }
});

export default router;