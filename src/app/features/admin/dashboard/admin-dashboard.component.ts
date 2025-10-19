import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardStats } from '../../../core/models/dashboard.models';

@Component({
  templateUrl: './admin-dashboard.component.html',
  selector: 'app-admin-dashboard',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardComponent implements OnInit {
  readonly apiService = inject(ApiService);
  readonly authService = inject(AuthService);

  readonly stats = signal<DashboardStats | null>(null);
  readonly summaryCards = computed(() => {
    const data = this.stats();
    if (!data) {
      return [];
    }
    return [
      {
        label: 'Total Courses',
        value: data.totalCourses,
        icon: 'bi-people-fill',
        variant: 'primary',
      },
      {
        label: 'Active Students',
        value: data.activeStudents,
        icon: 'bi-person-fill',
        variant: 'success',
      },
      {
        label: 'Active Teachers',
        value: data.activeTeachers,
        icon: 'bi-book-fill',
        variant: 'info',
      },
      {
        label: 'Total Enrollments',
        value: data.totalEnrollments,
        icon: 'bi-journal-check',
        variant: 'warning',
      },
    ];
  });

  ngOnInit(): void {
    this.loadStats();
  }

  private loadStats(): void {
    this.apiService.getDashboardStats().subscribe({
      next: (data) => this.stats.set(data),
      error: () => {
        // Optional: set default or handle error
      },
    });
  }
}
