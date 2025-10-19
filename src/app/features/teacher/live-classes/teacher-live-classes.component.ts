import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { Course } from '../../../core/models/course.models';
import { TeacherLiveClass, LiveClassCreateRequest } from '../../../core/models/teacher.models';

@Component({
  selector: 'app-teacher-live-classes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './teacher-live-classes.component.html',
  styleUrl: './teacher-live-classes.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherLiveClassesComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly courses = signal<Course[]>([]);
  readonly liveClasses = signal<TeacherLiveClass[]>([]);
  readonly scheduling = signal(false);
  readonly successMessage = signal<string | null>(null);

  readonly scheduleClassForm = this.fb.group({
    course_id: this.fb.control<number | null>(null, { validators: [Validators.required] }),
    title: this.fb.nonNullable.control('', { validators: [Validators.required, Validators.maxLength(160)] }),
    description: this.fb.control<string>(''),
    scheduled_date: this.fb.control<string | null>(null, { validators: [Validators.required] }),
    start_time: this.fb.control<string | null>(null, { validators: [Validators.required] }),
    end_time: this.fb.control<string | null>(null, { validators: [Validators.required] }),
    meeting_link: this.fb.control<string>(''),
  });

  readonly upcomingClasses = computed(() =>
    this.liveClasses()
      .filter((item) => this.isUpcoming(item))
      .sort((a, b) => this.toTimestamp(a.scheduled_date, a.start_time) - this.toTimestamp(b.scheduled_date, b.start_time))
  );

  readonly pastClasses = computed(() =>
    this.liveClasses()
      .filter((item) => !this.isUpcoming(item))
      .sort((a, b) => this.toTimestamp(b.scheduled_date, b.start_time) - this.toTimestamp(a.scheduled_date, a.start_time))
  );

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService
      .getTeacherCourses()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (courses) => this.courses.set(courses),
        error: (error) => {
          console.error('Failed to load courses', error);
          this.error.set(error?.error?.detail || 'Unable to load courses');
        },
      });

    this.refreshLiveClasses();
  }

  refreshLiveClasses(): void {
    this.apiService.getTeacherLiveClasses().subscribe({
      next: (classes) => this.liveClasses.set(classes),
      error: (error) => {
        console.error('Failed to load live classes', error);
        this.error.set(error?.error?.detail || 'Unable to load live classes');
      },
    });
  }

  scheduleClass(): void {
    if (this.scheduleClassForm.invalid) {
      this.scheduleClassForm.markAllAsTouched();
      return;
    }

    const payload = this.extractPayload();
    this.scheduling.set(true);
    this.error.set(null);
    this.successMessage.set(null);

    this.apiService
      .scheduleLiveClass(payload)
      .pipe(finalize(() => this.scheduling.set(false)))
      .subscribe({
        next: (liveClass) => {
          this.liveClasses.set([liveClass, ...this.liveClasses()]);
          this.successMessage.set('Live class scheduled successfully');
          this.scheduleClassForm.reset({
            course_id: null,
            title: '',
            description: '',
            scheduled_date: null,
            start_time: null,
            end_time: null,
            meeting_link: '',
          });
        },
        error: (error) => {
          console.error('Failed to schedule live class', error);
          this.error.set(error?.error?.detail || 'Unable to schedule live class');
        },
      });
  }

  courseTitle(courseId: number): string {
    return this.courses().find((course) => course.id === courseId)?.title ?? 'Course';
  }

  formatDate(dateString: string): string {
    if (!dateString) {
      return 'TBA';
    }
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return 'TBA';
    }
    return date.toLocaleDateString();
  }

  formatTime(timeString: string | null): string {
    if (!timeString) {
      return '—';
    }
    return timeString.slice(0, 5);
  }

  private extractPayload(): LiveClassCreateRequest {
    const raw = this.scheduleClassForm.value;
    return {
      course_id: raw.course_id!,
      title: raw.title!.trim(),
      description: raw.description?.trim() || undefined,
      scheduled_date: raw.scheduled_date!,
      start_time: raw.start_time!,
      end_time: raw.end_time!,
      meeting_link: raw.meeting_link?.trim() || undefined,
    } satisfies LiveClassCreateRequest;
  }

  private isUpcoming(item: TeacherLiveClass): boolean {
    return this.toTimestamp(item.scheduled_date, item.start_time) >= Date.now() - 30 * 60 * 1000;
  }

  private toTimestamp(date: string, time: string | null): number {
    const parsed = new Date(`${date}T${time ?? '00:00'}`);
    return parsed.getTime() || 0;
  }
}
