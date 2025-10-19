import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  FormGroup,
  FormControl,
} from '@angular/forms';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { Course } from '../../../core/models/course.models';
import {
  Exam,
  ExamCreateRequest,
  ExamResult,
  ExamResultPayload,
  TeacherStudent,
  TeacherSubject,
} from '../../../core/models/teacher.models';

interface ExamResultForm {
  include: FormControl<boolean>;
  score: FormControl<number | null>;
  maxScore: FormControl<number | null>;
  status: FormControl<string | null>;
  feedback: FormControl<string | null>;
}

interface ResultRow {
  student: TeacherStudent;
  form: FormGroup<ExamResultForm>;
  existingResult: ExamResult | null;
}

@Component({
  selector: 'app-teacher-exams',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './teacher-exams.component.html',
  styleUrl: './teacher-exams.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherExamsComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly exams = signal<Exam[]>([]);
  readonly courses = signal<Course[]>([]);
  readonly subjects = signal<TeacherSubject[]>([]);
  readonly savingResults = signal(false);
  readonly resultsError = signal<string | null>(null);
  readonly resultsSuccess = signal<string | null>(null);
  readonly selectedExamId = signal<number | null>(null);
  readonly resultRows = signal<ResultRow[]>([]);
  readonly resultsLoadedAt = signal<string | null>(null);

  readonly createExamForm = this.fb.group({
    title: this.fb.nonNullable.control('', { validators: [Validators.required, Validators.maxLength(120)] }),
    description: this.fb.control<string>(''),
    course_id: this.fb.control<number | null>(null, { validators: [Validators.required] }),
    subject_id: this.fb.control<number | null>(null),
    scheduled_date: this.fb.control<string | null>(null),
    duration_minutes: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
    max_score: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
  });

  readonly filteredSubjects = computed(() => {
    const courseId = this.createExamForm.controls.course_id.value;
    if (!courseId) {
      return [];
    }
    return this.subjects().filter((subject) => subject.course_id === courseId);
  });

  readonly selectedExam = computed(() => {
    const examId = this.selectedExamId();
    if (!examId) {
      return null;
    }
    return this.exams().find((exam) => exam.id === examId) ?? null;
  });

  readonly resultsAvailable = computed(() => this.resultRows().some((row) => row.existingResult !== null));

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      courses: this.apiService.getTeacherCourses(),
      subjects: this.apiService.getTeacherSubjects(),
      exams: this.apiService.getTeacherExams(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ courses, subjects, exams }) => {
          this.courses.set(courses);
          this.subjects.set(subjects);
          this.exams.set(exams);
        },
        error: (error) => {
          console.error('Failed to load exams data', error);
          this.error.set(error?.error?.detail || 'Unable to load exams data');
        },
      });
  }

  onCourseChange(): void {
    const form = this.createExamForm;
    if (form.controls.subject_id.value) {
      const match = this.filteredSubjects().some((subject) => subject.id === form.controls.subject_id.value);
      if (!match) {
        form.controls.subject_id.setValue(null);
      }
    }
  }

  createExam(): void {
    if (this.createExamForm.invalid) {
      this.createExamForm.markAllAsTouched();
      return;
    }

    const payload = this.extractExamPayload();
    this.loading.set(true);
    this.error.set(null);

    this.apiService
      .createExam(payload)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (exam) => {
          this.exams.set([exam, ...this.exams()]);
          this.createExamForm.reset({
            title: '',
            description: '',
            course_id: null,
            subject_id: null,
            scheduled_date: null,
            duration_minutes: null,
            max_score: null,
          });
          this.selectedExamId.set(exam.id);
          this.loadExamResults(exam);
        },
        error: (error) => {
          console.error('Failed to create exam', error);
          this.error.set(error?.error?.detail || 'Unable to create exam');
        },
      });
  }

  selectExam(exam: Exam): void {
    if (this.selectedExamId() === exam.id) {
      return;
    }
    this.selectedExamId.set(exam.id);
    this.loadExamResults(exam);
  }

  reloadSelectedExam(): void {
    const exam = this.selectedExam();
    if (!exam) {
      return;
    }
    this.loadExamResults(exam, true);
  }

  private loadExamResults(exam: Exam, forceRefresh = false): void {
    this.savingResults.set(false);
    this.resultsError.set(null);
    if (!forceRefresh && this.resultsLoadedAt() && this.selectedExamId() === exam.id) {
      return;
    }

    this.savingResults.set(true);

    forkJoin({
      students: this.apiService.getTeacherStudentsByCourse(exam.course_id),
      results: this.apiService.getExamResults(exam.id),
    })
      .pipe(finalize(() => this.savingResults.set(false)))
      .subscribe({
        next: ({ students, results }) => {
          const rows = students.map((student) => {
            const existingResult = results.find((result) => result.student_id === student.id) ?? null;
            return {
              student,
              existingResult,
              form: this.buildResultForm(existingResult),
            } satisfies ResultRow;
          });
          this.resultRows.set(rows);
          this.resultsLoadedAt.set(new Date().toISOString());
        },
        error: (error) => {
          console.error('Failed to load exam results', error);
          this.resultsError.set(error?.error?.detail || 'Unable to load exam results');
        },
      });
  }

  private buildResultForm(existingResult: ExamResult | null): FormGroup<ExamResultForm> {
    return this.fb.group({
      include: this.fb.nonNullable.control(existingResult !== null),
      score: this.fb.control<number | null>(existingResult?.score ?? null, {
        validators: [Validators.min(0)],
      }),
      maxScore: this.fb.control<number | null>(existingResult?.max_score ?? null, {
        validators: [Validators.min(0)],
      }),
      status: this.fb.control<string | null>(existingResult?.status ?? null),
      feedback: this.fb.control<string | null>(existingResult?.feedback ?? null, {
        validators: [Validators.maxLength(500)],
      }),
    });
  }

  saveResults(): void {
    const exam = this.selectedExam();
    if (!exam) {
      return;
    }

    const rows = this.resultRows();
    if (rows.length === 0) {
      return;
    }

    const invalidRow = rows.find((row) => row.form.invalid && row.form.value.include);
    if (invalidRow) {
      rows.forEach((row) => row.form.markAllAsTouched());
      return;
    }

    const payload: ExamResultPayload[] = rows
      .filter((row) => row.form.controls.include.value)
      .map((row) => ({
        student_id: row.student.id,
        score: row.form.controls.score.value ?? 0,
        max_score: row.form.controls.maxScore.value,
        status: row.form.controls.status.value ?? undefined,
        feedback: row.form.controls.feedback.value ?? undefined,
        published_at: new Date().toISOString(),
      }));

    if (payload.length === 0) {
      this.resultsError.set('Select at least one student to publish results');
      return;
    }

    this.savingResults.set(true);
    this.resultsError.set(null);
    this.resultsSuccess.set(null);

    this.apiService
      .saveExamResults(exam.id, payload)
      .pipe(finalize(() => this.savingResults.set(false)))
      .subscribe({
        next: (results) => {
          const refreshedRows = this.resultRows().map((row) => {
            const updated = results.find((result) => result.student_id === row.student.id);
            return {
              student: row.student,
              existingResult: updated ?? row.existingResult,
              form: this.buildResultForm(updated ?? row.existingResult),
            } satisfies ResultRow;
          });
          this.resultRows.set(refreshedRows);
          this.resultsSuccess.set('Results published successfully');
          this.resultsLoadedAt.set(new Date().toISOString());
        },
        error: (error) => {
          console.error('Failed to save exam results', error);
          this.resultsError.set(error?.error?.detail || 'Unable to publish results');
        },
      });
  }

  formatDate(dateString: string | null): string {
    if (!dateString) {
      return 'Not scheduled';
    }
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return 'Not scheduled';
    }
    return date.toLocaleString();
  }

  examCourseTitle(exam: Exam): string {
    return this.courses().find((course) => course.id === exam.course_id)?.title ?? 'Course';
  }

  private extractExamPayload(): ExamCreateRequest {
    const raw = this.createExamForm.value;
    return {
      title: raw.title!.trim(),
      description: raw.description?.trim() || undefined,
      course_id: raw.course_id!,
      subject_id: raw.subject_id || undefined,
      scheduled_date: raw.scheduled_date || undefined,
      duration_minutes: raw.duration_minutes || undefined,
      max_score: raw.max_score || undefined,
    } satisfies ExamCreateRequest;
  }
}
