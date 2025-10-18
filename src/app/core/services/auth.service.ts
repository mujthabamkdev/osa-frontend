import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, throwError, of, catchError, map, retry, delay } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

interface User {
  id: number;
  email: string;
  fullName: string;
  role: string;
}

interface TokenData {
  token: string;
  expiresAt: number; // timestamp in milliseconds
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = environment.apiUrl;
  private currentUserSignal = signal<User | null>(null);
  private tokenDataSignal = signal<TokenData | null>(null);

  public loading = signal<boolean>(false);
  public authError = signal<string | null>(null);

  // Public getters
  currentUser = this.currentUserSignal.asReadonly();
  user = this.currentUserSignal.asReadonly();
  userRole = signal<string | null>(null);

  // Computed signals for reactive auth state
  isAuthenticated = computed(() => {
    const tokenData = this.tokenDataSignal();
    const user = this.currentUserSignal();
    return !!(tokenData && user && !this.isTokenExpired());
  });

  isTokenExpired = computed(() => {
    const tokenData = this.tokenDataSignal();
    if (!tokenData) return true;
    return Date.now() >= tokenData.expiresAt;
  });

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Load token and user data from storage on initialization
    this.loadStoredAuthData();
  }

  login(email: string, password: string): Observable<any>;
  login(credentials: { email: string; password: string }): Observable<any>;
  login(
    emailOrCredentials: string | { email: string; password: string },
    password?: string
  ): Observable<any> {
    this.loading.set(true);
    this.authError.set(null);

    let email: string;
    let pwd: string;

    if (typeof emailOrCredentials === 'string') {
      email = emailOrCredentials;
      pwd = password!;
    } else {
      email = emailOrCredentials.email;
      pwd = emailOrCredentials.password;
    }

    return this.http.post(`${this.baseUrl}/auth/login`, { email, password: pwd }).pipe(
      tap((response: any) => {
        console.log('Auth service login response:', response);
        if (response.token) {
          // Store token with expiration time (30 minutes from now)
          const expiresAt = Date.now() + 30 * 60 * 1000; // 30 minutes in milliseconds
          const tokenData: TokenData = {
            token: response.token,
            expiresAt,
          };

          this.storeTokenData(tokenData);
          this.currentUserSignal.set(response.user);
          this.userRole.set(response.user?.role || null);

          console.log('User set in auth service:', this.currentUserSignal());
          console.log('User role set:', this.userRole());
          console.log('Token expires at:', new Date(expiresAt));
        }
      }),
      catchError((error) => {
        this.loading.set(false);
        this.authError.set(error.error?.detail || 'Login failed');
        return throwError(() => error);
      }),
      tap(() => this.loading.set(false))
    );
  }

  register(userData: any): Observable<any> {
    this.loading.set(true);
    this.authError.set(null);

    return this.http.post(`${this.baseUrl}/auth/register`, userData).pipe(
      tap((response: any) => {
        if (response.token) {
          // Store token with expiration time (30 minutes from now)
          const expiresAt = Date.now() + 30 * 60 * 1000; // 30 minutes in milliseconds
          const tokenData: TokenData = {
            token: response.token,
            expiresAt,
          };

          this.storeTokenData(tokenData);
          this.currentUserSignal.set(response.user);
          this.userRole.set(response.user?.role || null);
        }
      }),
      catchError((error) => {
        this.loading.set(false);
        this.authError.set(error.error?.detail || 'Registration failed');
        return throwError(() => error);
      }),
      tap(() => this.loading.set(false))
    );
  }

  logout(): void {
    // Clear all stored auth data
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    this.tokenDataSignal.set(null);
    this.currentUserSignal.set(null);
    this.userRole.set(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    const tokenData = this.tokenDataSignal();
    return tokenData?.token || null;
  }

  hasValidToken(): boolean {
    const tokenData = this.tokenDataSignal();
    return !!(tokenData && !this.isTokenExpired());
  }

  isLoadingUser(): boolean {
    return this.loading();
  }

  validateToken(): Observable<boolean> {
    // First check if token exists and is not expired locally
    if (!this.hasValidToken()) {
      return of(false);
    }

    // If we have user data, token is considered valid
    if (this.currentUserSignal()) {
      return of(true);
    }

    // Otherwise, validate with server
    return this.http.get(`${this.baseUrl}/users/me`).pipe(
      retry({
        count: 2,
        delay: (error, retryIndex) => {
          // Only retry on network errors, not auth errors
          if (this.isAuthError(error)) {
            return throwError(() => error);
          }
          // Retry with exponential backoff for network issues
          return of(retryIndex).pipe(delay(1000 * retryIndex));
        },
      }),
      map((user: any) => {
        this.currentUserSignal.set(user);
        this.userRole.set(user.role);
        // Store user data locally
        localStorage.setItem('authUser', JSON.stringify(user));
        return true;
      }),
      catchError((error) => {
        // Only consider auth errors as invalid token
        if (this.isAuthError(error)) {
          this.clearStoredAuthData();
          return of(false);
        }
        // For other errors after retries, assume token might still be valid
        // This prevents logout on temporary network/server issues
        console.warn('Token validation failed with non-auth error, keeping token:', error);
        return of(true);
      })
    );
  }

  private isAuthError(error: any): boolean {
    // Only consider 401 (Unauthorized) and 403 (Forbidden) as auth errors
    return error?.status === 401 || error?.status === 403;
  }

  loadUserData(): Observable<any> {
    if (!this.hasValidToken()) {
      return throwError(() => new Error('No valid token available'));
    }

    if (this.currentUserSignal()) {
      // User data already loaded
      return of(this.currentUserSignal());
    }

    return this.http.get(`${this.baseUrl}/users/me`).pipe(
      tap((user: any) => {
        this.currentUserSignal.set(user);
        this.userRole.set(user.role);
        // Store user data locally for faster subsequent loads
        localStorage.setItem('authUser', JSON.stringify(user));
      }),
      catchError((error) => {
        console.error('Failed to load user data:', error);
        // Only logout on actual authentication errors
        if (this.isAuthError(error)) {
          this.clearStoredAuthData();
        }
        return throwError(() => error);
      })
    );
  }

  getUserRole(): string | null {
    return this.userRole();
  }

  hasRole(role: string): boolean {
    return this.getUserRole() === role;
  }

  hasAnyRole(roles: string[]): boolean {
    const userRole = this.getUserRole();
    return userRole ? roles.includes(userRole) : false;
  }

  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  isTeacher(): boolean {
    return this.hasRole('teacher');
  }

  isStudent(): boolean {
    return this.hasRole('student');
  }

  isParent(): boolean {
    return this.hasRole('parent');
  }

  clearError(): void {
    this.authError.set(null);
  }

  refreshToken(): Observable<any> {
    // For now, this is a placeholder. In a full implementation,
    // you would call a refresh endpoint with a refresh token
    // Since this backend doesn't have refresh tokens yet, we return an error
    // This will cause the auth interceptor to logout the user
    return throwError(() => new Error('Token refresh not implemented'));
  }

  refreshTokenIfNeeded(): Observable<boolean> {
    // Check if token needs refresh (this could be based on expiration time)
    // For now, just validate the current token
    return this.validateToken();
  }

  // New methods for token management with expiration
  private storeTokenData(tokenData: TokenData): void {
    this.tokenDataSignal.set(tokenData);
    localStorage.setItem('authToken', JSON.stringify(tokenData));
  }

  private loadStoredAuthData(): void {
    try {
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('authUser');

      if (storedToken) {
        const tokenData: TokenData = JSON.parse(storedToken);

        // Check if token is still valid
        if (!this.isTokenExpiredStatic(tokenData)) {
          this.tokenDataSignal.set(tokenData);

          // Load user data if stored
          if (storedUser) {
            const user: User = JSON.parse(storedUser);
            this.currentUserSignal.set(user);
            this.userRole.set(user.role);
          } else {
            // Load user data from API if token is valid but no user stored
            this.loadUserFromToken();
          }
        } else {
          // Token expired, clear storage
          this.clearStoredAuthData();
        }
      }
    } catch (error) {
      console.error('Error loading stored auth data:', error);
      this.clearStoredAuthData();
    }
  }

  private clearStoredAuthData(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    this.tokenDataSignal.set(null);
    this.currentUserSignal.set(null);
    this.userRole.set(null);
  }

  private isTokenExpiredStatic(tokenData: TokenData): boolean {
    return Date.now() >= tokenData.expiresAt;
  }

  private loadUserFromToken(): void {
    const token = this.getToken();
    if (token && !this.currentUserSignal()) {
      this.loading.set(true);
      // Load user data from API using the token
      this.http.get(`${this.baseUrl}/users/me`).subscribe({
        next: (user: any) => {
          this.currentUserSignal.set(user);
          this.userRole.set(user.role);

          // Store user data locally for faster subsequent loads
          localStorage.setItem('authUser', JSON.stringify(user));

          this.loading.set(false);
        },
        error: (error) => {
          console.error('Failed to load user from token:', error);
          this.loading.set(false);
          // Only logout on actual authentication errors, not network/server errors
          if (this.isAuthError(error)) {
            this.clearStoredAuthData();
          }
          // For other errors (network, server), keep the token and let auth guard retry
        },
      });
    }
  }
}
