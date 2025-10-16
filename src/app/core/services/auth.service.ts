import { Injectable, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, tap, throwError, of, catchError } from "rxjs";
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
    // Don't load user from token automatically - do it only when needed
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
        this.logout();
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
    // Placeholder - implement token refresh if needed
    return throwError(() => new Error("Refresh token not implemented"));
  }

  private loadUserFromToken(): void {
    const token = this.getToken();
    if (token) {
      // Load user data from API using the token
      this.http.get(`${this.baseUrl}/users/me`).subscribe({
        next: (user: any) => {
          this.currentUserSignal.set(user);
          this.userRole.set(user.role);
        },
        error: (error) => {
          // If token is invalid, clear it
          console.error("Failed to load user from token:", error);
          this.logout();
        },
      });
    }
  }
}
