// src/app/features/teacher/courses/course-management.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Course, CreateCourseRequest } from '../../../core/models/course.models';

@Component({
  templateUrl: './course-management.component.html',
  selector: 'app-teacher-course-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class TeacherCourseManagementComponent implements OnInit {
  readonly apiService = inject(ApiService);
  readonly authService = inject(AuthService);

  readonly myCourses = signal<Course[]>([]);
  readonly loading = signal(true);
  readonly showCreateModal = signal(false);
  readonly newCourse = signal<CreateCourseRequest>({
    title: '',
    description: '',
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
          {
            id: 1,
            title: 'Islamic History',
            description: 'Comprehensive Islamic history course',
            teacher_id: 1,
            created_at: '2024-01-15',
          },
        ]);
      },
    });
  }

  createCourse(): void {
    this.apiService.createCourse(this.newCourse()).subscribe({
      next: () => {
        this.showCreateModal.set(false);
        this.newCourse.set({ title: '', description: '' });
        this.loadMyCourses();
      },
      error: (err) => console.error(err),
    });
  }

  manageCourse(course: Course): void {
    console.log('Manage course:', course);
  }

  viewStudents(course: Course): void {
    console.log('View students for course:', course);
  }

  updateTitle(title: string): void {
    this.newCourse.update((course) => ({ ...course, title }));
  }

  updateDescription(description: string): void {
    this.newCourse.update((course) => ({ ...course, description }));
  }
}
