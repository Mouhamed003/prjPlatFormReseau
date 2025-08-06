import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Route par défaut - redirection vers home ou login
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  
  // Routes d'authentification (publiques)
  {
    path: 'login',
    loadComponent: () => import('./components/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./components/auth/register/register.component').then(m => m.RegisterComponent)
  },
  
  // Routes protégées (nécessitent une authentification)
  {
    path: 'home',
    loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('./components/profile/user-profile/user-profile.component').then(m => m.UserProfileComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'profile/:id',
    loadComponent: () => import('./components/profile/user-profile/user-profile.component').then(m => m.UserProfileComponent),
    canActivate: [AuthGuard]
  },
  
  // Route 404 - page non trouvée
  {
    path: '**',
    redirectTo: '/home'
  }
];
