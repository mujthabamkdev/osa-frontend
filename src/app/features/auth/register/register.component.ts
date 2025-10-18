import { Component, inject, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { AuthService } from "@core/services/auth.service";
import { environment } from "@environments/environment";

@Component({
  templateUrl: './register.component.html',
  selector: "app-register",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink]
  })
export class RegisterComponent {
  readonly authService = inject(AuthService);
  readonly router = inject(Router);
  readonly appName = environment.appName;

  userData = signal({
    email: "",
    password: "",
    fullName: "",
    role: "student"
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
      }
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
