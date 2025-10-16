import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { AuthService } from "../../../core/services/auth.service";
import { BaseComponent } from "../../../shared/components/base.component";
import { signal } from "@angular/core";

interface LoginCredentials {
  email: string;
  password: string;
}

@Component({
  selector: "app-login",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-6 col-lg-4">
          <div class="card shadow">
            <div class="card-body">
              <h2 class="text-center mb-4">Login</h2>

              <!-- Loading Overlay -->
              @if (authService.loading()) {
              <div class="loading-overlay">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2 mb-0">Signing you in...</p>
              </div>
              }

              <form #loginForm="ngForm" (ngSubmit)="onSubmit()">
                <div class="mb-3">
                  <label for="email" class="form-label">Email</label>
                  <input
                    type="email"
                    class="form-control"
                    id="email"
                    name="email"
                    [(ngModel)]="email"
                    required
                    email
                    #emailInput="ngModel"
                  />
                  <div
                    *ngIf="emailInput.invalid && emailInput.touched"
                    class="text-danger"
                  >
                    Please enter a valid email
                  </div>
                </div>
                <div class="mb-3">
                  <label for="password" class="form-label">Password</label>
                  <input
                    type="password"
                    class="form-control"
                    id="password"
                    name="password"
                    [(ngModel)]="password"
                    required
                    minlength="6"
                    #passwordInput="ngModel"
                  />
                  <div
                    *ngIf="passwordInput.invalid && passwordInput.touched"
                    class="text-danger"
                  >
                    Password must be at least 6 characters
                  </div>
                </div>
                <button
                  type="submit"
                  class="btn btn-primary w-100"
                  [disabled]="loginForm.invalid || authService.loading()"
                >
                  @if (authService.loading()) {
                  <span class="spinner-border spinner-border-sm me-2"></span>
                  Logging in... } @else { Login }
                </button>
              </form>

              @if (authService.authError(); as error) {
              <div class="alert alert-danger mt-3">
                {{ error }}
              </div>
              }

              <div class="text-center mt-3">
                <a routerLink="/auth/register"
                  >Don't have an account? Register</a
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 10;
        border-radius: 0.375rem;
      }

      .card {
        position: relative;
      }
    `,
  ],
})
export class LoginComponent extends BaseComponent {
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);

  // Use plain properties for ngModel binding
  email = "";
  password = "";

  onSubmit(): void {
    this.authService.clearError();

    const credentials: LoginCredentials = {
      email: this.email,
      password: this.password,
    };

    this.authService.login(credentials).subscribe({
      next: ({ user }) => {
        this.authService.loading.set(false);
        console.log("Login successful, user:", user);
        console.log("User role:", user.role);

        // Navigate directly to dashboard based on role
        const dashboardRoutes: Record<string, string> = {
          admin: "/admin/dashboard",
          teacher: "/teacher/dashboard",
          student: "/student/dashboard",
          parent: "/parent/dashboard",
        };
        const targetRoute = dashboardRoutes[user.role] || "/";
        console.log("Navigating to:", targetRoute);

        this.router.navigate([targetRoute]).then((success) => {
          console.log("Navigation success:", success);
          if (!success) {
            console.error("Failed to navigate to dashboard");
            this.authService.authError.set("Failed to navigate to dashboard");
          }
        });
      },
      error: (error) => {
        this.authService.loading.set(false);
        this.authService.authError.set(error.error?.detail || "Login failed");
        console.error("Login error:", error);
      },
    });
  }
}
