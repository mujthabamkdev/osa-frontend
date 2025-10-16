import { Component, inject, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { AuthService } from "@core/services/auth.service";
import { environment } from "@environments/environment";

@Component({
  selector: "app-register",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div
      class="min-vh-100 d-flex align-items-center justify-content-center bg-gradient-primary"
    >
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-xl-5 col-lg-6 col-md-8">
            <div class="card shadow-lg border-0 rounded-lg">
              <div class="card-body p-5">
                <div class="text-center mb-4">
                  <i class="bi bi-person-plus text-primary fs-1 mb-2"></i>
                  <h2 class="fw-bold text-primary">Join {{ appName }}</h2>
                  <p class="text-muted">Create your account to get started</p>
                </div>

                <!-- Loading Overlay -->
                @if (authService.loading()) {
                <div class="loading-overlay">
                  <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                  </div>
                  <p class="mt-2 mb-0">Creating your account...</p>
                </div>
                }

                <form (ngSubmit)="onSubmit()" #registerForm="ngForm" novalidate>
                  <div class="mb-3">
                    <label for="fullName" class="form-label fw-medium"
                      >Full Name</label
                    >
                    <div class="input-group">
                      <span class="input-group-text"
                        ><i class="bi bi-person"></i
                      ></span>
                      <input
                        type="text"
                        class="form-control"
                        id="fullName"
                        name="fullName"
                        [ngModel]="userData().fullName"
                        (ngModelChange)="updateFullName($event)"
                        placeholder="Enter your full name"
                        required
                        #fullNameField="ngModel"
                        [class.is-invalid]="
                          fullNameField.invalid && fullNameField.touched
                        "
                      />
                    </div>
                  </div>

                  <div class="mb-3">
                    <label for="email" class="form-label fw-medium"
                      >Email Address</label
                    >
                    <div class="input-group">
                      <span class="input-group-text"
                        ><i class="bi bi-envelope"></i
                      ></span>
                      <input
                        type="email"
                        class="form-control"
                        id="email"
                        name="email"
                        [ngModel]="userData().email"
                        (ngModelChange)="updateEmail($event)"
                        placeholder="Enter your email"
                        required
                        email
                        autocomplete="email"
                        #emailField="ngModel"
                        [class.is-invalid]="
                          emailField.invalid && emailField.touched
                        "
                      />
                    </div>
                    <div
                      class="invalid-feedback"
                      *ngIf="emailField.invalid && emailField.touched"
                    >
                      <small *ngIf="emailField.errors?.['required']"
                        >Email is required</small
                      >
                      <small *ngIf="emailField.errors?.['email']"
                        >Please enter a valid email</small
                      >
                    </div>
                  </div>

                  <div class="mb-3">
                    <label for="password" class="form-label fw-medium"
                      >Password</label
                    >
                    <div class="input-group">
                      <span class="input-group-text"
                        ><i class="bi bi-lock"></i
                      ></span>
                      <input
                        [type]="showPassword() ? 'text' : 'password'"
                        class="form-control"
                        id="password"
                        name="password"
                        [ngModel]="userData().password"
                        (ngModelChange)="updatePassword($event)"
                        placeholder="Create a strong password"
                        required
                        minlength="6"
                        maxlength="72"
                        autocomplete="new-password"
                        #passwordField="ngModel"
                        [class.is-invalid]="
                          passwordField.invalid && passwordField.touched
                        "
                      />
                      <button
                        type="button"
                        class="btn btn-outline-secondary"
                        (click)="togglePasswordVisibility()"
                      >
                        <i
                          class="bi"
                          [class.bi-eye]="!showPassword()"
                          [class.bi-eye-slash]="showPassword()"
                        ></i>
                      </button>
                    </div>
                    <div
                      class="invalid-feedback"
                      *ngIf="passwordField.invalid && passwordField.touched"
                    >
                      <small *ngIf="passwordField.errors?.['required']"
                        >Password is required</small
                      >
                      <small *ngIf="passwordField.errors?.['minlength']"
                        >Password must be at least 6 characters</small
                      >
                    </div>
                    <div class="mt-1">
                      <div class="progress" style="height: 3px;">
                        <div
                          class="progress-bar"
                          [class]="passwordStrengthClass()"
                          [style.width.%]="passwordStrength()"
                          role="progressbar"
                        ></div>
                      </div>
                      <small class="text-muted">{{
                        passwordStrengthText()
                      }}</small>
                    </div>
                  </div>

                  <div class="mb-3">
                    <label for="confirmPassword" class="form-label fw-medium"
                      >Confirm Password</label
                    >
                    <div class="input-group">
                      <span class="input-group-text"
                        ><i class="bi bi-shield-check"></i
                      ></span>
                      <input
                        type="password"
                        class="form-control"
                        id="confirmPassword"
                        name="confirmPassword"
                        [ngModel]="confirmPassword()"
                        (ngModelChange)="confirmPassword.set($event)"
                        placeholder="Confirm your password"
                        required
                        autocomplete="new-password"
                        #confirmPasswordField="ngModel"
                        [class.is-invalid]="
                          confirmPasswordField.touched && !passwordsMatch()
                        "
                      />
                    </div>
                    <div
                      class="invalid-feedback"
                      *ngIf="confirmPasswordField.touched && !passwordsMatch()"
                    >
                      <small>Passwords do not match</small>
                    </div>
                  </div>

                  <div class="mb-3">
                    <label for="role" class="form-label fw-medium"
                      >I am a</label
                    >
                    <select
                      class="form-select"
                      id="role"
                      name="role"
                      [ngModel]="userData().role"
                      (ngModelChange)="updateRole($event)"
                      required
                      #roleField="ngModel"
                      [class.is-invalid]="
                        roleField.invalid && roleField.touched
                      "
                    >
                      <option value="">Select your role</option>
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="parent">Parent</option>
                    </select>
                    <div
                      class="invalid-feedback"
                      *ngIf="roleField.invalid && roleField.touched"
                    >
                      <small>Please select your role</small>
                    </div>
                  </div>

                  <div class="mb-3 form-check">
                    <input
                      type="checkbox"
                      class="form-check-input"
                      id="acceptTerms"
                      [ngModel]="acceptTerms()"
                      (ngModelChange)="acceptTerms.set($event)"
                      name="acceptTerms"
                      required
                      #termsField="ngModel"
                    />
                    <label class="form-check-label" for="acceptTerms">
                      I agree to the
                      <a href="#" class="text-primary text-decoration-none"
                        >Terms of Service</a
                      >
                      and
                      <a href="#" class="text-primary text-decoration-none"
                        >Privacy Policy</a
                      >
                    </label>
                    <div
                      class="invalid-feedback"
                      *ngIf="termsField.invalid && termsField.touched"
                    >
                      <small>You must accept the terms and conditions</small>
                    </div>
                  </div>

                  <button
                    type="submit"
                    class="btn btn-primary w-100 mb-3"
                    [disabled]="authService.loading() || !isFormValid()"
                  >
                    @if (authService.loading()) {
                    <span class="spinner-border spinner-border-sm me-2"></span>
                    Creating Account... } @else {
                    <i class="bi bi-person-plus me-2"></i>
                    Create Account }
                  </button>

                  @if (registrationSuccess()) {
                  <div class="alert alert-success d-flex align-items-center">
                    <i class="bi bi-check-circle me-2"></i>
                    <span>Account created successfully! Redirecting...</span>
                  </div>
                  } @if (authService.authError(); as error) {
                  <div class="alert alert-danger d-flex align-items-center">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    <span>{{ error }}</span>
                  </div>
                  }
                </form>

                <div class="text-center">
                  <hr class="my-3" />
                  <p class="mb-0 small text-muted">
                    Already have an account?
                    <a
                      routerLink="/auth/login"
                      class="text-primary text-decoration-none fw-medium"
                      >Sign In</a
                    >
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .bg-gradient-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
      }
      .card {
        backdrop-filter: blur(10px);
        background: rgba(255, 255, 255, 0.95);
        border: none !important;
        position: relative;
      }
      .input-group-text {
        background-color: transparent;
        border-right: none;
      }
      .form-control,
      .form-select {
        border-left: none;
      }
      .form-control:focus,
      .form-select:focus {
        border-color: #667eea;
        box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
      }
      .btn-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        padding: 12px;
        font-weight: 500;
      }
      .btn-primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }
      .progress-bar.bg-danger {
        background: #dc3545 !important;
      }
      .progress-bar.bg-warning {
        background: #ffc107 !important;
      }
      .progress-bar.bg-info {
        background: #0dcaf0 !important;
      }
      .progress-bar.bg-success {
        background: #198754 !important;
      }
      .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.95);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 10;
        border-radius: 0.5rem;
        backdrop-filter: blur(5px);
      }
    `,
  ],
})
export class RegisterComponent {
  readonly authService = inject(AuthService);
  readonly router = inject(Router);
  readonly appName = environment.appName;

  userData = signal({
    email: "",
    password: "",
    fullName: "",
    role: "student",
  });

  readonly confirmPassword = signal("");
  readonly showPassword = signal(false);
  readonly acceptTerms = signal(false);
  readonly registrationSuccess = signal(false);

  readonly passwordsMatch = computed(() => {
    return this.userData().password === this.confirmPassword();
  });

  readonly passwordStrength = computed(() => {
    const password = this.userData().password;
    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (password.length >= 10) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    return strength;
  });

  readonly passwordStrengthClass = computed(() => {
    const strength = this.passwordStrength();
    if (strength < 25) return "bg-danger";
    if (strength < 50) return "bg-warning";
    if (strength < 75) return "bg-info";
    return "bg-success";
  });

  readonly passwordStrengthText = computed(() => {
    const strength = this.passwordStrength();
    if (strength < 25) return "Weak password";
    if (strength < 50) return "Fair password";
    if (strength < 75) return "Good password";
    return "Strong password";
  });

  readonly isFormValid = computed(() => {
    const data = this.userData();
    return (
      data.email.length > 0 &&
      data.password.length >= 6 &&
      data.fullName.length > 0 &&
      data.role.length > 0 &&
      this.passwordsMatch() &&
      this.acceptTerms()
    );
  });

  onSubmit(): void {
    if (!this.isFormValid()) return;

    this.authService.clearError();

    this.authService.register(this.userData()).subscribe({
      next: (response) => {
        this.authService.loading.set(false);
        // Redirect immediately after successful registration
        const role = response.user?.role || "student";
        this.router.navigate([`/${role}/dashboard`]);
      },
      error: (error) => {
        this.authService.loading.set(false);
        this.authService.authError.set(
          error.error?.detail || "Registration failed"
        );
        console.error("Registration error:", error);
      },
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((show) => !show);
  }

  updateEmail(email: string): void {
    this.userData.update((data) => ({ ...data, email }));
  }

  updatePassword(password: string): void {
    this.userData.update((data) => ({ ...data, password }));
  }

  updateFullName(fullName: string): void {
    this.userData.update((data) => ({ ...data, fullName }));
  }

  updateRole(role: string): void {
    this.userData.update((data) => ({ ...data, role }));
  }
}
