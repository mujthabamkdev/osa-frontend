import { Component, inject, signal, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Class } from '../../../core/models/school.models';
import { StudentProgress } from '../../../core/models/dashboard.models';

@Component({
  templateUrl: './student-courses.component.html',
  selector: 'app-student-courses',
  standalone: true,
  imports: [CommonModule],
  styleUrl: './student-courses.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentCoursesComponent implements OnInit {
  readonly apiService = inject(ApiService);
  readonly authService = inject(AuthService);
  readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly defaultCourseId = 1;

  readonly availableClasses = signal<Class[]>([]);
  readonly loading = signal(true);
  readonly activeClassId = signal<number | null>(null);
  readonly highestAccessibleYear = signal<number | null>(null);

  ngOnInit(): void {
    this.loadAvailableClasses();
  }

  loadAvailableClasses(): void {
    const currentUser = this.authService.user();
    if (!currentUser) {
      this.availableClasses.set([]);
      this.loading.set(false);
      this.activeClassId.set(null);
      this.highestAccessibleYear.set(null);
      return;
    }

    this.loading.set(true);

    forkJoin({
      classes: this.apiService.getClasses(this.defaultCourseId),
      enrollments: this.apiService.getEnrolledCourses(currentUser.id),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ classes, enrollments }) => {
          const sortedClasses = [...classes].sort((a, b) => a.year - b.year);
          this.availableClasses.set(sortedClasses);

          const enrolledCourse = this.findEnrollmentForCourse(enrollments, this.defaultCourseId);
          const activeClassId = this.resolveActiveClassId(enrolledCourse);
          this.activeClassId.set(activeClassId);

          const accessibleYear = this.resolveAccessibleYear(activeClassId, enrolledCourse, sortedClasses);
          this.highestAccessibleYear.set(accessibleYear);

          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading available classes:', error);
          this.availableClasses.set([]);
          this.activeClassId.set(null);
          this.highestAccessibleYear.set(null);
          this.loading.set(false);
        },
      });
  }

  viewClass(classId: number): void {
    const targetClass = this.availableClasses().find((cls) => cls.id === classId);
    if (!targetClass || this.isClassLocked(targetClass)) {
      return;
    }

    this.router.navigate(['/student/courses', classId]);
  }

  isClassActive(classItem: Class): boolean {
    return this.activeClassId() === classItem.id;
  }

  isClassAccessible(classItem: Class): boolean {
    const accessibleYear = this.highestAccessibleYear();
    if (accessibleYear === null) {
      return true;
    }
    return classItem.year <= accessibleYear;
  }

  isClassPrevious(classItem: Class): boolean {
    return this.isClassAccessible(classItem) && !this.isClassActive(classItem);
  }

  isClassLocked(classItem: Class): boolean {
    const accessibleYear = this.highestAccessibleYear();
    if (accessibleYear === null) {
      return false;
    }
    return classItem.year > accessibleYear;
  }

  classActionLabel(classItem: Class): string {
    if (this.isClassLocked(classItem)) {
      return 'Locked';
    }

    return this.isClassActive(classItem) ? 'Continue class' : 'Review class';
  }

  classStatusLabel(classItem: Class): string {
    if (this.isClassActive(classItem)) {
      return 'Active';
    }

    if (this.isClassAccessible(classItem)) {
      return 'Unlocked';
    }

    return 'Locked';
  }

  private findEnrollmentForCourse(enrollments: StudentProgress[], courseId: number): StudentProgress | undefined {
    return enrollments.find(
      (enrollment) => enrollment.course_id === courseId || enrollment.id === courseId
    );
  }

  private resolveActiveClassId(enrollment: StudentProgress | undefined): number | null {
    if (!enrollment) {
      return null;
    }

    if (enrollment.active_class && typeof enrollment.active_class.id === 'number') {
      return enrollment.active_class.id;
    }

    if (typeof enrollment.active_class_id === 'number') {
      return enrollment.active_class_id;
    }

    return null;
  }

  private resolveAccessibleYear(
    activeClassId: number | null,
    enrollment: StudentProgress | undefined,
    classes: Class[]
  ): number | null {
    if (enrollment?.active_class && typeof enrollment.active_class.year === 'number') {
      return enrollment.active_class.year;
    }

    if (activeClassId !== null) {
      const activeClass = classes.find((classItem) => classItem.id === activeClassId);
      if (activeClass) {
        return activeClass.year;
      }
    }

    if (typeof enrollment?.active_class_id === 'number') {
      const fallback = classes.find((classItem) => classItem.id === enrollment.active_class_id);
      if (fallback) {
        return fallback.year;
      }
    }

    if (enrollment && classes.length > 0) {
      return Math.min(...classes.map((classItem) => classItem.year));
    }

    return null;
  }
}
