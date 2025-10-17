import { Injectable, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import {
  Observable,
  tap,
  throwError,
  of,
  catchError,
  map,
  retry,
  delay,
} from "rxjs";
import { Router } from "@angular/router";
import { environment } from "../../../environments/environment";

interface User {
  id: number;
  email: string;
  fullName: string;
  role: string;
}

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private baseUrl = environment.apiUrl;
  private currentUserSignal = signal<User | null>(null);
  public loading = signal<boolean>(false);
  public authError = signal<string | null>(null);

  // Public getters
  currentUser = this.currentUserSignal.asReadonly();
  user = this.currentUserSignal.asReadonly();
  userRole = signal<string | null>(null);

  constructor(private http: HttpClient, private router: Router) {
    // Automatically load user data if token exists
    this.loadUserFromToken();
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

    if (typeof emailOrCredentials === "string") {
      email = emailOrCredentials;
      pwd = password!;
    } else {
      email = emailOrCredentials.email;
      pwd = emailOrCredentials.password;
    }

    return this.http
      .post(`${this.baseUrl}/auth/login`, { email, password: pwd })
      .pipe(
        tap((response: any) => {
          console.log("Auth service login response:", response);
          if (response.token) {
            localStorage.setItem("token", response.token);
            this.currentUserSignal.set(response.user);
            this.userRole.set(response.user?.role || null);
            console.log("User set in auth service:", this.currentUserSignal());
            console.log("User role set:", this.userRole());
          }
        })
      );
  }

  register(userData: any): Observable<any> {
    this.loading.set(true);
    this.authError.set(null);

    return this.http.post(`${this.baseUrl}/auth/register`, userData).pipe(
      tap((response: any) => {
        if (response.token) {
          localStorage.setItem("token", response.token);
          this.currentUserSignal.set(response.user);
          this.userRole.set(response.user?.role || null);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem("token");
    this.currentUserSignal.set(null);
    this.userRole.set(null);
    this.router.navigate(["/auth/login"]);
  }

  getToken(): string | null {
    return localStorage.getItem("token");
  }

  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.currentUserSignal();
  }

  hasValidToken(): boolean {
    return !!this.getToken();
  }

  isLoadingUser(): boolean {
    return this.loading();
  }

  validateToken(): Observable<boolean> {
    if (!this.getToken()) {
      return of(false);
    }

    if (this.currentUserSignal()) {
      return of(true);
    }

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
        return true;
      }),
      catchError((error) => {
        // Only consider auth errors as invalid token
        if (this.isAuthError(error)) {
          return of(false);
        }
        // For other errors after retries, assume token might still be valid
        // This prevents logout on temporary network/server issues
        console.warn(
          "Token validation failed with non-auth error, keeping token:",
          error
        );
        return of(true);
      })
    );
  }

  private isAuthError(error: any): boolean {
    // Only consider 401 (Unauthorized) and 403 (Forbidden) as auth errors
    return error?.status === 401 || error?.status === 403;
  }

  loadUserData(): Observable<any> {
    if (!this.getToken()) {
      return throwError(() => new Error("No token available"));
    }

    if (this.currentUserSignal()) {
      // User data already loaded
      return of(this.currentUserSignal());
    }

    return this.http.get(`${this.baseUrl}/users/me`).pipe(
      tap((user: any) => {
        this.currentUserSignal.set(user);
        this.userRole.set(user.role);
      }),
      catchError((error) => {
        console.error("Failed to load user data:", error);
        // Only logout on actual authentication errors
        if (this.isAuthError(error)) {
          this.logout();
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
    return this.hasRole("admin");
  }

  isTeacher(): boolean {
    return this.hasRole("teacher");
  }

  isStudent(): boolean {
    return this.hasRole("student");
  }

  isParent(): boolean {
    return this.hasRole("parent");
  }

  clearError(): void {
    this.authError.set(null);
  }

  refreshToken(): Observable<any> {
    // For now, this is a placeholder. In a full implementation,
    // you would call a refresh endpoint with a refresh token
    // Since this backend doesn't have refresh tokens yet, we return an error
    // This will cause the auth interceptor to logout the user
    return throwError(() => new Error("Token refresh not implemented"));
  }

  refreshTokenIfNeeded(): Observable<boolean> {
    // Check if token needs refresh (this could be based on expiration time)
    // For now, just validate the current token
    return this.validateToken();
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
          this.loading.set(false);
        },
        error: (error) => {
          console.error("Failed to load user from token:", error);
          this.loading.set(false);
          // Only logout on actual authentication errors, not network/server errors
          if (this.isAuthError(error)) {
            this.logout();
          }
          // For other errors (network, server), keep the token and let auth guard retry
        },
      });
    }
  }
}
