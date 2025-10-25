import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  readonly authService = inject(AuthService);

  getDashboardRoute(): string {
    if (this.authService.isAdmin()) {
      return '/admin/dashboard';
    } else if (this.authService.isTeacher()) {
      return '/teacher/dashboard';
    } else if (this.authService.isStudent()) {
      return '/student/dashboard';
    } else if (this.authService.isParent()) {
      return '/parent/dashboard';
    }
    return '/student/dashboard'; // default fallback
  }
}
