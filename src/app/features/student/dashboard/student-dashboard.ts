// src/app/features/student/dashboard/student-dashboard.component.ts - FIXED VERSION
import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Course } from '../../../core/models/course.models';

interface StudentProgress {
  course_id: number;
  course_title: string;
  progress: number;
  completed_lessons: number;
  total_lessons: number;
  last_accessed: string;
}

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container py-4">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="mb-0 fw-bold">My Learning Dashboard</h2>
          <p class="text-muted mb-0">Welcome back, {{ authService.user()?.email }}</p>
        </div>
        <div class="d-flex gap-2">
          <button
            class="btn btn-outline-secondary"
            (click)="refreshData()"
          >
            <i class="bi bi-arrow-clockwise me-1"></i>
            Refresh
          </button>
          <button
            class="btn btn-outline-danger"
            (click)="logout()"
          >
            <i class="bi bi-box-arrow-right me-1"></i>
            Logout
          </button>
        </div>
      </div>

      <!-- Progress Overview -->
      <div class="row g-4 mb-4">
        <div class="col-md-3">
          <div class="card bg-primary text-white h-100">
            <div class="card-body text-center">
              <i class="bi bi-book display-4 mb-2"></i>
              <h3 class="fw-bold">{{ enrolledCourses().length }}</h3>
              <p class="mb-0">Enrolled Courses</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-success text-white h-100">
            <div class="card-body text-center">
              <i class="bi bi-check-circle display-4 mb-2"></i>
              <h3 class="fw-bold">{{ completedLessons() }}</h3>
              <p class="mb-0">Completed Lessons</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-info text-white h-100">
            <div class="card-body text-center">
              <i class="bi bi-clock display-4 mb-2"></i>
              <h3 class="fw-bold">{{ studyHours() }}h</h3>
              <p class="mb-0">Study Hours</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-warning text-white h-100">
            <div class="card-body text-center">
              <i class="bi bi-trophy display-4 mb-2"></i>
              <h3 class="fw-bold">{{ overallProgress() }}%</h3>
              <p class="mb-0">Overall Progress</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="row g-4">
        <!-- My Courses -->
        <div class="col-lg-8">
          <div class="card h-100">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">My Courses</h5>
              <a
                routerLink="/student/courses"
                class="btn btn-primary btn-sm"
              >
                <i class="bi bi-plus-circle me-1"></i>
                Browse Courses
              </a>
            </div>
            <div class="card-body">
              @if (apiService.loading()) {
                <div class="text-center py-4">
                  <div class="spinner-border text-primary"></div>
                  <p class="mt-2 text-muted">Loading your courses...</p>
                </div>
              } @else if (enrolledCourses().length === 0) {
                <div class="text-center py-5">
                  <i class="bi bi-book display-1 text-muted mb-3"></i>
                  <h4>No Courses Yet</h4>
                  <p class="text-muted mb-4">
                    Start your learning journey by enrolling in a course
                  </p>
                  <a
                    routerLink="/student/courses"
                    class="btn btn-primary"
                  >
                    <i class="bi bi-search me-1"></i>
                    Browse Available Courses
                  </a>
                </div>
              } @else {
                <div class="row g-3">
                  @for (course of enrolledCourses(); track course.id) {
                    <div class="col-md-6">
                      <div class="card border h-100">
                        <div class="card-body">
                          <div class="d-flex justify-content-between align-items-start mb-2">
                            <h6 class="card-title mb-0">{{ course.title }}</h6>
                            <span class="badge bg-success">Active</span>
                          </div>
                          <p class="card-text text-muted small mb-3">
                            {{ course.description }}
                          </p>

                          <!-- Progress Bar -->
                          <div class="mb-3">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                              <small class="text-muted">Progress</small>
                              <small class="fw-medium">{{ getCourseProgress(course.id) }}%</small>
                            </div>
                            <div
                              class="progress"
                              style="height: 6px;"
                            >
                              <div
                                class="progress-bar bg-success"
                                role="progressbar"
                                [style.width.%]="getCourseProgress(course.id)"
                              ></div>
                            </div>
                          </div>

                          <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">
                              <i class="bi bi-calendar me-1"></i>
                              {{ course.created_at | date: 'mediumDate' }}
                            </small>
                            <div class="btn-group btn-group-sm">
                              <button
                                class="btn btn-outline-primary"
                                (click)="continueCourse(course)"
                              >
                                <i class="bi bi-play-circle me-1"></i>
                                Continue
                              </button>
                              <button
                                class="btn btn-outline-secondary"
                                (click)="viewCourseDetails(course)"
                              >
                                <i class="bi bi-info-circle"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="col-lg-4">
          <!-- Learning Stats -->
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="mb-0">Learning Statistics</h5>
            </div>
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <span class="fw-medium">Courses Enrolled</span>
                <span class="badge bg-primary">{{ enrolledCourses().length }}</span>
              </div>
              <div class="d-flex justify-content-between align-items-center mb-3">
                <span class="fw-medium">Lessons Completed</span>
                <span class="badge bg-success">{{ completedLessons() }}</span>
              </div>
              <div class="d-flex justify-content-between align-items-center mb-3">
                <span class="fw-medium">Study Streak</span>
                <span class="badge bg-warning">{{ studyStreak() }} days</span>
              </div>
              <div class="d-flex justify-content-between align-items-center mb-3">
                <span class="fw-medium">Certificates Earned</span>
                <span class="badge bg-info">{{ certificatesEarned() }}</span>
              </div>

              <hr />

              <!-- Overall Progress -->
              <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span class="fw-medium">Overall Progress</span>
                  <span class="text-muted">{{ overallProgress() }}%</span>
                </div>
                <div
                  class="progress"
                  style="height: 8px;"
                >
                  <div
                    class="progress-bar bg-gradient"
                    role="progressbar"
                    [style.width.%]="overallProgress()"
                    style="background: linear-gradient(90deg, #28a745 0%, #20c997 100%);"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="mb-0">Quick Actions</h5>
            </div>
            <div class="card-body">
              <div class="d-grid gap-2">
                <button class="btn btn-outline-primary">
                  <i class="bi bi-journal-text me-2"></i>
                  My Notes
                </button>
                <button class="btn btn-outline-success">
                  <i class="bi bi-calendar-event me-2"></i>
                  Study Schedule
                </button>
                <button class="btn btn-outline-info">
                  <i class="bi bi-chat-dots me-2"></i>
                  Ask Questions
                </button>
                <button class="btn btn-outline-warning">
                  <i class="bi bi-award me-2"></i>
                  Achievements
                </button>
              </div>
            </div>
          </div>

          <!-- Recent Activity -->
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">Recent Activity</h5>
            </div>
            <div class="card-body">
              <div class="timeline">
                <div class="timeline-item mb-3">
                  <div class="timeline-marker bg-success"></div>
                  <div class="timeline-content">
                    <div class="fw-medium">Completed Lesson 3</div>
                    <div class="text-muted small">Islamic History - 2 hours ago</div>
                  </div>
                </div>
                <div class="timeline-item mb-3">
                  <div class="timeline-marker bg-primary"></div>
                  <div class="timeline-content">
                    <div class="fw-medium">Started New Course</div>
                    <div class="text-muted small">Quran Recitation - 1 day ago</div>
                  </div>
                </div>
                <div class="timeline-item">
                  <div class="timeline-marker bg-info"></div>
                  <div class="timeline-content">
                    <div class="fw-medium">Earned Certificate</div>
                    <div class="text-muted small">Basic Arabic - 3 days ago</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Error Display -->
      @if (apiService.apiError(); as error) {
        <div
          class="alert alert-danger mt-4"
          role="alert"
        >
          <i class="bi bi-exclamation-triangle me-2"></i>
          {{ error }}
          <button
            type="button"
            class="btn-close"
            (click)="apiService.clearError()"
          ></button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .card {
        box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
        border: none;
      }

      .progress {
        border-radius: 0.5rem;
      }

      .timeline {
        position: relative;
        padding-left: 2rem;
      }

      .timeline::before {
        content: '';
        position: absolute;
        left: 0.5rem;
        top: 0;
        bottom: 0;
        width: 2px;
        background: #e9ecef;
      }

      .timeline-item {
        position: relative;
      }

      .timeline-marker {
        position: absolute;
        left: -2rem;
        top: 0.25rem;
        width: 1rem;
        height: 1rem;
        border-radius: 50%;
        border: 2px solid #fff;
        box-shadow: 0 0 0 2px #e9ecef;
      }

      .display-1 {
        font-size: 4rem;
      }
    `,
  ],
})
export class StudentDashboardComponent implements OnInit {
  readonly apiService = inject(ApiService);
  readonly authService = inject(AuthService);

  // Signals
  readonly enrolledCourses = signal<Course[]>([]);
  readonly progressData = signal<StudentProgress[]>([]);

  // Mock data signals
  readonly completedLessons = signal(24);
  readonly studyHours = signal(45);
  readonly studyStreak = signal(7);
  readonly certificatesEarned = signal(2);

  // Computed
  readonly overallProgress = computed(() => {
    const courses = this.enrolledCourses();
    if (courses.length === 0) return 0;

    const totalProgress = courses.reduce(
      (sum, course) => sum + this.getCourseProgress(course.id),
      0
    );
    return Math.round(totalProgress / courses.length);
  });

  // Expose services for template

  ngOnInit(): void {
    this.loadStudentData();
  }

  private loadStudentData(): void {
    // Load enrolled courses
    this.apiService.getStudentCourses().subscribe({
      next: (courses) => this.enrolledCourses.set(courses),
      error: () => {
        // Set mock data for demo
        this.enrolledCourses.set([
          {
            id: 1,
            title: 'Islamic Studies Foundation',
            description: 'Basic principles of Islam',
            teacher_id: 1,
            created_at: '2024-01-15',
          },
          {
            id: 2,
            title: 'Quran Recitation',
            description: 'Learn proper Quran recitation techniques',
            teacher_id: 2,
            created_at: '2024-01-20',
          },
          {
            id: 3,
            title: 'Arabic Language Basics',
            description: 'Introduction to Arabic language',
            teacher_id: 1,
            created_at: '2024-01-25',
          },
        ]);
      },
    });

    // Load progress data
    const currentUser = this.authService.currentUser();
    if (currentUser && currentUser.id) {
      this.apiService.getStudentProgress(currentUser.id).subscribe({
        next: (progress) => this.progressData.set(progress),
        error: () => {
          // Mock progress data
          this.progressData.set([
            {
              course_id: 1,
              course_title: 'Islamic Studies',
              progress: 75,
              completed_lessons: 6,
              total_lessons: 8,
              last_accessed: '2024-01-28',
            },
            {
              course_id: 2,
              course_title: 'Quran Recitation',
              progress: 45,
              completed_lessons: 9,
              total_lessons: 20,
              last_accessed: '2024-01-27',
            },
            {
              course_id: 3,
              course_title: 'Arabic Basics',
              progress: 20,
              completed_lessons: 2,
              total_lessons: 10,
              last_accessed: '2024-01-26',
            },
          ]);
        },
      });
    }
  }

  refreshData(): void {
    this.loadStudentData();
  }

  getCourseProgress(courseId: number): number {
    const progress = this.progressData().find((p) => p.course_id === courseId);
    return progress?.progress || Math.floor(Math.random() * 100);
  }

  continueCourse(course: Course): void {
    console.log('Continue course:', course);
    // Navigate to course content
  }

  viewCourseDetails(course: Course): void {
    console.log('View course details:', course);
    // Show course details modal or navigate
  }

  logout(): void {
    this.authService.logout();
  }
}
