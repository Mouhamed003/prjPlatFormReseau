import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { AuthService } from './services/auth.service';
import { NavbarComponent } from './components/shared/navbar/navbar.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'Plateforme de Réseau Social';
  showNavbar = true;
  isAuthenticated = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // S'abonner aux changements d'authentification
    this.authService.currentUser$.subscribe(user => {
      this.isAuthenticated = !!user;
    });

    // Gérer l'affichage de la navbar selon la route
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        // Masquer la navbar sur les pages d'authentification
        this.showNavbar = !this.isAuthRoute(event.urlAfterRedirects);
      });

    // Vérifier la route initiale
    this.showNavbar = !this.isAuthRoute(this.router.url);
  }

  private isAuthRoute(url: string): boolean {
    return url.includes('/login') || url.includes('/register');
  }
}
