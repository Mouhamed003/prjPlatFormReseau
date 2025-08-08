import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { inject } from '@angular/core';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';
import { HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

// Intercepteur d'authentification fonctionnel
function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Ajouter le token d'authentification à toutes les requêtes
  const token = authService.getToken();
  
  if (token) {
    console.log('🔑 Ajout du token JWT à la requête:', req.url);
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  } else {
    console.log('⚠️ Aucun token JWT trouvé pour la requête:', req.url);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('❌ Erreur HTTP interceptée:', error);
      // Gérer les erreurs d'authentification
      if (error.status === 401) {
        console.log('🔒 Token expiré ou invalide, déconnexion...');
        authService.logout();
        router.navigate(['/login']);
      }
      
      return throwError(() => error);
    })
  );
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(),
    provideClientHydration(withEventReplay())
  ]
};
