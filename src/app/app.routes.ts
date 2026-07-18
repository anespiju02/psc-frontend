import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard').then((m) => m.Dashboard),
    title: 'PSC - Dashboard de Evolución Cognitiva', // Título dinámico para la pestaña del navegador
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
