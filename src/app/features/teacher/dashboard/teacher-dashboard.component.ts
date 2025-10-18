import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';

@Component({
  templateUrl: './teacher-dashboard.component.html',
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule],
})
export class TeacherDashboardComponent {
  readonly authService = inject(AuthService);
  readonly apiService = inject(ApiService);

  refreshData(): void {
    // Implement refresh logic
  }

  logout(): void {
    this.authService.logout();
  }
}
