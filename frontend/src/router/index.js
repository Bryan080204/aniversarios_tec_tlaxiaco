import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/registro',
    name: 'registro',
    component: HomeView,
    meta: { section: 'registro' }
  },
  {
    path: '/reportes',
    name: 'reportes',
    component: HomeView,
    meta: { section: 'reportes' }
  },
  {
    path: '/configuracion',
    name: 'configuracion',
    component: HomeView,
    meta: { section: 'config' }
  },
  {
    path: '/validacion',
    name: 'validacion',
    component: HomeView,
    meta: { section: 'validacion' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
