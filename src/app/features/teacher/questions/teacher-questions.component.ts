import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup, FormControl } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { Course, CourseDetails, CourseSubject as ApiCourseSubject, CourseLesson as ApiCourseLesson } from '../../../core/models/course.models';
import { LessonQuestion } from '../../../core/models/teacher.models';

interface TeacherCourseLesson {
  id: number;
  title: string;
  description: string | null;
  scheduled_date: string | null;
}

interface TeacherCourseSubject {
  id: number;
  name: string;
  lessons: TeacherCourseLesson[];
}

@Component({
  selector: 'app-teacher-questions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './teacher-questions.component.html',
  styleUrl: './teacher-questions.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherQuestionsComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  readonly loadingCourses = signal(false);
  readonly loadingQuestions = signal(false);
  readonly error = signal<string | null>(null);
  readonly questionError = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly courses = signal<Course[]>([]);
  readonly subjects = signal<TeacherCourseSubject[]>([]);
  readonly selectedCourseId = signal<number | null>(null);
  readonly selectedSubjectId = signal<number | null>(null);
  readonly selectedLessonId = signal<number | null>(null);
  readonly questions = signal<LessonQuestion[]>([]);
  readonly filter = signal<'all' | 'unanswered'>('unanswered');

  private readonly answerForms = new Map<number, FormGroup<{ answer: FormControl<string> }>>();

  readonly lessonsForSubject = computed(() => {
    const subjectId = this.selectedSubjectId();
    if (!subjectId) {
      return [];
    }
    return this.subjects().find((subject) => subject.id === subjectId)?.lessons ?? [];
  });

  readonly selectedLesson = computed(() => {
    const lessonId = this.selectedLessonId();
    if (!lessonId) {
      return null;
    }
    return this.lessonsForSubject().find((lesson) => lesson.id === lessonId) ?? null;
  });

  readonly filteredQuestions = computed(() => {
    const filter = this.filter();
    if (filter === 'unanswered') {
      return this.questions().filter((question) => !question.answer);
    }
    return this.questions();
  });

  readonly pendingCount = computed(() => this.questions().filter((question) => !question.answer).length);

  ngOnInit(): void {
    this.loadCourses();
  }

  loadCourses(): void {
    this.loadingCourses.set(true);
    this.error.set(null);

    this.apiService
      .getTeacherCourses()
      .pipe(finalize(() => this.loadingCourses.set(false)))
      .subscribe({
        next: (courses) => {
          this.courses.set(courses);
          if (courses.length > 0) {
            this.selectCourse(courses[0].id);
          }
        },
        error: (error) => {
          console.error('Failed to load courses', error);
          this.error.set(error?.error?.detail || 'Unable to load courses');
        },
      });
  }

  selectCourse(courseId: number): void {
    if (this.selectedCourseId() === courseId) {
      return;
    }

    this.selectedCourseId.set(courseId);
    this.subjects.set([]);
    this.selectedSubjectId.set(null);
    this.selectedLessonId.set(null);
    this.questions.set([]);
    this.filter.set('unanswered');
    this.answerForms.clear();
    this.loadCourseStructure(courseId);
  }

  onCourseChange(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    if (!Number.isNaN(value) && value > 0) {
      this.selectCourse(value);
    }
  }

  selectSubject(subjectId: number): void {
    if (this.selectedSubjectId() === subjectId) {
      return;
    }
    this.selectedSubjectId.set(subjectId);
    const lessons = this.lessonsForSubject();
    const firstLesson = lessons[0]?.id ?? null;
    this.selectedLessonId.set(firstLesson);
    this.questions.set([]);
    this.answerForms.clear();
    if (firstLesson) {
      this.loadQuestions(firstLesson);
    }
  }

  onSubjectChange(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    if (!Number.isNaN(value) && value > 0) {
      this.selectSubject(value);
    }
  }

  selectLesson(lessonId: number): void {
    if (this.selectedLessonId() === lessonId) {
      return;
    }
    this.selectedLessonId.set(lessonId);
    this.questions.set([]);
    this.answerForms.clear();
    this.loadQuestions(lessonId);
  }

  onLessonChange(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    if (!Number.isNaN(value) && value > 0) {
      this.selectLesson(value);
    }
  }

  changeFilter(value: 'all' | 'unanswered'): void {
    this.filter.set(value);
  }

  getAnswerForm(questionId: number): FormGroup<{ answer: FormControl<string> }> {
    let form = this.answerForms.get(questionId);
    if (!form) {
      const question = this.questions().find((item) => item.id === questionId);
      form = this.fb.group({
        answer: this.fb.nonNullable.control(question?.answer ?? '', [Validators.required, Validators.maxLength(1000)]),
      });
      this.answerForms.set(questionId, form);
    }
    return form;
  }

  saveAnswer(question: LessonQuestion): void {
    const lessonId = this.selectedLessonId();
    if (!lessonId) {
      return;
    }

    const form = this.getAnswerForm(question.id);
    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }

    const answer = form.controls.answer.value.trim();
    if (!answer) {
      form.controls.answer.setErrors({ required: true });
      return;
    }

    this.loadingQuestions.set(true);
    this.questionError.set(null);
    this.successMessage.set(null);

    this.apiService
      .answerLessonQuestion(lessonId, question.id, { answer })
      .pipe(finalize(() => this.loadingQuestions.set(false)))
      .subscribe({
        next: () => {
          this.successMessage.set('Answer published successfully');
          this.loadQuestions(lessonId, true);
        },
        error: (error) => {
          console.error('Failed to publish answer', error);
          this.questionError.set(error?.error?.detail || 'Unable to publish answer');
        },
      });
  }

  refreshQuestions(): void {
    const lessonId = this.selectedLessonId();
    if (!lessonId) {
      return;
    }
    this.loadQuestions(lessonId, true);
  }

  formatDate(dateString: string | null): string {
    if (!dateString) {
      return 'No schedule';
    }
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return 'No schedule';
    }
    return date.toLocaleString();
  }

  private loadCourseStructure(courseId: number): void {
    this.loadingCourses.set(true);
    this.error.set(null);

    this.apiService
      .getCourseDetails(courseId)
      .pipe(finalize(() => this.loadingCourses.set(false)))
      .subscribe({
        next: (course: CourseDetails) => {
          const subjects: TeacherCourseSubject[] = (course?.subjects ?? []).map(
            (subject: ApiCourseSubject): TeacherCourseSubject => ({
              id: subject.id,
              name: subject.name,
              lessons: (subject.lessons ?? []).map(
                (lesson: ApiCourseLesson): TeacherCourseLesson => ({
                  id: lesson.id,
                  title: lesson.title,
                  description: lesson.description ?? null,
                  scheduled_date: lesson.scheduled_date ?? null,
                })
              ),
            })
          );

          this.subjects.set(subjects);
          const firstSubject = subjects[0]?.id ?? null;
          this.selectedSubjectId.set(firstSubject);
          const firstLesson = subjects[0]?.lessons?.[0]?.id ?? null;
          this.selectedLessonId.set(firstLesson ?? null);

          if (firstLesson) {
            this.loadQuestions(firstLesson);
          } else {
            this.questions.set([]);
          }
        },
        error: (error) => {
          console.error('Failed to load course structure', error);
          this.error.set(error?.error?.detail || 'Unable to load course details');
        },
      });
  }

  private loadQuestions(lessonId: number, silent = false): void {
    if (!silent) {
      this.loadingQuestions.set(true);
    }
    this.questionError.set(null);
    this.successMessage.set(null);

    this.apiService
      .getLessonQuestionsForTeacher(lessonId)
      .pipe(finalize(() => this.loadingQuestions.set(false)))
      .subscribe({
        next: (questions) => {
          this.questions.set(questions);
          this.answerForms.clear();
        },
        error: (error) => {
          console.error('Failed to load lesson questions', error);
          this.questionError.set(error?.error?.detail || 'Unable to load questions');
        },
      });
  }
}
