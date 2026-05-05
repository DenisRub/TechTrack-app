import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@/views/LoginView.vue'
import MainLayout from '@/layouts/MainLayout.vue'
import PlaceholderView from '@/views/PlaceholderView.vue'
import HomeView from '@/views/HomeView.vue'

// Модуль СИ
import SIView from '@/modules/si/views/SIView.vue'
import SICardView from '@/modules/si/views/SICardView.vue'

// Модуль Оборудование
import EquipmentView from '@/modules/equipment/views/EquipmentView.vue'
import EquipmentCardView from '@/modules/equipment/views/EquipmentCardView.vue'

// Модуль Ресурсы
import ResourcesView from '@/modules/resources/views/ResourcesView.vue'
import ResourceCardView from '@/modules/resources/views/ResourceCardView.vue'

// Модуль Обслуживание
import MaintenanceView from '@/modules/maintenance/views/MaintenanceView.vue'
import MaintenancePlanView from '@/modules/maintenance/views/MaintenancePlanView.vue'

const routes = [
  {
    path: '/login',
    component: LoginView,
  },
  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      // главная страница после авторизации
      { path: '', component: HomeView },

      // Модуль СИ
      { path: 'si', component: SIView },
      { path: 'si/:id', component: SICardView },

      // Модуль Оборудование
      { path: 'equipment', component: EquipmentView },
      { path: 'equipment/:id', component: EquipmentCardView },

      // Модуль Ресурсы
      { path: 'resources', component: ResourcesView },
      { path: 'resources/:id', component: ResourceCardView },

      // Модуль Обслуживание
      { path: 'maintenance', component: MaintenanceView },
      { path: 'maintenance/:id', component: MaintenancePlanView },

      // Заглушки для будущих модулей
      { path: 'subsystems', component: PlaceholderView },
      { path: 'diagnostics', component: PlaceholderView },

      // Перенаправление по умолчанию
      { path: '', redirect: '/si' },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Защита маршрутов (требуется авторизация)
router.beforeEach((to, from, next) => {
  const isAuth = !!localStorage.getItem('user')
  if (to.meta.requiresAuth && !isAuth) {
    next('/login')
  } else {
    next()
  }
})

export default router
