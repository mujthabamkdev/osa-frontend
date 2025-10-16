import { Component, inject, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ApiService } from "../../../core/services/api.service";
import { AuthService } from "../../../core/services/auth.service";
import { DashboardStats } from "../../../core/models/dashboard.models";

@Component({
  selector: "app-admin-dashboard",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container py-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="mb-0 fw-bold">Admin Dashboard</h2>
      </div>

      <div class="row g-4 mb-4">
        <div class="col-md-3" *ngIf="stats()">
          <div class="card text-white bg-primary h-100">
            <div class="card-body text-center">
              <i class="bi bi-people-fill display-4 mb-2"></i>
              <h3 class="fw-bold">{{ stats()!.totalCourses }}</h3>
              <p class="mb-0">Total Courses</p>
            </div>
          </div>
        </div>
        <div class="col-md-3" *ngIf="stats()">
          <div class="card text-white bg-success h-100">
            <div class="card-body text-center">
              <i class="bi bi-person-fill display-4 mb-2"></i>
              <h3 class="fw-bold">{{ stats()!.activeStudents }}</h3>
              <p class="mb-0">Active Students</p>
            </div>
          </div>
        </div>
        <div class="col-md-3" *ngIf="stats()">
          <div class="card text-white bg-info h-100">
            <div class="card-body text-center">
              <i class="bi bi-book-fill display-4 mb-2"></i>
              <h3 class="fw-bold">{{ stats()!.activeTeachers }}</h3>
              <p class="mb-0">Active Teachers</p>
            </div>
          </div>
        </div>
        <div class="col-md-3" *ngIf="stats()">
          <div class="card text-white bg-warning h-100">
            <div class="card-body text-center">
              <i class="bi bi-journal-check display-4 mb-2"></i>
              <h3 class="fw-bold">{{ stats()!.totalEnrollments }}</h3>
              <p class="mb-0">Total Enrollments</p>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="apiService.apiError(); let err" class="alert alert-danger">
        {{ err }}
      </div>
    </div>
  `,
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
