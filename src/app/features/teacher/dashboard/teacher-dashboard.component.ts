import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import {
  TeacherOverview,
  TeacherStudent,
  TeacherLiveClass,
  Exam,
} from '../../../core/models/teacher.models';
import { Course } from '../../../core/models/course.models';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './teacher-dashboard.component.html',
  styleUrl: './teacher-dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherDashboardComponent implements OnInit {
  readonly authService = inject(AuthService);
  readonly apiService = inject(ApiService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly overview = signal<TeacherOverview | null>(null);
  readonly courses = signal<Course[]>([]);
  readonly exams = signal<Exam[]>([]);
  readonly liveClasses = signal<TeacherLiveClass[]>([]);
  readonly students = signal<TeacherStudent[]>([]);

  readonly totalStudents = computed(() => this.overview()?.total_students ?? 0);
  readonly totalSubjects = computed(() => this.overview()?.total_subjects ?? 0);
  readonly totalCourses = computed(() => this.overview()?.total_courses ?? 0);
  readonly pendingQuestions = computed(() => this.overview()?.pending_questions ?? 0);
  readonly upcomingLiveClasses = computed(() =>
    this.liveClasses()
      .filter((liveClass) => this.isUpcoming(liveClass.scheduled_date))
      .sort((a, b) => this.toTimestamp(a.scheduled_date) - this.toTimestamp(b.scheduled_date))
      .slice(0, 5)
  );

  readonly recentExams = computed(() =>
    this.exams()
      .slice()
      .sort((a, b) => this.toTimestamp(b.created_at) - this.toTimestamp(a.created_at))
      .slice(0, 5)
  );

  readonly courseStudentCounts = computed(() => {
    const counts = new Map<number, number>();
    for (const student of this.students()) {
      counts.set(student.course_id, (counts.get(student.course_id) ?? 0) + 1);
    }
    return counts;
  });

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      overview: this.apiService.getTeacherOverview(),
      courses: this.apiService.getTeacherCourses(),
      exams: this.apiService.getTeacherExams(),
      liveClasses: this.apiService.getTeacherLiveClasses(),
      students: this.apiService.getTeacherStudents(),
    })
      .pipe(
        catchError((error) => {
          console.error('Failed to load teacher dashboard data', error);
          this.error.set(error?.error?.detail || 'Failed to load dashboard data');
          this.loading.set(false);
          throw error;
        })
      )
      .subscribe(({ overview, courses, exams, liveClasses, students }) => {
        this.overview.set(overview);
        this.courses.set(courses);
        this.exams.set(exams);
        this.liveClasses.set(liveClasses);
        this.students.set(students);
        this.loading.set(false);
      });
  }

  refreshData(): void {
    this.loadDashboard();
  }

  logout(): void {
    this.authService.logout();
  }

  courseTitle(courseId: number): string {
    const course = this.courses().find((item) => item.id === courseId);
    return course?.title ?? 'Course';
  }

  private isUpcoming(dateString: string | null): boolean {
    if (!dateString) return false;
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return false;
    return date.getTime() >= Date.now() - 24 * 60 * 60 * 1000;
  }

  private toTimestamp(value: string | null): number {
    if (!value) return 0;
    const date = new Date(value);
    return date.getTime() || 0;
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return 'TBA';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'TBA';
    return date.toLocaleString();
  }
}
