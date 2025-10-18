// src/app/features/admin/courses/course-management.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Course, CreateCourseRequest } from '../../../core/models/course.models';

@Component({
  templateUrl: './course-management.component.html',
  selector: 'app-admin-course-management',
  standalone: true,
  imports: [CommonModule, FormsModule]
  })
export class CourseManagementComponent implements OnInit {
  readonly apiService = inject(ApiService);
  
  readonly courses = signal<Course[]>([]);
  readonly loading = signal(true);
  readonly showCreateModal = signal(false);
  readonly newCourse = signal<CreateCourseRequest>({ 
    title: '', 
    description: '' 
  });

  ngOnInit(): void {
    this.loadCourses();
  }

  loadCourses(): void {
    this.loading.set(true);
    this.apiService.getCourses().subscribe({
      next: (courses) => {
        this.courses.set(courses);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        // Mock data
        this.courses.set([
          { id: 1, title: 'Islamic Studies', description: 'Basic Islamic principles', teacher_id: 1, created_at: '2024-01-15' },
          { id: 2, title: 'Arabic Language', description: 'Learn Arabic fundamentals', teacher_id: 2, created_at: '2024-01-20' }
        ]);
      }
    });
  }

  createCourse(): void {
    this.apiService.createCourse(this.newCourse()).subscribe({
      next: () => {
        this.showCreateModal.set(false);
        this.newCourse.set({ title: '', description: '' });
        this.loadCourses();
      },
      error: (err) => console.error(err)
    });
  }

  editCourse(course: Course): void {
    console.log('Edit course:', course);
  }

  deleteCourse(course: Course): void {
    if (confirm(`Delete course "${course.title}"?`)) {
      this.apiService.deleteCourse(course.id).subscribe({
        next: () => this.loadCourses(),
        error: (err) => console.error(err)
      });
    }
  }

  updateTitle(title: string): void {
    this.newCourse.update(course => ({ ...course, title }));
  }

  updateDescription(description: string): void {
    this.newCourse.update(course => ({ ...course, description }));
  }
}
