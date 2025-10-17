import { Component, inject, signal, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { AuthService } from "../../../core/services/auth.service";
import { ApiService } from "../../../core/services/api.service";
import { Course } from "../../../core/models/course.models";
import {
  StudentProgress,
  StudentStats,
  EnrolledCourse,
  Note,
} from "../../../core/models/dashboard.models";

@Component({
  selector: "app-student-dashboard",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid py-4">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="mb-0 fw-bold">Student Dashboard</h2>
          <p class="text-muted mb-0">
            Welcome back,
            {{ authService.user()?.fullName || authService.user()?.email }}
          </p>
        </div>
        <div class="d-flex gap-2">
          <button
            class="btn btn-outline-secondary"
            (click)="refreshData()"
            [disabled]="loading()"
          >
            <i
              class="bi bi-arrow-clockwise me-1"
              [class]="
                loading() ? 'bi-arrow-clockwise spinning' : 'bi-arrow-clockwise'
              "
            ></i>
            Refresh
          </button>
          <button class="btn btn-outline-danger" (click)="logout()">
            <i class="bi bi-box-arrow-right me-1"></i>
            Logout
          </button>
        </div>
      </div>

      <!-- Loading State -->
      @if (loading()) {
      <div class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2 text-muted">Loading your dashboard...</p>
      </div>
      } @else {

      <!-- Stats Cards -->
      <div class="row mb-4">
        <div class="col-md-3 mb-3">
          <div class="card h-100 border-primary">
            <div class="card-body text-center">
              <i class="bi bi-book text-primary fs-1 mb-2"></i>
              <h4 class="mb-1">{{ stats().enrolledCourses }}</h4>
              <p class="text-muted mb-0">Enrolled Courses</p>
            </div>
          </div>
        </div>
        <div class="col-md-3 mb-3">
          <div class="card h-100 border-success">
            <div class="card-body text-center">
              <i class="bi bi-check-circle text-success fs-1 mb-2"></i>
              <h4 class="mb-1">{{ stats().completedCourses }}</h4>
              <p class="text-muted mb-0">Completed Courses</p>
            </div>
          </div>
        </div>
        <div class="col-md-3 mb-3">
          <div class="card h-100 border-warning">
            <div class="card-body text-center">
              <i class="bi bi-clock text-warning fs-1 mb-2"></i>
              <h4 class="mb-1">{{ stats().inProgressCourses }}</h4>
              <p class="text-muted mb-0">In Progress</p>
            </div>
          </div>
        </div>
        <div class="col-md-3 mb-3">
          <div class="card h-100 border-info">
            <div class="card-body text-center">
              <i class="bi bi-graph-up text-info fs-1 mb-2"></i>
              <h4 class="mb-1">{{ stats().totalProgress }}%</h4>
              <p class="text-muted mb-0">Overall Progress</p>
            </div>
          </div>
        </div>
      </div>

      <!-- My Courses Section -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">My Courses</h5>
            </div>
            <div class="card-body">
              @if (enrolledCourses().length === 0) {
              <div class="text-center py-4">
                <i class="bi bi-book text-muted fs-1 mb-3"></i>
                <h6 class="text-muted">No courses enrolled yet</h6>
                <p class="text-muted mb-3">
                  Start your learning journey by enrolling in courses from the
                  home page
                </p>
                <button class="btn btn-primary" (click)="goToHome()">
                  <i class="bi bi-house me-1"></i>
                  Browse Courses
                </button>
              </div>
              } @else {
              <div class="row">
                @for (course of enrolledCourses(); track course.id) {
                <div class="col-md-6 mb-4">
                  <div
                    class="card h-100 course-card"
                    [class.disabled]="!isCourseAccessible(course)"
                    [class.opacity-50]="!isCourseAccessible(course)"
                    (click)="
                      isCourseAccessible(course) && viewCourse(course.id)
                    "
                    [style.cursor]="
                      isCourseAccessible(course) ? 'pointer' : 'not-allowed'
                    "
                  >
                    <div class="card-body">
                      <div
                        class="d-flex justify-content-between align-items-start mb-3"
                      >
                        <h6 class="card-title mb-1">{{ course.title }}</h6>
                        <span
                          class="badge"
                          [class]="getStatusBadgeClass(course.status)"
                        >
                          {{ getStatusText(course.status) }}
                        </span>
                      </div>
                      <p class="card-text text-muted small mb-3">
                        {{ course.description }}
                      </p>

                      <!-- Active Class Information -->
                      @if (course.active_class_title) {
                      <div class="mb-3">
                        <div class="d-flex align-items-center">
                          <i
                            class="bi bi-play-circle-fill text-primary me-2"
                          ></i>
                          <small class="text-primary fw-medium"
                            >Active Class:
                            {{ course.active_class_title }}</small
                          >
                        </div>
                      </div>
                      }

                      <!-- Course Progress -->
                      <div class="mb-3">
                        <div
                          class="d-flex justify-content-between align-items-center mb-1"
                        >
                          <small class="text-muted">Overall Progress</small>
                          <small class="fw-medium"
                            >{{ course.progress }}%</small
                          >
                        </div>
                        <div class="progress" style="height: 8px;">
                          <div
                            class="progress-bar"
                            [class]="getProgressBarClass(course.progress)"
                            [style.width.%]="course.progress"
                          ></div>
                        </div>
                      </div>

                      <!-- Course Levels -->
                      @if (course.levels && course.levels.length > 0) {
                      <div class="mb-3">
                        <small class="text-muted d-block mb-2"
                          >Course Structure</small
                        >
                        <div class="d-flex flex-wrap gap-1">
                          @for (level of course.levels.slice(0, 3); track
                          level.id) {
                          <span class="badge bg-light text-dark small">
                            <i class="bi bi-layer me-1"></i>
                            {{ level.title }}
                          </span>
                          } @if (course.levels.length > 3) {
                          <span class="badge bg-light text-dark small">
                            +{{ course.levels.length - 3 }} more
                          </span>
                          }
                        </div>
                      </div>
                      }

                      <div
                        class="d-flex justify-content-between align-items-center"
                      >
                        <small class="text-muted">
                          <i class="bi bi-clock me-1"></i>
                          Last accessed: {{ formatDate(course.lastAccessed) }}
                        </small>
                        <button
                          class="btn btn-sm btn-outline-primary"
                          [disabled]="!isCourseAccessible(course)"
                          (click)="
                            isCourseAccessible(course) && viewCourse(course.id);
                            $event.stopPropagation()
                          "
                        >
                          <i class="bi bi-play-circle me-1"></i>
                          {{
                            isCourseAccessible(course)
                              ? "Continue"
                              : "Not Available"
                          }}
                        </button>
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
      </div>

      <!-- Notes Section -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="card">
            <div
              class="card-header d-flex justify-content-between align-items-center"
            >
              <h5 class="mb-0">My Notes</h5>
              <button
                class="btn btn-sm btn-outline-success"
                (click)="openNotesModal()"
              >
                <i class="bi bi-plus-circle me-1"></i>
                Add Note
              </button>
            </div>
            <div class="card-body">
              @if (notes().length === 0) {
              <div class="text-center py-4">
                <i class="bi bi-sticky text-muted fs-1 mb-3"></i>
                <h6 class="text-muted">No notes yet</h6>
                <p class="text-muted mb-3">
                  Create your first note to keep track of important information
                </p>
                <button class="btn btn-success" (click)="openNotesModal()">
                  <i class="bi bi-plus-circle me-1"></i>
                  Create Note
                </button>
              </div>
              } @else {
              <div class="row">
                @for (note of notes(); track note.id) {
                <div class="col-md-6 mb-3">
                  <div class="card h-100 note-card">
                    <div class="card-body">
                      <div
                        class="d-flex justify-content-between align-items-start mb-2"
                      >
                        <h6 class="card-title mb-1">{{ note.title }}</h6>
                        <div class="dropdown">
                          <button
                            class="btn btn-sm btn-outline-secondary"
                            type="button"
                            data-bs-toggle="dropdown"
                          >
                            <i class="bi bi-three-dots"></i>
                          </button>
                          <ul class="dropdown-menu">
                            <li>
                              <a
                                class="dropdown-item"
                                (click)="openNotesModal(note)"
                              >
                                <i class="bi bi-pencil me-2"></i>Edit
                              </a>
                            </li>
                            <li>
                              <a
                                class="dropdown-item text-danger"
                                (click)="deleteNote(note.id)"
                              >
                                <i class="bi bi-trash me-2"></i>Delete
                              </a>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <p class="card-text text-muted small mb-2">
                        {{
                          note.content.length > 100
                            ? note.content.substring(0, 100) + "..."
                            : note.content
                        }}
                      </p>
                      <small class="text-muted">
                        <i class="bi bi-clock me-1"></i>
                        {{ formatDate(note.updated_at) }}
                      </small>
                    </div>
                  </div>
                </div>
                }
              </div>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- My Progress Section -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">My Progress</h5>
            </div>
            <div class="card-body">
              @if (enrolledCourses().length === 0) {
              <div class="text-center py-4">
                <i class="bi bi-graph-up text-muted fs-1 mb-3"></i>
                <h6 class="text-muted">No progress to show yet</h6>
                <p class="text-muted mb-0">
                  Enroll in courses to start tracking your progress
                </p>
              </div>
              } @else {
              <div class="row">
                <!-- Overall Progress Summary -->
                <div class="col-md-4 mb-3">
                  <div class="card h-100 border-primary">
                    <div class="card-body text-center">
                      <i class="bi bi-trophy text-primary fs-1 mb-2"></i>
                      <h4 class="mb-1">{{ stats().totalProgress }}%</h4>
                      <p class="text-muted mb-0">Overall Progress</p>
                      <small class="text-muted">Across all courses</small>
                    </div>
                  </div>
                </div>

                <!-- Courses Completed -->
                <div class="col-md-4 mb-3">
                  <div class="card h-100 border-success">
                    <div class="card-body text-center">
                      <i class="bi bi-check-circle text-success fs-1 mb-2"></i>
                      <h4 class="mb-1">{{ stats().completedCourses }}</h4>
                      <p class="text-muted mb-0">Courses Completed</p>
                      <small class="text-muted"
                        >Out of {{ stats().enrolledCourses }} enrolled</small
                      >
                    </div>
                  </div>
                </div>

                <!-- Study Streak/Time -->
                <div class="col-md-4 mb-3">
                  <div class="card h-100 border-info">
                    <div class="card-body text-center">
                      <i class="bi bi-calendar-check text-info fs-1 mb-2"></i>
                      <h4 class="mb-1">{{ stats().hoursStudied || 0 }}</h4>
                      <p class="text-muted mb-0">Hours Studied</p>
                      <small class="text-muted">This month</small>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Detailed Progress by Course -->
              @if (enrolledCourses().length > 0) {
              <div class="mt-4">
                <h6 class="mb-3">Course Progress Details</h6>
                <div class="row">
                  @for (course of enrolledCourses(); track course.id) {
                  <div class="col-md-6 mb-3">
                    <div class="card">
                      <div class="card-body">
                        <div
                          class="d-flex justify-content-between align-items-start mb-2"
                        >
                          <h6 class="card-title mb-1">{{ course.title }}</h6>
                          <span
                            class="badge"
                            [class]="getStatusBadgeClass(course.status)"
                          >
                            {{ getStatusText(course.status) }}
                          </span>
                        </div>
                        <div class="mb-2">
                          <div
                            class="d-flex justify-content-between align-items-center mb-1"
                          >
                            <small class="text-muted">Progress</small>
                            <small class="fw-medium"
                              >{{ course.progress }}%</small
                            >
                          </div>
                          <div class="progress" style="height: 6px;">
                            <div
                              class="progress-bar"
                              [class]="getProgressBarClass(course.progress)"
                              [style.width.%]="course.progress"
                            ></div>
                          </div>
                        </div>
                        @if (course.levels && course.levels.length > 0) {
                        <small class="text-muted">
                          {{ course.completedLevels || 0 }} of
                          {{ course.totalLevels || course.levels.length }}
                          levels completed
                        </small>
                        }
                      </div>
                    </div>
                  </div>
                  }
                </div>
              </div>
              } }
            </div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      @if (apiService.apiError(); as error) {
      <div
        class="alert alert-danger alert-dismissible fade show mt-3"
        role="alert"
      >
        {{ error }}
        <button
          type="button"
          class="btn-close"
          (click)="apiService.clearError()"
        ></button>
      </div>
      } }
    </div>

    <!-- Notes Modal -->
    @if (showNotesModal()) {
    <div
      class="modal fade show d-block"
      tabindex="-1"
      style="background-color: rgba(0,0,0,0.5);"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ selectedNote() ? "Edit Note" : "Create New Note" }}
            </h5>
            <button
              type="button"
              class="btn-close"
              (click)="closeNotesModal()"
            ></button>
          </div>
          <div class="modal-body">
            <form>
              <div class="mb-3">
                <label for="noteTitle" class="form-label">Title</label>
                <input
                  type="text"
                  class="form-control"
                  id="noteTitle"
                  [(ngModel)]="noteTitle"
                  placeholder="Enter note title"
                />
              </div>
              <div class="mb-3">
                <label for="noteContent" class="form-label">Content</label>
                <textarea
                  class="form-control"
                  id="noteContent"
                  rows="6"
                  [(ngModel)]="noteContent"
                  placeholder="Enter your note content"
                ></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              (click)="closeNotesModal()"
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-primary"
              (click)="saveNote()"
              [disabled]="!noteTitle().trim() || !noteContent().trim()"
            >
              {{ selectedNote() ? "Update Note" : "Create Note" }}
            </button>
          </div>
        </div>
      </div>
    </div>
    }
  `,
  styles: [
    `
      .course-card {
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      .course-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
      .available-course-card {
        border: 2px solid #e9ecef;
        transition: all 0.2s;
      }
      .available-course-card:hover {
        border-color: #0d6efd;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(13, 110, 253, 0.2);
      }
      .note-card {
        border-left: 4px solid #28a745;
        transition: transform 0.2s;
      }
      .note-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
      .spinning {
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class StudentDashboardComponent implements OnInit {
  readonly authService = inject(AuthService);
  readonly apiService = inject(ApiService);
  readonly router = inject(Router);

  // Signals for reactive state
  readonly loading = signal(false);
  readonly stats = signal<StudentStats>({
    enrolledCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    totalProgress: 0,
    hoursStudied: 0,
  });
  readonly enrolledCourses = signal<EnrolledCourse[]>([]);
  readonly recentProgress = signal<StudentProgress[]>([]);
  readonly notes = signal<Note[]>([]);
  readonly showNotesModal = signal(false);
  readonly selectedNote = signal<Note | null>(null);
  readonly noteTitle = signal("");
  readonly noteContent = signal("");

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading.set(true);
    const user = this.authService.user();
    if (!user) return;

    // Load enrolled courses with levels
    this.apiService.getEnrolledCourses(user.id).subscribe({
      next: async (progressData: StudentProgress[]) => {
        const enrolledCourses: EnrolledCourse[] = [];

        for (const progress of progressData) {
          const course: EnrolledCourse = {
            id: progress.course_id,
            title: progress.course_title || progress.title || "Course",
            description: `Course with ${progress.total_lessons || 0} lessons`,
            progress: progress.progress,
            status: this.getCourseStatus(progress.progress),
            lastAccessed: progress.last_accessed,
            instructor: "Instructor Name", // Mock instructor
            active_class_id: progress.active_class_id,
            active_class_title: progress.active_class_title,
          };

          // Load course levels/chapters
          try {
            const levels = await this.apiService
              .getCourseLevels(progress.course_id)
              .toPromise();
            if (levels && levels.length > 0) {
              course.levels = levels.map((level: any) => ({
                id: level.id,
                course_id: level.course_id,
                title: level.title,
                description: level.description,
                order: level.order,
                progress: 0, // Will be calculated based on completed classes
                created_at: level.created_at,
              }));

              // Calculate level progress (mock for now)
              course.totalLevels = course.levels.length;
              course.completedLevels = Math.floor(
                (course.progress / 100) * course.levels.length
              );
            } else {
              course.levels = [];
              course.totalLevels = 0;
              course.completedLevels = 0;
            }
          } catch (error) {
            console.warn(
              `Failed to load levels for course ${progress.course_id}:`,
              error
            );
            course.levels = [];
            course.totalLevels = 0;
            course.completedLevels = 0;
          }

          enrolledCourses.push(course);
        }

        this.enrolledCourses.set(enrolledCourses);

        // Calculate stats
        const completed = enrolledCourses.filter(
          (c) => c.status === "completed"
        ).length;
        const inProgress = enrolledCourses.filter(
          (c) => c.status === "in-progress"
        ).length;
        const totalProgress =
          enrolledCourses.length > 0
            ? Math.round(
                enrolledCourses.reduce((sum, c) => sum + c.progress, 0) /
                  enrolledCourses.length
              )
            : 0;

        this.stats.set({
          enrolledCourses: enrolledCourses.length,
          completedCourses: completed,
          inProgressCourses: inProgress,
          totalProgress,
          hoursStudied: Math.floor(Math.random() * 50) + 10, // Mock hours
        });

        this.loading.set(false);
      },
      error: (error) => {
        console.error("Failed to load enrolled courses:", error);
        this.loading.set(false);
      },
    });

    // Load recent progress (mock data for now)
    this.apiService.getStudentProgress(user.id).subscribe({
      next: (progress: StudentProgress[]) => {
        this.recentProgress.set(progress.slice(0, 5)); // Show last 5 activities
      },
      error: (error) => {
        console.error("Failed to load progress:", error);
        // Set mock progress data
        this.recentProgress.set([
          {
            course_id: 1,
            course_title: "Introduction to Islamic Studies",
            progress: 75,
            completed_lessons: 15,
            total_lessons: 20,
            last_accessed: new Date(
              Date.now() - 2 * 60 * 60 * 1000
            ).toISOString(),
          },
          {
            course_id: 2,
            course_title: "Quran Recitation Basics",
            progress: 45,
            completed_lessons: 9,
            total_lessons: 20,
            last_accessed: new Date(
              Date.now() - 5 * 60 * 60 * 1000
            ).toISOString(),
          },
        ]);
      },
    });

    // Load student notes
    this.apiService.getStudentNotes(user.id).subscribe({
      next: (notes: Note[]) => {
        this.notes.set(notes);
      },
      error: (error) => {
        console.error("Failed to load notes:", error);
        this.notes.set([]);
      },
    });
  }

  refreshData(): void {
    this.loadDashboardData();
  }

  viewAllCourses(): void {
    this.router.navigate(["/"]);
  }

  goToHome(): void {
    this.router.navigate(["/"]);
  }

  viewMyCourses(): void {
    this.router.navigate(["/student/courses"]);
  }

  viewProgress(): void {
    // Could navigate to a detailed progress page
    this.router.navigate(["/student/courses"]);
  }

  viewCourse(courseId: number): void {
    // Navigate to course details page to continue learning
    this.router.navigate(["/student/courses", courseId]);
  }

  isCourseAccessible(course: EnrolledCourse): boolean {
    // Allow access to courses that have an active class (current courses)
    // or courses that are in progress or completed
    // Disable access to courses that are not started and have no active class
    return !!course.active_class_title || course.status !== "not-started";
  }

  enrollInCourse(courseId: number): void {
    const user = this.authService.user();
    if (!user) return;

    this.apiService.enrollInCourse(courseId).subscribe({
      next: () => {
        // Refresh dashboard data to update enrolled courses
        this.loadDashboardData();
      },
      error: (error) => {
        console.error("Failed to enroll in course:", error);
      },
    });
  }

  // Notes functionality
  openNotesModal(note?: Note): void {
    if (note) {
      this.selectedNote.set(note);
      this.noteTitle.set(note.title);
      this.noteContent.set(note.content);
    } else {
      this.selectedNote.set(null);
      this.noteTitle.set("");
      this.noteContent.set("");
    }
    this.showNotesModal.set(true);
  }

  closeNotesModal(): void {
    this.showNotesModal.set(false);
    this.selectedNote.set(null);
    this.noteTitle.set("");
    this.noteContent.set("");
  }

  saveNote(): void {
    const user = this.authService.user();
    if (!user) return;

    const title = this.noteTitle().trim();
    const content = this.noteContent().trim();

    if (!title || !content) return;

    if (this.selectedNote()) {
      // Update existing note
      this.apiService
        .updateNote(user.id, this.selectedNote()!.id, title, content)
        .subscribe({
          next: () => {
            this.loadDashboardData();
            this.closeNotesModal();
          },
          error: (error) => {
            console.error("Failed to update note:", error);
          },
        });
    } else {
      // Create new note
      this.apiService.createNote(user.id, title, content).subscribe({
        next: () => {
          this.loadDashboardData();
          this.closeNotesModal();
        },
        error: (error) => {
          console.error("Failed to create note:", error);
        },
      });
    }
  }

  deleteNote(noteId: number): void {
    const user = this.authService.user();
    if (!user) return;

    if (confirm("Are you sure you want to delete this note?")) {
      this.apiService.deleteNote(user.id, noteId).subscribe({
        next: () => {
          this.loadDashboardData();
        },
        error: (error) => {
          console.error("Failed to delete note:", error);
        },
      });
    }
  }

  logout(): void {
    this.authService.logout();
  }

  getCourseStatus(
    progress: number
  ): "not-started" | "in-progress" | "completed" {
    if (progress === 0) return "not-started";
    if (progress === 100) return "completed";
    return "in-progress";
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case "completed":
        return "bg-success";
      case "in-progress":
        return "bg-warning";
      case "not-started":
        return "bg-secondary";
      default:
        return "bg-secondary";
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case "completed":
        return "Completed";
      case "in-progress":
        return "In Progress";
      case "not-started":
        return "Not Started";
      default:
        return "Unknown";
    }
  }

  getProgressBarClass(progress: number): string {
    if (progress >= 80) return "bg-success";
    if (progress >= 50) return "bg-warning";
    return "bg-info";
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  }
}
