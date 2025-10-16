import { Component, inject, signal, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import { ApiService } from "../../../core/services/api.service";
import { AuthService } from "../../../core/services/auth.service";
import { Course } from "../../../core/models/course.models";
import { StudentProgress } from "../../../core/models/dashboard.models";

@Component({
  selector: "app-student-courses",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container py-4">
      <h2 class="mb-4">My Courses</h2>

      <!-- Enrolled Courses -->
      <div class="row g-4 mb-5">
        <div class="col-12">
          <h4>Enrolled Courses</h4>
        </div>
        @if (loading()) {
        <div class="col-12 text-center py-4">
          <div class="spinner-border text-primary"></div>
        </div>
        } @else if (enrolledCourses().length === 0) {
        <div class="col-12">
          <div class="alert alert-info">
            <i class="bi bi-info-circle me-2"></i>
            You are not enrolled in any courses yet. Browse available courses
            below.
          </div>
        </div>
        } @else { @for (progress of enrolledCourses(); track progress.course_id)
        {
        <div class="col-md-6 col-lg-4">
          <div class="card h-100">
            <div class="card-body">
              <h5 class="card-title">
                {{ progress.course_title || progress.title || "Course" }}
              </h5>
              <div class="mb-3">
                <div class="d-flex justify-content-between mb-1">
                  <small>Progress</small>
                  <small>{{ progress.progress }}%</small>
                </div>
                <div class="progress">
                  <div
                    class="progress-bar"
                    [style.width.%]="progress.progress"
                  ></div>
                </div>
              </div>
              <p class="card-text">
                <small class="text-muted">
                  {{ progress.completed_lessons || 0 }} /
                  {{ progress.total_lessons || 0 }} lessons completed
                </small>
              </p>
              <div class="d-flex justify-content-between align-items-center">
                <small class="text-muted"
                  >Last accessed:
                  {{ progress.last_accessed | date : "short" }}</small
                >
                <button
                  class="btn btn-primary btn-sm"
                  (click)="continueCourse(progress)"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
        } }
      </div>

      <!-- Available Courses -->
      <div class="row g-4">
        <div class="col-12">
          <h4>Available Courses</h4>
        </div>
        @if (loadingAvailable()) {
        <div class="col-12 text-center py-4">
          <div class="spinner-border text-primary"></div>
        </div>
        } @else { @for (course of availableCourses(); track course.id) {
        <div class="col-md-6 col-lg-4">
          <div class="card h-100">
            <div class="card-body">
              <h5 class="card-title">{{ course.title }}</h5>
              <p class="card-text">{{ course.description }}</p>
              <div class="d-flex justify-content-between align-items-center">
                <small class="text-muted"
                  >Created: {{ course.created_at | date : "short" }}</small
                >
                <button
                  class="btn btn-success btn-sm"
                  (click)="enrollInCourse(course)"
                  [disabled]="isEnrolled(course.id)"
                >
                  @if (isEnrolled(course.id)) {
                  <i class="bi bi-check-circle me-1"></i>
                  Enrolled } @else {
                  <i class="bi bi-plus-circle me-1"></i>
                  Enroll }
                </button>
              </div>
            </div>
          </div>
        </div>
        } }
      </div>
    </div>
  `,
})
export class StudentCoursesComponent implements OnInit {
  readonly apiService = inject(ApiService);
  readonly authService = inject(AuthService);
  readonly router = inject(Router);

  readonly enrolledCourses = signal<StudentProgress[]>([]);
  readonly availableCourses = signal<Course[]>([]);
  readonly loading = signal(true);
  readonly loadingAvailable = signal(true);

  ngOnInit(): void {
    this.loadEnrolledCourses();
    this.loadAvailableCourses();
  }

  loadEnrolledCourses(): void {
    this.loading.set(true);
    const user = this.authService.user();
    if (user) {
      this.apiService.getEnrolledCourses(user.id).subscribe({
        next: (courses) => {
          console.log("Enrolled courses:", courses);
          this.enrolledCourses.set(courses);
          this.loading.set(false);
        },
        error: (error) => {
          console.error("Error loading enrolled courses:", error);
          this.loading.set(false);
          this.enrolledCourses.set([]);
        },
      });
    } else {
      this.loading.set(false);
    }
  }

  loadAvailableCourses(): void {
    this.loadingAvailable.set(true);
    this.apiService.getAvailableCourses().subscribe({
      next: (courses) => {
        console.log("Available courses:", courses);
        this.availableCourses.set(courses);
        this.loadingAvailable.set(false);
      },
      error: (error) => {
        console.error("Error loading available courses:", error);
        this.loadingAvailable.set(false);
        this.availableCourses.set([]);
      },
    });
  }

  enrollInCourse(course: Course): void {
    console.log("Enrolling in course:", course.id);
    this.apiService.enrollInCourse(course.id).subscribe({
      next: (response) => {
        console.log("Enrolled successfully:", response);
        // Reload both lists to refresh the UI
        this.loadEnrolledCourses();
        this.loadAvailableCourses();
      },
      error: (err) => {
        console.error("Enrollment error:", err);
        alert(err.error?.detail || "Enrollment failed");
      },
    });
  }

  continueCourse(progress: StudentProgress): void {
    this.router.navigate(["/student/courses", progress.course_id]);
  }

  isEnrolled(courseId: number): boolean {
    const enrolled = this.enrolledCourses().some(
      (progress) => progress.course_id === courseId
    );
    console.log(`Course ${courseId} enrolled: ${enrolled}`);
    return enrolled;
  }
}
