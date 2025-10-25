import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { DashboardStats } from '../../../core/models/dashboard.models';

@Component({
  templateUrl: './admin-dashboard.component.html',
  selector: 'app-admin-dashboard',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardComponent implements OnInit {
  readonly apiService = inject(ApiService);

  readonly stats = signal<DashboardStats | null>(null);
  readonly summaryCards = computed(() => {
    const data = this.stats();
    if (!data) {
      return [];
    }
    const totals = data.totals;
    const active = data.active;
    return [
      {
        label: 'Total Users',
        value: totals.users,
        icon: 'bi-people-fill',
        variant: 'primary',
      },
      {
        label: 'Active Users',
        value: totals.activeUsers,
        icon: 'bi-person-lines-fill',
        variant: 'info',
      },
      {
        label: 'Active Students',
        value: active.students,
        icon: 'bi-mortarboard-fill',
        variant: 'success',
      },
      {
        label: 'Active Teachers',
        value: active.teachers,
        icon: 'bi-easel2-fill',
        variant: 'warning',
      },
      {
        label: 'Courses',
        value: totals.courses,
        icon: 'bi-journal-bookmark-fill',
        variant: 'secondary',
      },
      {
        label: 'Enrollments',
        value: totals.enrollments,
        icon: 'bi-clipboard-check-fill',
        variant: 'dark',
      },
    ];
  });

  readonly userBreakdown = computed(() => {
    const data = this.stats();
    if (!data) {
      return [];
    }
    const totals = data.totals;
    const active = data.active;
    return [
      {
        label: 'Students',
        value: totals.students,
      },
      {
        label: 'Active Students',
        value: active.students,
      },
      {
        label: 'Teachers',
        value: totals.teachers,
      },
      {
        label: 'Active Teachers',
        value: active.teachers,
      },
      {
        label: 'Parents',
        value: totals.parents,
      },
      {
        label: 'Admins',
        value: totals.admins,
      },
      {
        label: 'Active Users',
        value: totals.activeUsers,
      },
      {
        label: 'Enrollments',
        value: totals.enrollments,
      },
    ];
  });

  readonly systemStatus = computed(() => {
    const data = this.stats();
    if (!data) {
      return null;
    }
    return {
      status: data.systemHealth,
      unanswered: data.unansweredQuestions,
      generatedAt: data.generatedAt,
    };
  });

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.apiService.getDashboardStats().subscribe({
      next: (data) => this.stats.set(data),
      error: () => {
        // Optional: set default or handle error
      },
    });
  }

  systemStatusVariant(status: string): string {
    const normalized = status?.toLowerCase?.() ?? 'unknown';
    if (normalized.includes('healthy')) {
      return 'bg-success';
    }
    if (normalized.includes('degrad')) {
      return 'bg-warning text-dark';
    }
    if (normalized.includes('unhealthy') || normalized.includes('unavailable')) {
      return 'bg-danger';
    }
    return 'bg-secondary';
  }

  formatTimestamp(isoDate: string): string {
    if (!isoDate) {
      return 'Unknown';
    }
    try {
      return new Intl.DateTimeFormat('en', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(isoDate));
    } catch {
      return isoDate;
    }
  }
}
