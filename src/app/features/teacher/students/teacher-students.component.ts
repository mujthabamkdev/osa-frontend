import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  TeacherOverview,
  TeacherStudent,
  StudentReport,
  StudentProgressEntry,
} from '../../../core/models/teacher.models';
import { Course } from '../../../core/models/course.models';

@Component({
  selector: 'app-teacher-students',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teacher-students.component.html',
  styleUrl: './teacher-students.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherStudentsComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly loadingReport = signal(false);
  readonly error = signal<string | null>(null);
  readonly overview = signal<TeacherOverview | null>(null);
  readonly courses = signal<Course[]>([]);
  readonly students = signal<TeacherStudent[]>([]);
  readonly selectedCourseId = signal<number | 'all'>('all');
  readonly selectedStudent = signal<TeacherStudent | null>(null);
  readonly studentReport = signal<StudentReport | null>(null);

  readonly filteredStudents = computed(() => {
    const courseId = this.selectedCourseId();
    const allStudents = this.students();
    if (courseId === 'all') {
      return allStudents;
    }
    return allStudents.filter((student) => student.course_id === courseId);
  });

  readonly totalStudents = computed(() => this.overview()?.total_students ?? this.students().length);

  ngOnInit(): void {
    const courseFilter = this.route.snapshot.queryParamMap.get('course');
    if (courseFilter) {
      const parsed = Number(courseFilter);
      if (!Number.isNaN(parsed)) {
        this.selectedCourseId.set(parsed);
      }
    }
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      overview: this.apiService.getTeacherOverview(),
      courses: this.apiService.getTeacherCourses(),
      students: this.apiService.getTeacherStudents(),
    }).subscribe({
      next: ({ overview, courses, students }) => {
        this.overview.set(overview);
        this.courses.set(courses);
        this.students.set(students);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load teacher students', error);
        this.error.set(error?.error?.detail || 'Unable to load student list');
        this.loading.set(false);
      },
    });
  }

  onCourseChange(value: string): void {
    if (value === 'all') {
      this.selectedCourseId.set('all');
    } else {
      const parsed = Number(value);
      this.selectedCourseId.set(Number.isNaN(parsed) ? 'all' : parsed);
    }
  }

  viewStudentReport(student: TeacherStudent): void {
    this.selectedStudent.set(student);
    this.loadingReport.set(true);
    this.studentReport.set(null);

    this.apiService.getTeacherStudentReport(student.id).subscribe({
      next: (report) => {
        this.studentReport.set(report);
        this.loadingReport.set(false);
      },
      error: (error) => {
        console.error('Failed to load student report', error);
        this.error.set(error?.error?.detail || 'Unable to load student report');
        this.loadingReport.set(false);
      },
    });
  }

  closeReport(): void {
    this.selectedStudent.set(null);
    this.studentReport.set(null);
  }

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString();
  }

  progressStatus(entry: StudentProgressEntry): string {
    if (entry.completed) {
      return entry.score != null ? `Completed (${entry.score}%)` : 'Completed';
    }
    return 'In progress';
  }
}
