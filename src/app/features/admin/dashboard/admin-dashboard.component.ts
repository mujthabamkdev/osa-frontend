import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardStats } from '../../../core/models/dashboard.models';

@Component({
  templateUrl: './admin-dashboard.component.html',
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
})
export class AdminDashboardComponent implements OnInit {
  readonly apiService = inject(ApiService);
  readonly authService = inject(AuthService);

  readonly stats = signal<DashboardStats | null>(null);

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
