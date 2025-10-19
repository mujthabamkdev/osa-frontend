import {
  Component,
  inject,
  signal,
  OnInit,
  computed,
  DestroyRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Note } from '../../../core/models/dashboard.models';
import { LessonQuestion } from '../../../core/models/teacher.models';

// Types
interface Teacher {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

interface Attachment {
  id: number;
  title: string;
  file_type: string;
  file_url: string;
  source: string;
  description: string;
}

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct_answer: number;
  order: number;
}

interface Quiz {
  id: number;
  title: string;
  description: string;
  passing_score: number;
  questions: QuizQuestion[];
}

interface LessonProgress {
  completed: boolean;
  quiz_score: number | null;
  completed_at: string | null;
}

interface Lesson {
  id: number;
  title: string;
  description: string;
  order: number;
  subject_id: number;
  subject_name: string;
  attachments: Attachment[];
  quiz: Quiz | null;
  progress: LessonProgress | null;
}

interface Subject {
  id: number;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

interface DaySchedule {
  date: string;
  dateObj: Date;
  lessons: Lesson[];
}

interface LiveClass {
  id: number;
  title: string;
  description: string;
  chapter_id: number | null;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  meeting_link: string | null;
}

interface CourseDetails {
  id: number;
  title: string;
  description: string;
  teacher_id: number;
  teacher?: Teacher;
  created_at: string;
  subjects: Subject[];
  schedule: DaySchedule[];
  live_classes: LiveClass[];
}

@Component({
  selector: 'app-class-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './class-details.component.html',
  styleUrl: './class-details.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private destroyRef = inject(DestroyRef);
  private fb = inject(NonNullableFormBuilder);
  private sanitizer = inject(DomSanitizer);

  // Signals
  loading = signal(false);
  error = signal<string | null>(null);
  courseDetails = signal<CourseDetails | null>(null);
  selectedLesson = signal<Lesson | null>(null);
  viewMode = signal<'calendar' | 'subject'>('calendar');

  collapsedSubjects = signal<Map<number, boolean>>(new Map());
  notes = signal<Note[]>([]);
  notesLoading = signal(false);
  notesError = signal<string | null>(null);
  lessonQuestions = signal<LessonQuestion[]>([]);
  questionsLoading = signal(false);
  questionsError = signal<string | null>(null);
  questionSubmitting = signal(false);
  noteSubmitting = signal(false);
  selectedVideoIndex = signal(0);
  trustedVideoUrls = signal<Record<number, SafeResourceUrl>>({});
  quizAttempt = signal<Record<number, number | null>>({});
  quizSubmitted = signal(false);
  quizResult = signal<{ score: number; correct: number; total: number } | null>(null);

  questionForm = this.fb.group({
    question: ['', [Validators.required, Validators.minLength(5)]],
    isAnonymous: [false],
  });

  noteForm = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(120)]],
    content: ['', [Validators.required, Validators.maxLength(2000)]],
  });

  courseNotes = computed(() => {
    const courseId = this.courseDetails()?.id;
    if (!courseId) {
      return [] as Note[];
    }
    return this.notes().filter((note) => note.course_id === courseId);
  });

  lessonVideoAttachments = computed(() =>
    this.selectedLesson()?.attachments.filter((attachment) => attachment.file_type === 'video') || []
  );

  lessonDocumentAttachments = computed(() =>
    this.selectedLesson()?.attachments.filter((attachment) => attachment.file_type !== 'video') || []
  );

  selectedVideoAttachment = computed(() => {
    const videos = this.lessonVideoAttachments();
    const index = this.selectedVideoIndex();
    return videos[index] || null;
  });

  selectedVideoId = computed(() => this.selectedVideoAttachment()?.id ?? null);

  selectedVideoTrustedUrl = computed(() => {
    const attachment = this.selectedVideoAttachment();
    if (!attachment) {
      return null;
    }
    return this.trustedVideoUrls()[attachment.id] ?? null;
  });

  ngOnInit(): void {
    const courseId = this.route.snapshot.params['id'];
    if (courseId) {
      this.loadCourseDetails(+courseId);
    }
  }

  loadCourseDetails(courseId: number): void {
    this.loading.set(true);
    this.error.set(null);
    console.log('Loading course details for id:', courseId);
    this.apiService
      .getCourseDetails(courseId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          console.log('Course details request completed, setting loading to false');
          this.loading.set(false);
        })
      )
      .subscribe({
        next: (rawData: any) => {
          console.log('Course details API response:', rawData);

          // Transform backend data structure to match frontend expectations
          const data = this.transformCourseData(rawData);
          console.log('Course details transformed:', data);

          this.courseDetails.set(data);
          this.loadCourseNotes();

          // Auto-select first lesson if available
          const firstScheduledDay = data.schedule?.[0];
          if (firstScheduledDay && firstScheduledDay.lessons.length > 0) {
            this.selectLesson(firstScheduledDay.lessons[0]);
          }
        },
        error: (error) => {
          console.error('Failed to load course details:', error);
          this.error.set('Failed to load course details. Please try again.');
        },
      });
  }

  private transformCourseData(rawData: any): CourseDetails {
    console.log('Transforming course data...', rawData);

    const subjects: Subject[] = [];
    const schedule: DaySchedule[] = [];
    const lessonMap = new Map<number, Lesson>();

    // Process subjects directly from course (new structure)
    if (rawData.subjects && Array.isArray(rawData.subjects)) {
      console.log('Processing subjects structure...');

      for (const subject of rawData.subjects) {
        const lessons: Lesson[] = [];

        // Transform lessons from new structure
        if (subject.lessons && Array.isArray(subject.lessons)) {
          for (const lessonData of subject.lessons) {
            const lesson: Lesson = {
              id: lessonData.id || Math.random(),
              title: lessonData.title || 'Untitled Lesson',
              description: lessonData.description || '',
              order: lessonData.order_in_course || 0,
              subject_id: subject.id,
              subject_name: subject.name || 'Subject',
              attachments: (lessonData.contents || []).map((content: any, idx: number) => ({
                id: content.id || idx,
                title: content.title || 'Content',
                file_type: content.content_type || 'document',
                file_url: content.content_url || '',
                source: content.source || 'upload',
                description: content.content_text || '',
              })),
              quiz: lessonData.quiz || null,
              progress: lessonData.progress || null,
            };
            lessons.push(lesson);
            lessonMap.set(lesson.id, lesson);
          }
        }

        subjects.push({
          id: subject.id,
          title: subject.name || 'Untitled Subject',
          description: subject.description || '',
          order: subject.order_in_course || 0,
          lessons: lessons.sort((a, b) => a.order - b.order),
        });
      }
    }

    // Build daily schedule from lessons (new structure)
    if (subjects.length > 0) {
      console.log('Building daily schedule from lessons...');

      const dayMap = new Map<string, Lesson[]>();

      // Collect all lessons with their scheduled dates
      for (const subject of subjects) {
        for (const lesson of subject.lessons) {
          // Find the lesson data from the API response to get scheduled_date
          const lessonData = rawData.subjects
            .find((s: any) => s.id === subject.id)?.lessons
            .find((l: any) => l.id === lesson.id);

          if (lessonData && lessonData.scheduled_date) {
            const dateStr = this.extractDate(lessonData.scheduled_date);

            if (!dayMap.has(dateStr)) {
              dayMap.set(dateStr, []);
            }
            dayMap.get(dateStr)!.push(lesson);
          }
        }
      }

      // Convert map to sorted schedule array
      const sortedDates = Array.from(dayMap.keys()).sort();
      for (const dateStr of sortedDates) {
        schedule.push({
          date: dateStr,
          dateObj: new Date(dateStr),
          lessons: dayMap.get(dateStr) || [],
        });
      }
    }

    const result: CourseDetails = {
      id: rawData.id,
      title: rawData.title,
      description: rawData.description,
      teacher_id: rawData.teacher_id,
      teacher: rawData.teacher,
      created_at: rawData.created_at,
      subjects,
      schedule,
      live_classes: rawData.live_classes || [],
    };

    console.log(
      'Transformation complete. Subjects:',
      subjects.length,
      'Schedule days:',
      schedule.length
    );
    return result;
  }

  private extractDate(dateString: string): string {
    // Extract just the date part (YYYY-MM-DD)
    return dateString.split('T')[0];
  }

  selectLesson(lesson: Lesson): void {
    this.selectedLesson.set(lesson);
    this.selectedVideoIndex.set(0);
    this.trustedVideoUrls.set(this.buildVideoUrlMap(lesson));
    this.quizSubmitted.set(false);
    this.quizResult.set(null);
    this.initializeQuizAttempt(lesson);
    this.questionForm.reset({ question: '', isAnonymous: false });
    this.fetchLessonQuestions(lesson.id);
  }

  isActiveLessonId(lessonId: number): boolean {
    return this.selectedLesson()?.id === lessonId;
  }

  toggleSubject(subjectId: number): void {
    const currentMap = this.collapsedSubjects();
    const newMap = new Map(currentMap);
    newMap.set(subjectId, !this.isSubjectCollapsed(subjectId));
    this.collapsedSubjects.set(newMap);
  }

  isSubjectCollapsed(subjectId: number): boolean {
    return this.collapsedSubjects().get(subjectId) ?? true;
  }

  formatDayHeader(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/student/courses']);
  }

  refreshCourse(): void {
    if (this.courseDetails()) {
      this.loadCourseDetails(this.courseDetails()!.id);
    }
  }

  setSelectedVideoIndex(index: number): void {
    this.selectedVideoIndex.set(index);
  }

  isIframeVideo(attachment: Attachment): boolean {
    const lowerUrl = (attachment.file_url || '').toLowerCase();
    return lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be') || lowerUrl.includes('vimeo.com');
  }

  submitQuestion(): void {
    const lesson = this.selectedLesson();
    if (!lesson) {
      return;
    }

    if (this.questionForm.invalid) {
      this.questionForm.markAllAsTouched();
      return;
    }

    const value = this.questionForm.getRawValue();
    this.questionSubmitting.set(true);
    this.questionsError.set(null);

    this.apiService
      .askLessonQuestion(lesson.id, {
        question: value.question,
        is_anonymous: value.isAnonymous ?? false,
      })
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.questionSubmitting.set(false)))
      .subscribe({
        next: (question) => {
          this.lessonQuestions.update((current) => [question, ...current]);
          this.questionForm.reset({ question: '', isAnonymous: false });
        },
        error: (err) => {
          console.error('Failed to submit question', err);
          this.questionsError.set('Could not submit your question. Please try again.');
        },
      });
  }

  saveNote(): void {
    const lesson = this.selectedLesson();
    const course = this.courseDetails();
    const user = this.authService.user();
    if (!lesson || !course || !user) {
      return;
    }

    if (this.noteForm.invalid) {
      this.noteForm.markAllAsTouched();
      return;
    }

    const value = this.noteForm.getRawValue();
    this.noteSubmitting.set(true);
    this.notesError.set(null);

    this.apiService
      .createNote(user.id, value.title, value.content, course.id)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.noteSubmitting.set(false)))
      .subscribe({
        next: (created) => {
          const noteWithCourse = {
            ...created,
            course_id: created?.course_id ?? course.id,
          } as Note;
          this.notes.update((current) => [noteWithCourse, ...current]);
          this.noteForm.reset({ title: '', content: '' });
        },
        error: (err) => {
          console.error('Failed to create note', err);
          this.notesError.set('Could not save your note.');
        },
      });
  }

  selectQuizOption(questionId: number, optionIndex: number): void {
    this.quizAttempt.update((current) => ({ ...current, [questionId]: optionIndex }));
  }

  submitQuiz(): void {
    const lesson = this.selectedLesson();
    if (!lesson?.quiz) {
      return;
    }

    const answers = this.quizAttempt();
    const questions = lesson.quiz.questions || [];
    if (questions.some((q) => answers[q.id] === undefined || answers[q.id] === null)) {
      this.quizResult.set(null);
      this.quizSubmitted.set(true);
      return;
    }

    let correct = 0;
    for (const question of questions) {
      if (answers[question.id] === question.correct_answer) {
        correct += 1;
      }
    }

    const total = questions.length || 1;
    const score = Math.round((correct / total) * 100);
    this.quizResult.set({ score, correct, total });
    this.quizSubmitted.set(true);
  }

  private loadCourseNotes(): void {
    const course = this.courseDetails();
    const user = this.authService.user();
    if (!course || !user) {
      return;
    }

    this.notesLoading.set(true);
    this.notesError.set(null);
    this.apiService
      .getStudentNotes(user.id)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.notesLoading.set(false)))
      .subscribe({
        next: (notes) => this.notes.set(notes || []),
        error: (err) => {
          console.error('Failed to load notes', err);
          this.notesError.set('Unable to load notes for this course.');
          this.notes.set([]);
        },
      });
  }

  fetchLessonQuestions(lessonId: number): void {
    this.questionsLoading.set(true);
    this.questionsError.set(null);
    this.apiService
      .getLessonQuestions(lessonId)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.questionsLoading.set(false)))
      .subscribe({
        next: (questions) => this.lessonQuestions.set(questions || []),
        error: (err) => {
          console.error('Failed to load lesson questions', err);
          this.questionsError.set('Unable to load lesson Q&A right now.');
          this.lessonQuestions.set([]);
        },
      });
  }

  private initializeQuizAttempt(lesson: Lesson): void {
    const quiz = lesson.quiz;
    if (!quiz?.questions) {
      this.quizAttempt.set({});
      return;
    }

    const initial: Record<number, number | null> = {};
    for (const question of quiz.questions) {
      initial[question.id] = null;
    }
    this.quizAttempt.set(initial);
  }

  private buildVideoUrlMap(lesson: Lesson): Record<number, SafeResourceUrl> {
    const map: Record<number, SafeResourceUrl> = {};
    for (const attachment of lesson.attachments || []) {
      if (attachment.file_type === 'video' && attachment.file_url) {
        map[attachment.id] = this.sanitizer.bypassSecurityTrustResourceUrl(
          this.normalizeVideoUrl(attachment.file_url)
        );
      }
    }
    return map;
  }

  private normalizeVideoUrl(url: string): string {
    // Normalize popular video providers to embed URLs for iframe usage.
    if (url.includes('watch?v=')) {
      return url.replace('watch?v=', 'embed/');
    }
    if (url.includes('youtu.be/')) {
      return url.replace('youtu.be/', 'www.youtube.com/embed/');
    }
    return url;
  }
}
