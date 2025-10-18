import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Class } from '../../../core/models/school.models';
import { Enrollment } from '../../../core/models/enrollment.models';

@Component({
  templateUrl: './student-courses.component.html',
  selector: 'app-student-courses',
  standalone: true,
  imports: [CommonModule],
})
export class StudentCoursesComponent implements OnInit {
  readonly apiService = inject(ApiService);
  readonly authService = inject(AuthService);
  readonly router = inject(Router);

  readonly availableClasses = signal<Class[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.loadAvailableClasses();
  }

  loadAvailableClasses(): void {
    this.loading.set(true);
    // For now, load classes from course 1 (Islamic Studies Fundamentals)
    // TODO: In the future, this should show classes from all courses or based on some criteria
    this.apiService.getClasses(1).subscribe({
      next: (classes) => {
        console.log('Available classes:', classes);
        this.availableClasses.set(classes);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading available classes:', error);
        this.loading.set(false);
        this.availableClasses.set([]);
      },
    });
  }

  viewClass(classId: number): void {
    this.router.navigate(['/student/courses', classId]);
  }
}
