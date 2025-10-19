import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { BaseComponent } from '../../../shared/components/base.component';

interface LoginCredentials {
  email: string;
  password: string;
}

@Component({
  templateUrl: './login.component.html',
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
})
export class LoginComponent extends BaseComponent {
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);

  // Use plain properties for ngModel binding
  email = '';
  password = '';

  onSubmit(): void {
    this.authService.clearError();

    const credentials: LoginCredentials = {
      email: this.email,
      password: this.password,
    };

    this.authService.login(credentials).subscribe({
      next: ({ user }) => {
        this.authService.loading.set(false);
        console.log('Login successful, user:', user);
        console.log('User role:', user.role);

        // Wait for user signal to be set before navigating
        const checkUserReady = () => {
          const currentUser = this.authService.user();
          if (currentUser && currentUser.role) {
            const dashboardRoutes: Record<string, string> = {
              admin: '/admin/dashboard',
              teacher: '/teacher/dashboard',
              student: '/student/dashboard',
              parent: '/parent/dashboard',
            };
            const targetRoute = dashboardRoutes[currentUser.role] || '/';
            console.log('Navigating to:', targetRoute);
            this.router.navigate([targetRoute]).then((success) => {
              console.log('Navigation success:', success);
              if (!success) {
                console.error('Failed to navigate to dashboard');
                this.authService.authError.set('Failed to navigate to dashboard');
              }
            });
          } else {
            setTimeout(checkUserReady, 50);
          }
        };
        checkUserReady();
      },
      error: (error) => {
        this.authService.loading.set(false);
        this.authService.authError.set(error.error?.detail || 'Login failed');
        console.error('Login error:', error);
      },
    });
  }
}
