import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, tap, throwError, of, catchError, map, retry, delay } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthResponse, RegistrationResponse } from '../models/auth.models';
import { User, UserRole } from '../models/user.models';
interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
}

interface TokenData {
  token: string;
  expiresAt: number; // timestamp in milliseconds
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly baseUrl = environment.apiUrl;
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private currentUserSignal = signal<User | null>(null);
  private tokenDataSignal = signal<TokenData | null>(null);

  public loading = signal<boolean>(false);
  public authError = signal<string | null>(null);

  // Public getters
  currentUser = this.currentUserSignal.asReadonly();
  user = this.currentUserSignal.asReadonly();
  userRole = signal<UserRole | null>(null);

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

  constructor() {
    // Load token and user data from storage on initialization
    this.loadStoredAuthData();
  }

  login(email: string, password: string): Observable<AuthResponse>;
  login(credentials: LoginCredentials): Observable<AuthResponse>;
  login(
    emailOrCredentials: string | LoginCredentials,
    password?: string
  ): Observable<AuthResponse> {
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

    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, { email, password: pwd }).pipe(
      tap((response) => this.storeAuthSession(response)),
      catchError((error: HttpErrorResponse) => {
        this.loading.set(false);
        this.authError.set(error.error?.detail || 'Login failed');
        return throwError(() => error);
      }),
      tap(() => this.loading.set(false))
    );
  }

  register(userData: RegisterPayload): Observable<AuthResponse | RegistrationResponse> {
    this.loading.set(true);
    this.authError.set(null);

    return this.http
      .post<AuthResponse | RegistrationResponse>(`${this.baseUrl}/auth/register`, {
        email: userData.email,
        password: userData.password,
        full_name: userData.fullName,
        role: userData.role,
      })
      .pipe(
        tap((response) => {
          if (this.isAuthResponse(response)) {
            this.storeAuthSession(response);
          }
        }),
        catchError((error: HttpErrorResponse) => {
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
    return this.http.get<User>(`${this.baseUrl}/users/me`).pipe(
      retry({
        count: 2,
        delay: (error: HttpErrorResponse, retryIndex) => {
          // Only retry on network errors, not auth errors
          if (this.isAuthError(error)) {
            return throwError(() => error);
          }
          // Retry with exponential backoff for network issues
          return of(retryIndex).pipe(delay(1000 * retryIndex));
        },
      }),
      map((user) => {
        this.currentUserSignal.set(user);
        this.userRole.set(user.role);
        // Store user data locally
        localStorage.setItem('authUser', JSON.stringify(user));
        return true;
      }),
      catchError((error: HttpErrorResponse) => {
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

  private isAuthError(error: unknown): error is HttpErrorResponse {
    return error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403);
  }

  loadUserData(): Observable<User> {
    if (!this.hasValidToken()) {
      return throwError(() => new Error('No valid token available'));
    }

    const existingUser = this.currentUserSignal();
    if (existingUser) {
      return of(existingUser);
    }

    return this.http.get<User>(`${this.baseUrl}/users/me`).pipe(
      tap((user) => {
        this.currentUserSignal.set(user);
        this.userRole.set(user.role);
        // Store user data locally for faster subsequent loads
        localStorage.setItem('authUser', JSON.stringify(user));
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Failed to load user data:', error);
        // Only logout on actual authentication errors
        if (this.isAuthError(error)) {
          this.clearStoredAuthData();
        }
        return throwError(() => error);
      })
    );
  }

  getUserRole(): UserRole | null {
    return this.userRole();
  }

  hasRole(role: UserRole): boolean {
    return this.getUserRole() === role;
  }

  hasAnyRole(roles: readonly UserRole[]): boolean {
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

  private readonly storeAuthSession = (response: AuthResponse): void => {
    const token = response.access_token ?? response.token;
    if (!token) {
      return;
    }

    const expiresAt = Date.now() + 30 * 60 * 1000;
    const tokenData: TokenData = {
      token,
      expiresAt,
    };

    this.storeTokenData(tokenData);
    if (response.user) {
      this.currentUserSignal.set(response.user);
      this.userRole.set(response.user.role);
      localStorage.setItem('authUser', JSON.stringify(response.user));
    }
  };

  private readonly isAuthResponse = (
    value: AuthResponse | RegistrationResponse
  ): value is AuthResponse => {
    const candidate = value as AuthResponse;
    return Boolean(candidate?.access_token || candidate?.token);
  };

  refreshToken(): Observable<never> {
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
      this.http.get<User>(`${this.baseUrl}/users/me`).subscribe({
        next: (user) => {
          this.currentUserSignal.set(user);
          this.userRole.set(user.role);

          // Store user data locally for faster subsequent loads
          localStorage.setItem('authUser', JSON.stringify(user));

          this.loading.set(false);
        },
        error: (error: HttpErrorResponse) => {
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
