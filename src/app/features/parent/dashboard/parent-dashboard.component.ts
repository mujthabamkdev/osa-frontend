// src/app/features/parent/dashboard/parent-dashboard.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { ParentChild } from '../../../core/models/dashboard.models';
import { StudentProgressEntry, StudentReport } from '../../../core/models/teacher.models';

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
  selector: 'app-parent-dashboard',
  standalone: true,
  imports: [CommonModule],
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
        next: (children: ParentChild[]) => {
          const mapped = children.map((child) => this.mapParentChild(child));
          this.children.set(mapped);
          this.calculateSummary(mapped);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          // Mock data for development
          const mockChildren: Child[] = [
            {
              id: 1,
              name: 'Ahmed Ali',
              email: 'ahmed.ali@student.com',
              grade: 'Grade 8',
              enrolledCourses: 4,
              averageProgress: 78,
              lastActive: new Date().toISOString(),
            },
            {
              id: 2,
              name: 'Fatima Ali',
              email: 'fatima.ali@student.com',
              grade: 'Grade 6',
              enrolledCourses: 3,
              averageProgress: 85,
              lastActive: new Date(Date.now() - 86400000).toISOString(),
            },
          ];
          this.children.set(mockChildren);
          this.calculateSummary(mockChildren);
          this.loading.set(false);
        },
      });
    }
  }

  calculateSummary(children: Child[]): void {
    const total = children.reduce((sum, child) => sum + child.enrolledCourses, 0);
    const avgProgress =
      children.length > 0
        ? Math.round(
            children.reduce((sum, child) => sum + child.averageProgress, 0) / children.length
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
      const element = document.querySelector('.card-header.bg-primary');
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  loadChildProgress(childId: number): void {
    this.loadingProgress.set(true);

    this.apiService.getStudentProgress(childId).subscribe({
      next: (progress: StudentProgressEntry[]) => {
        const mapped = progress.map((entry) => this.mapProgressEntry(entry));
        this.selectedChildProgress.set(mapped);
        this.loadingProgress.set(false);
      },
      error: () => {
        this.loadingProgress.set(false);
        // Mock data
        const mockProgress: ChildProgress[] = [
          {
            course_id: 1,
            course_title: 'Islamic Studies',
            progress: 75,
            completed_lessons: 6,
            total_lessons: 8,
            last_accessed: new Date().toISOString(),
            grade: 'A-',
          },
          {
            course_id: 2,
            course_title: 'Arabic Language',
            progress: 60,
            completed_lessons: 3,
            total_lessons: 5,
            last_accessed: new Date(Date.now() - 172800000).toISOString(),
            grade: 'B+',
          },
        ];
        this.selectedChildProgress.set(mockProgress);
      },
    });
  }

  loadChildReport(childId: number): void {
    this.apiService.getChildAcademicReport(childId).subscribe({
      next: (report: StudentReport) => {
        const mapped = this.mapAcademicReport(report);
        this.selectedChildReport.set(mapped);
      },
      error: () => {
        // Mock data
        const mockReport: AcademicReport = {
          child_id: childId,
          child_name: this.selectedChild()?.name || '',
          total_courses: 4,
          completed_courses: 1,
          in_progress_courses: 3,
          overall_progress: 78,
          total_hours_studied: 45,
          attendance_rate: 92,
          last_week_activity: 7,
        };
        this.selectedChildReport.set(mockReport);
      },
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

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
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
    this.router.navigate(['/auth/login']);
  }

  private mapParentChild(child: ParentChild): Child {
    const name = child.name || 'Student';
    const normalizedEmail = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/(^\.|\.$)/g, '');

    return {
      id: child.id,
      name,
      email: normalizedEmail ? `${normalizedEmail}@student.com` : 'student@school.com',
      grade: 'N/A',
      enrolledCourses: child.enrolledCourses ?? 0,
      averageProgress: 0,
      lastActive: new Date().toISOString(),
    };
  }

  private mapProgressEntry(entry: StudentProgressEntry): ChildProgress {
    const completedLessons = entry.completed ? 1 : 0;
    return {
      course_id: entry.session_id,
      course_title: entry.session_title || entry.subject_name || 'Course',
      progress: entry.completed ? 100 : 0,
      completed_lessons: completedLessons,
      total_lessons: 1,
      last_accessed: entry.completed_at ?? new Date().toISOString(),
      grade: this.scoreToGrade(entry.score),
    };
  }

  private mapAcademicReport(report: StudentReport): AcademicReport {
    const totalCourses = report.progress.length;
    const completedCourses = report.progress.filter((entry) => entry.completed).length;
    const overallProgress = totalCourses
      ? Math.round((completedCourses / totalCourses) * 100)
      : 0;
    const lastWeekActivity = report.progress.filter((entry) => {
      if (!entry.completed_at) {
        return false;
      }
      const completedDate = new Date(entry.completed_at);
      const now = new Date();
      const diffDays = (now.getTime() - completedDate.getTime()) / 86400000;
      return diffDays <= 7;
    }).length;

    return {
      child_id: report.student_id,
      child_name: report.student_name ?? 'Student',
      total_courses: totalCourses,
      completed_courses: completedCourses,
      in_progress_courses: Math.max(totalCourses - completedCourses, 0),
      overall_progress: overallProgress,
      total_hours_studied: totalCourses * 3,
      attendance_rate: 100,
      last_week_activity: lastWeekActivity,
    };
  }

  private scoreToGrade(score: number | null): string | undefined {
    if (score === null || Number.isNaN(score)) {
      return undefined;
    }

    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }
}
