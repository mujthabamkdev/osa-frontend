
// src/app/features/teacher/courses/course-management.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Course, CreateCourseRequest } from '../../../core/models/course.models';

@Component({
  selector: 'app-teacher-course-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container py-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2>My Courses</h2>
        <button class="btn btn-primary" (click)="showCreateModal.set(true)">
          <i class="bi bi-plus-circle me-1"></i>
          Create New Course
        </button>
      </div>

      <!-- Courses Grid -->
      <div class="row g-4">
        @if (loading()) {
          <div class="col-12 text-center py-4">
            <div class="spinner-border text-primary"></div>
          </div>
        } @else if (myCourses().length === 0) {
          <div class="col-12 text-center py-4">
            <p class="text-muted">No courses created yet.</p>
          </div>
        } @else {
          @for (course of myCourses(); track course.id) {
            <div class="col-md-6 col-lg-4">
              <div class="card h-100">
                <div class="card-body">
                  <h5 class="card-title">{{ course.title }}</h5>
                  <p class="card-text text-muted">{{ course.description }}</p>
                  <div class="d-flex justify-content-between align-items-center">
                    <small class="text-muted">{{ course.created_at | date:'short' }}</small>
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-outline-primary" (click)="manageCourse(course)">
                        <i class="bi bi-gear"></i> Manage
                      </button>
                      <button class="btn btn-outline-info" (click)="viewStudents(course)">
                        <i class="bi bi-people"></i> Students
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }
        }
      </div>

      <!-- Create Course Modal -->
      @if (showCreateModal()) {
        <div class="modal show d-block" style="background: rgba(0,0,0,0.5)">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Create New Course</h5>
                <button type="button" class="btn-close" (click)="showCreateModal.set(false)"></button>
              </div>
              <div class="modal-body">
                <form (ngSubmit)="createCourse()" #courseForm="ngForm">
                  <div class="mb-3">
                    <label class="form-label">Course Title</label>
                    <input 
                      type="text" 
                      class="form-control"
                      [ngModel]="newCourse().title"
                      (ngModelChange)="updateTitle($event)"
                      name="title" 
                      required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Description</label>
                    <textarea 
                      class="form-control" 
                      rows="3"
                      [ngModel]="newCourse().description"
                      (ngModelChange)="updateDescription($event)"
                      name="description" 
                      required></textarea>
                  </div>
                  <div class="d-flex justify-content-end gap-2">
                    <button type="button" class="btn btn-secondary" (click)="showCreateModal.set(false)">
                      Cancel
                    </button>
                    <button type="submit" class="btn btn-primary" [disabled]="courseForm.invalid">
                      Create Course
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class TeacherCourseManagementComponent implements OnInit {
  readonly apiService = inject(ApiService);
  readonly authService = inject(AuthService);
  
  readonly myCourses = signal<Course[]>([]);
  readonly loading = signal(true);
  readonly showCreateModal = signal(false);
  readonly newCourse = signal<CreateCourseRequest>({ 
    title: '', 
    description: '' 
  });

  ngOnInit(): void {
    this.loadMyCourses();
  }

  loadMyCourses(): void {
    this.loading.set(true);
    this.apiService.getTeacherCourses().subscribe({
      next: (courses) => {
        this.myCourses.set(courses);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        // Mock data
        this.myCourses.set([
          { id: 1, title: 'Islamic History', description: 'Comprehensive Islamic history course', teacher_id: 1, created_at: '2024-01-15' }
        ]);
      }
    });
  }

  createCourse(): void {
    this.apiService.createCourse(this.newCourse()).subscribe({
      next: () => {
        this.showCreateModal.set(false);
        this.newCourse.set({ title: '', description: '' });
        this.loadMyCourses();
      },
      error: (err) => console.error(err)
    });
  }

  manageCourse(course: Course): void {
    console.log('Manage course:', course);
  }

  viewStudents(course: Course): void {
    console.log('View students for course:', course);
  }

  updateTitle(title: string): void {
    this.newCourse.update(course => ({ ...course, title }));
  }

  updateDescription(description: string): void {
    this.newCourse.update(course => ({ ...course, description }));
  }
}