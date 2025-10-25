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
  role?: string;
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

interface ScheduleConfig {
  max_lessons_per_day: number;
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
  scheduled_date: string | null;
  original_scheduled_date: string | null;
}

const DEFAULT_SCHEDULE_CONFIG: ScheduleConfig = {
  max_lessons_per_day: 3,
};

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

interface CourseClass {
  id: number;
  year: number;
  name: string;
  is_active: boolean;
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
  classes: CourseClass[];
  active_class: CourseClass | null;
  schedule_config: ScheduleConfig;
}

interface ApiLessonContentResponse {
  id?: number;
  title?: string;
  content_type?: string;
  content_url?: string;
  content_text?: string;
  source?: string;
}

interface ApiLessonResponse {
  id: number;
  title?: string;
  description?: string;
  order_in_subject?: number;
  order_in_course?: number;
  subject_id?: number;
  scheduled_date?: string | null;
  contents?: ApiLessonContentResponse[];
  quiz?: Quiz | null;
  progress?: LessonProgress | null;
}

interface ApiSubjectResponse {
  id: number;
  name?: string;
  description?: string;
  order_in_course?: number;
  lessons?: ApiLessonResponse[];
}

interface ApiCourseClassResponse {
  id: number;
  year?: number;
  name?: string;
  is_active?: boolean;
}

interface ApiCourseDetailsResponse {
  id: number;
  title: string;
  description: string;
  teacher_id: number;
  teacher?: Teacher | null;
  created_at: string;
  subjects?: ApiSubjectResponse[];
  live_classes?: LiveClass[];
  classes?: ApiCourseClassResponse[];
  active_class?: ApiCourseClassResponse | null;
  schedule_config?: Partial<ScheduleConfig> | null;
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
  filterDateInput = signal('');
  activeFilterDate = signal<string | null>(null);
  selectedClassId = signal<number | null>(null);

  collapsedSubjects = signal<Map<number, boolean>>(new Map());
  collapsedDays = signal<Map<string, boolean>>(new Map());
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

  showNotes = signal(true);
  showKeyboard = signal(false);

  private readonly arabicRows = [
    ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج', 'د'],
    ['ش', 'س', 'ي', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ك', 'ط'],
    ['ئ', 'ء', 'ؤ', 'ر', 'لا', 'ى', 'ة', 'و', 'ز', 'ظ'],
  ];

  arabicKeyboardRows = computed(() => this.arabicRows);

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

  selectedClass = computed(() => {
    const details = this.courseDetails();
    const classId = this.selectedClassId();
    if (!details || classId === null) {
      return null;
    }
    return details.classes.find((courseClass) => courseClass.id === classId) ?? null;
  });

  readonly todayIso = this.toIsoDate(new Date());

  // Sort calendar days latest-first while limiting to today and earlier, with optional date filter
  calendarSchedule = computed(() => {
    const details = this.courseDetails();
    if (!details) {
      return [] as DaySchedule[];
    }

    const anchor = this.activeFilterDate();
    let schedule = details.schedule.filter((day) => day.date <= this.todayIso);

    if (anchor) {
      schedule = schedule.filter((day) => day.date === anchor);
    }

    return schedule.sort((a, b) => b.date.localeCompare(a.date));
  });

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
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const classIdParam = params.get('classId');
        if (!classIdParam) {
          this.selectedClassId.set(null);
          return;
        }

        const parsed = Number.parseInt(classIdParam, 10);
        if (Number.isNaN(parsed)) {
          this.selectedClassId.set(null);
          return;
        }

        this.selectedClassId.set(parsed);
      });

    const courseId = this.route.snapshot.params['id'];
    if (courseId) {
      this.loadCourseDetails(+courseId);
    }
  }

  loadCourseDetails(courseId: number, options?: { forceRefresh?: boolean }): void {
    const forceRefresh = options?.forceRefresh ?? false;
    this.loading.set(true);
    this.error.set(null);
    this.apiService
      .getCourseDetails(courseId, { forceRefresh })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading.set(false);
        })
      )
      .subscribe({
        next: (rawData) => {
          // Transform backend data structure to match frontend expectations
          const data = this.transformCourseData(rawData as ApiCourseDetailsResponse);

          this.courseDetails.set(data);

          const currentSelectedClassId = this.selectedClassId();
          const matchingClass = currentSelectedClassId
            ? data.classes.find((courseClass) => courseClass.id === currentSelectedClassId)
            : null;

          if (currentSelectedClassId && !matchingClass) {
            if (data.active_class) {
              this.selectedClassId.set(data.active_class.id);
            } else if (data.classes.length > 0) {
              this.selectedClassId.set(data.classes[0].id);
            } else {
              this.selectedClassId.set(null);
            }
          } else if (currentSelectedClassId === null) {
            if (data.active_class) {
              this.selectedClassId.set(data.active_class.id);
            } else if (data.classes.length > 0) {
              this.selectedClassId.set(data.classes[0].id);
            }
          }

          const collapsedMap = new Map<string, boolean>();
          data.schedule.forEach((day) => collapsedMap.set(day.date, true));
          this.collapsedDays.set(collapsedMap);
          this.loadCourseNotes();

          // Auto-select first lesson if available
          const firstAvailableDay = data.schedule.find((day) => day.date <= this.todayIso);
          if (firstAvailableDay && firstAvailableDay.lessons.length > 0) {
            this.selectLesson(firstAvailableDay.lessons[0]);
          }
        },
        error: (error) => {
          console.error('Failed to load course details:', error);
          this.error.set('Failed to load course details. Please try again.');
        },
      });
  }

  private transformCourseData(rawData: ApiCourseDetailsResponse): CourseDetails {
    const scheduleConfig = this.normalizeScheduleConfig(rawData.schedule_config);

    const classes: CourseClass[] = (rawData.classes || []).map((classData) => ({
      id: classData.id,
      year: classData.year ?? 0,
      name: classData.name ?? 'Class',
      is_active: classData.is_active ?? false,
    }));

    const activeClass: CourseClass | null = rawData.active_class
      ? {
          id: rawData.active_class.id,
          year: rawData.active_class.year ?? 0,
          name: rawData.active_class.name ?? 'Class',
          is_active: rawData.active_class.is_active ?? false,
        }
      : null;

    const subjects: Subject[] = [];
    const schedule: DaySchedule[] = [];
    const subjectOrderMap = new Map<number, number>();

    // Process subjects directly from course (new structure)
    if (rawData.subjects && Array.isArray(rawData.subjects)) {
      for (const subject of rawData.subjects) {
        const lessons: Lesson[] = [];
        const subjectOrder = subject.order_in_course ?? 0;

        // Transform lessons from new structure
        if (subject.lessons && Array.isArray(subject.lessons)) {
          for (const lessonData of subject.lessons) {
            const originalScheduledDate = lessonData.scheduled_date
              ? this.extractDate(lessonData.scheduled_date)
              : null;

            const lesson: Lesson = {
              id: lessonData.id || Math.random(),
              title: lessonData.title || 'Untitled Lesson',
              description: lessonData.description || '',
              order:
                lessonData.order_in_course ??
                lessonData.order_in_subject ??
                lessons.length + 1,
              subject_id: subject.id,
              subject_name: subject.name || 'Subject',
              attachments: (lessonData.contents || []).map(
                (content: ApiLessonContentResponse, idx: number) => ({
                  id: content.id || idx,
                  title: content.title || 'Content',
                  file_type: content.content_type || 'document',
                  file_url: content.content_url || '',
                  source: content.source || 'upload',
                  description: content.content_text || '',
                })
              ),
              quiz: lessonData.quiz || null,
              progress: lessonData.progress || null,
              scheduled_date: originalScheduledDate,
              original_scheduled_date: originalScheduledDate,
            };
            lessons.push(lesson);
          }
        }

        const sortedLessons = lessons.sort((a, b) => a.order - b.order);

        subjects.push({
          id: subject.id,
          title: subject.name || 'Untitled Subject',
          description: subject.description || '',
          order: subjectOrder,
          lessons: sortedLessons,
        });

        subjectOrderMap.set(subject.id, subjectOrder);
      }
    }

    // Build daily schedule from lessons (new structure)
    if (subjects.length > 0) {
      const maxLessonsPerDay = scheduleConfig.max_lessons_per_day;
      const slotDates = this.computeLessonSlotDates(subjects);
      const dayMap = new Map<string, Lesson[]>();

      for (const subject of subjects) {
        subject.lessons.forEach((lesson, index) => {
          const slotDate = slotDates[index] ?? this.todayIso;

          lesson.scheduled_date = slotDate;

          const existingLessons = dayMap.get(slotDate) ?? [];
          if (!existingLessons.some((candidate) => candidate.id === lesson.id)) {
            existingLessons.push(lesson);
            dayMap.set(slotDate, existingLessons);
          }
        });
      }

      const sortedDates = Array.from(dayMap.keys()).sort((a, b) => b.localeCompare(a));
      for (const dateStr of sortedDates) {
        const dayLessons = [...(dayMap.get(dateStr) || [])].sort((a, b) => {
          const subjectOrderA = subjectOrderMap.get(a.subject_id) ?? Number.MAX_SAFE_INTEGER;
          const subjectOrderB = subjectOrderMap.get(b.subject_id) ?? Number.MAX_SAFE_INTEGER;

          if (subjectOrderA !== subjectOrderB) {
            return subjectOrderA - subjectOrderB;
          }

          return a.order - b.order;
        });

        const uniqueLessons: Lesson[] = [];
        const seenSubjects = new Set<number>();
        for (const lesson of dayLessons) {
          if (seenSubjects.has(lesson.subject_id)) {
            continue;
          }
          seenSubjects.add(lesson.subject_id);
          uniqueLessons.push(lesson);
          if (uniqueLessons.length === maxLessonsPerDay) {
            break;
          }
        }

        schedule.push({
          date: dateStr,
          dateObj: new Date(dateStr),
          lessons: uniqueLessons,
        });
      }
    }

    const result: CourseDetails = {
      id: rawData.id,
      title: rawData.title,
      description: rawData.description,
      teacher_id: rawData.teacher_id,
      teacher: rawData.teacher ?? undefined,
      created_at: rawData.created_at,
      subjects,
      schedule,
      live_classes: rawData.live_classes || [],
      classes,
      active_class: activeClass,
      schedule_config: scheduleConfig,
    };

    return result;
  }

  private normalizeScheduleConfig(
    raw: Partial<ScheduleConfig> | null | undefined
  ): ScheduleConfig {
    if (!raw) {
      return { ...DEFAULT_SCHEDULE_CONFIG };
    }

    const maxLessons = raw.max_lessons_per_day;

    if (typeof maxLessons === 'number' && maxLessons > 0) {
      return { max_lessons_per_day: Math.max(1, Math.floor(maxLessons)) };
    }

    return { ...DEFAULT_SCHEDULE_CONFIG };
  }

  // Derive per-slot calendar dates so lessons in the same order index share a day in the calendar view
  private computeLessonSlotDates(subjects: Subject[]): string[] {
    if (subjects.length === 0) {
      return [];
    }

    const maxLessons = subjects.reduce((max, subject) => Math.max(max, subject.lessons.length), 0);
    if (maxLessons === 0) {
      return [];
    }

    const slotDates: (string | null)[] = Array.from({ length: maxLessons }, () => null);

    subjects.forEach((subject) => {
      subject.lessons.forEach((lesson, index) => {
        if (!lesson.original_scheduled_date) {
          return;
        }

        const normalized =
          lesson.original_scheduled_date > this.todayIso ? this.todayIso : lesson.original_scheduled_date;
        const current = slotDates[index];

        if (!current || normalized > current) {
          slotDates[index] = normalized;
        }
      });
    });

    const baseDate = new Date(this.todayIso);

    return slotDates.map((date, index) => {
      if (date) {
        return date;
      }

      const fallbackDate = new Date(baseDate);
      fallbackDate.setDate(baseDate.getDate() - index);
      return this.toIsoDate(fallbackDate);
    });
  }

  private extractDate(dateString: string): string {
    // Extract just the date part (YYYY-MM-DD)
    return dateString.split('T')[0];
  }

  lessonHasDate(lesson: Lesson | null): boolean {
    return !!lesson?.scheduled_date;
  }

  private toLocalDate(date: string | null | undefined): Date | null {
    if (!date) {
      return null;
    }
    const parts = date.split('-').map((part) => Number.parseInt(part, 10));
    if (parts.length < 3) {
      return null;
    }
    const [year, month, day] = parts;
    if ([year, month, day].some((value) => Number.isNaN(value))) {
      return null;
    }
    return new Date(year, month - 1, day);
  }

  formatLessonDay(date: string | null | undefined): string {
    const parsed = this.toLocalDate(date);
    return parsed ? parsed.getDate().toString().padStart(2, '0') : '';
  }

  formatLessonMonth(date: string | null | undefined): string {
    const parsed = this.toLocalDate(date);
    return parsed
      ? parsed
          .toLocaleDateString('en-US', {
            month: 'short',
          })
          .toUpperCase()
      : '';
  }

  toggleNotesVisibility(): void {
    this.showNotes.update((value) => !value);
  }

  toggleKeyboard(): void {
    this.showKeyboard.update((value) => !value);
  }

  insertArabicCharacter(char: string): void {
    const control = this.noteForm.controls.content;
    const textarea = document.getElementById('noteContent') as HTMLTextAreaElement | null;

    if (!textarea) {
      control.setValue((control.value ?? '') + char);
      control.markAsDirty();
      return;
    }

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const currentValue = control.value ?? '';
    const nextValue = currentValue.slice(0, start) + char + currentValue.slice(end);

    control.setValue(nextValue);
    control.markAsDirty();

    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + char.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  selectLesson(lesson: Lesson): void {
    this.selectedLesson.set(lesson);
    this.expandDayForLesson(lesson.id);
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

  toggleDay(date: string): void {
    const currentMap = this.collapsedDays();
    const newMap = new Map(currentMap);
    newMap.set(date, !this.isDayCollapsed(date));
    this.collapsedDays.set(newMap);
  }

  isDayCollapsed(date: string): boolean {
    return this.collapsedDays().get(date) ?? true;
  }

  private expandDayForLesson(lessonId: number): void {
    const schedule = this.calendarSchedule();
    const matchingDay = schedule.find((day) => day.lessons.some((lesson) => lesson.id === lessonId));
    if (!matchingDay) {
      return;
    }

    const currentMap = this.collapsedDays();
    const newMap = new Map(currentMap);
    newMap.set(matchingDay.date, false);
    this.collapsedDays.set(newMap);
  }

  selectedLessonBelongsToDay(day: DaySchedule): boolean {
    const activeLesson = this.selectedLesson();
    if (!activeLesson) {
      return false;
    }
    return day.lessons.some((lesson) => lesson.id === activeLesson.id);
  }

  selectedLessonBelongsToSubject(subjectId: number): boolean {
    const activeLesson = this.selectedLesson();
    if (!activeLesson) {
      return false;
    }
    return activeLesson.subject_id === subjectId;
  }

  // Keep dropdown selection in sync with the currently active lesson for the subject view
  selectedLessonIdForSubject(subjectId: number): number | null {
    const activeLesson = this.selectedLesson();
    if (!activeLesson || activeLesson.subject_id !== subjectId) {
      return null;
    }
    return activeLesson.id;
  }

  // Respond to dropdown selections by locating the corresponding lesson and delegating to the shared handler
  onLessonSelectionChange(subjectId: number, event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    const rawValue = target?.value ?? '';

    if (!rawValue) {
      return;
    }

    const lessonId = Number.parseInt(rawValue, 10);
    if (Number.isNaN(lessonId)) {
      return;
    }

    const subject = this.courseDetails()?.subjects.find((candidate) => candidate.id === subjectId);
    const lesson = subject?.lessons.find((candidate) => candidate.id === lessonId);

    if (lesson) {
      this.selectLesson(lesson);
    }
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

  onFilterDateInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    const value = target?.value?.trim() ?? '';

    if (!value) {
      this.filterDateInput.set('');
      return;
    }

    if (value > this.todayIso) {
      this.filterDateInput.set(this.todayIso);
      if (target) {
        target.value = this.todayIso;
      }
      return;
    }

    this.filterDateInput.set(value);
  }

  searchByDate(): void {
    const candidate = this.filterDateInput().trim();
    if (!candidate) {
      this.activeFilterDate.set(null);
      return;
    }

    if (candidate > this.todayIso) {
      return;
    }

    const details = this.courseDetails();
    if (!details) {
      return;
    }

    const matchingDay = details.schedule.find((day) => day.date === candidate && day.date <= this.todayIso);
    if (!matchingDay) {
      this.activeFilterDate.set(null);
      return;
    }

    this.activeFilterDate.set(candidate);

    if (!this.selectedLessonBelongsToDay(matchingDay) && matchingDay.lessons.length > 0) {
      this.selectLesson(matchingDay.lessons[0]);
    }
  }

  resetDateFilter(): void {
    this.filterDateInput.set('');
    this.activeFilterDate.set(null);
  }

  private toIsoDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  goBack(): void {
    this.router.navigate(['/student/courses']);
  }

  refreshCourse(): void {
    if (this.courseDetails()) {
      this.loadCourseDetails(this.courseDetails()!.id, { forceRefresh: true });
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
