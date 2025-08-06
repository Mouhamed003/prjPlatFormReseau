import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { User, UserLogin, UserRegistration, AuthResponse, UserProfile } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/users`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);

  public currentUser$ = this.currentUserSubject.asObservable();
  public token$ = this.tokenSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Charger le token et l'utilisateur depuis le localStorage au démarrage (seulement côté navigateur)
    if (isPlatformBrowser(this.platformId)) {
      this.loadFromStorage();
    }
  }

  // Inscription
  register(userData: UserRegistration): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData)
      .pipe(
        tap(response => this.handleAuthResponse(response))
      );
  }

  // Connexion
  login(credentials: UserLogin): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => this.handleAuthResponse(response))
      );
  }

  // Déconnexion
  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
    }
    this.currentUserSubject.next(null);
    this.tokenSubject.next(null);
  }

  // Récupérer le profil de l'utilisateur connecté
  getProfile(): Observable<{ user: User }> {
    return this.http.get<{ user: User }>(`${this.apiUrl}/profile`);
  }

  // Récupérer le profil d'un utilisateur spécifique
  getUserProfile(userId: number): Observable<{ user: User }> {
    return this.http.get<{ user: User }>(`${this.apiUrl}/profile/${userId}`);
  }

  // Mettre à jour le profil
  updateProfile(profileData: UserProfile): Observable<{ message: string; user: User }> {
    return this.http.put<{ message: string; user: User }>(`${this.apiUrl}/profile`, profileData)
      .pipe(
        tap(response => {
          // Mettre à jour l'utilisateur actuel
          this.currentUserSubject.next(response.user);
          localStorage.setItem('currentUser', JSON.stringify(response.user));
        })
      );
  }

  // Rechercher des utilisateurs
  searchUsers(search?: string, limit: number = 10, offset: number = 0): Observable<{
    users: User[];
    pagination: { limit: number; offset: number; hasMore: boolean };
  }> {
    let params = `limit=${limit}&offset=${offset}`;
    if (search) {
      params += `&search=${encodeURIComponent(search)}`;
    }
    return this.http.get<{
      users: User[];
      pagination: { limit: number; offset: number; hasMore: boolean };
    }>(`${this.apiUrl}?${params}`);
  }

  // Vérifier si l'utilisateur est connecté
  isAuthenticated(): boolean {
    return !!this.tokenSubject.value;
  }

  // Récupérer l'utilisateur actuel
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Récupérer le token actuel
  getToken(): string | null {
    return this.tokenSubject.value;
  }

  // Gérer la réponse d'authentification
  private handleAuthResponse(response: AuthResponse): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('currentUser', JSON.stringify(response.user));
    }
    this.tokenSubject.next(response.token);
    this.currentUserSubject.next(response.user);
  }

  // Charger les données depuis le localStorage
  private loadFromStorage(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('currentUser');

    if (token) {
      this.tokenSubject.next(token);
    }

    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
      } catch (error) {
        console.error('Erreur lors du parsing des données utilisateur:', error);
        localStorage.removeItem('currentUser');
      }
    }
  }

  // Créer les headers avec le token d'authentification
  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }
}
