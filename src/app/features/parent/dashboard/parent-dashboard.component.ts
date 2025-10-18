// src/app/features/parent/dashboard/parent-dashboard.component.ts
import { Component, inject, signal, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import { AuthService } from "../../../core/services/auth.service";
import { ApiService } from "../../../core/services/api.service";

// Models
interface Child {
  id: number;
  name: string;
  email: string;
  grade: string;
  enrolledCourses: number;
  averageProgress: number;
  lastActive: string;
}

interface ChildProgress {
  course_id: number;
  course_title: string;
  progress: number;
  completed_lessons: number;
  total_lessons: number;
  last_accessed: string;
  grade?: string;
}

interface AcademicReport {
  child_id: number;
  child_name: string;
  total_courses: number;
  completed_courses: number;
  in_progress_courses: number;
  overall_progress: number;
  total_hours_studied: number;
  attendance_rate: number;
  last_week_activity: number;
}

@Component({
  templateUrl: './parent-dashboard.component.html',
  selector: "app-parent-dashboard",
  standalone: true,
  imports: [CommonModule]
  })
export class ParentDashboardComponent implements OnInit {
  readonly authService = inject(AuthService);
  readonly apiService = inject(ApiService);
  private readonly router = inject(Router);

  // State
  readonly loading = signal(true);
  readonly loadingProgress = signal(false);
  readonly children = signal<Child[]>([]);
  readonly selectedChild = signal<Child | null>(null);
  readonly selectedChildProgress = signal<ChildProgress[]>([]);
  readonly selectedChildReport = signal<AcademicReport | null>(null);

  // Computed values
  readonly totalCourses = signal(0);
  readonly averageProgress = signal(0);
  readonly totalHoursStudied = signal(0);

  ngOnInit(): void {
    this.loadChildren();
  }

  loadChildren(): void {
    this.loading.set(true);
    const user = this.authService.user();

    if (user) {
      this.apiService.getParentChildren(user.id).subscribe({
        next: (children: Child[]) => {
          this.children.set(children);
          this.calculateSummary(children);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          // Mock data for development
          const mockChildren: Child[] = [
            {
              id: 1,
              name: "Ahmed Ali",
              email: "ahmed.ali@student.com",
              grade: "Grade 8",
              enrolledCourses: 4,
              averageProgress: 78,
              lastActive: new Date().toISOString()
            },
            {
              id: 2,
              name: "Fatima Ali",
              email: "fatima.ali@student.com",
              grade: "Grade 6",
              enrolledCourses: 3,
              averageProgress: 85,
              lastActive: new Date(Date.now() - 86400000).toISOString()
            },
          ];
          this.children.set(mockChildren);
          this.calculateSummary(mockChildren);
          this.loading.set(false);
        }
      });
    }
  }

  calculateSummary(children: Child[]): void {
    const total = children.reduce(
      (sum, child) => sum + child.enrolledCourses,
      0
    );
    const avgProgress =
      children.length > 0
        ? Math.round(
            children.reduce((sum, child) => sum + child.averageProgress, 0) /
              children.length
          )
        : 0;

    this.totalCourses.set(total);
    this.averageProgress.set(avgProgress);
    this.totalHoursStudied.set(Math.round(total * 2.5)); // Mock calculation
  }

  viewChildDetails(child: Child): void {
    this.selectedChild.set(child);
    this.loadChildProgress(child.id);
    this.loadChildReport(child.id);

    // Scroll to details
    setTimeout(() => {
      const element = document.querySelector(".card-header.bg-primary");
      element?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  loadChildProgress(childId: number): void {
    this.loadingProgress.set(true);

    this.apiService.getStudentProgress(childId).subscribe({
      next: (progress: ChildProgress[]) => {
        this.selectedChildProgress.set(progress);
        this.loadingProgress.set(false);
      },
      error: () => {
        this.loadingProgress.set(false);
        // Mock data
        const mockProgress: ChildProgress[] = [
          {
            course_id: 1,
            course_title: "Islamic Studies",
            progress: 75,
            completed_lessons: 6,
            total_lessons: 8,
            last_accessed: new Date().toISOString(),
            grade: "A-"
          },
          {
            course_id: 2,
            course_title: "Arabic Language",
            progress: 60,
            completed_lessons: 3,
            total_lessons: 5,
            last_accessed: new Date(Date.now() - 172800000).toISOString(),
            grade: "B+"
          },
        ];
        this.selectedChildProgress.set(mockProgress);
      }
    });
  }

  loadChildReport(childId: number): void {
    this.apiService.getChildAcademicReport(childId).subscribe({
      next: (report: AcademicReport) => {
        this.selectedChildReport.set(report);
      },
      error: () => {
        // Mock data
        const mockReport: AcademicReport = {
          child_id: childId,
          child_name: this.selectedChild()?.name || "",
          total_courses: 4,
          completed_courses: 1,
          in_progress_courses: 3,
          overall_progress: 78,
          total_hours_studied: 45,
          attendance_rate: 92,
          last_week_activity: 7
        };
        this.selectedChildReport.set(mockReport);
      }
    });
  }

  closeChildDetails(): void {
    this.selectedChild.set(null);
    this.selectedChildProgress.set([]);
    this.selectedChildReport.set(null);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString();
  }

  refreshData(): void {
    this.loadChildren();
    if (this.selectedChild()) {
      this.loadChildProgress(this.selectedChild()!.id);
      this.loadChildReport(this.selectedChild()!.id);
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(["/auth/login"]);
  }
}
